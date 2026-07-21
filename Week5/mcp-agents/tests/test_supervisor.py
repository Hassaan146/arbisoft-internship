"""Task 3 tests — worker tool scopes + supervisor routing/delegation/integration.

Offline: a fake Groq client returns a scripted plan (and integration text), and
workers are replaced with fakes, so routing is asserted deterministically with no
network or keys.
"""

import json

import ra_bridge as ra
from supervisor import Supervisor
from workers import build_worker

# ---- fake supervisor Groq client -------------------------------------------


class _Resp:
    def __init__(self, content):
        self.choices = [type("C", (), {"message": type("M", (), {"content": content})()})()]


class _Completions:
    def __init__(self, plan):
        self._plan = plan
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        if "response_format" in kwargs:  # the planning call
            return _Resp(json.dumps({"plan": self._plan}))
        return _Resp("INTEGRATED ANSWER")  # the integration call


class FakeClient:
    def __init__(self, plan):
        self.chat = type("Chat", (), {"completions": _Completions(plan)})()


class FakeWorker:
    def __init__(self):
        self.seen = []

    def run_turn(self, task: str) -> str:
        self.seen.append(task)
        return f"did:{task}"


def _supervisor(plan) -> Supervisor:
    # worker_client=object() avoids constructing a real Groq client for the
    # (immediately replaced) workers; we swap in fakes after construction.
    sup = Supervisor(client=FakeClient(plan), worker_client=object())
    sup.workers = {"researcher": FakeWorker(), "librarian": FakeWorker()}
    return sup


# ---- tests ------------------------------------------------------------------


def test_workers_have_narrow_tool_subsets():
    hooks = ra.HookManager()
    researcher = build_worker("researcher", hooks, client=object())
    librarian = build_worker("librarian", hooks, client=object())
    assert set(researcher.registry.names()) == {"web_search", "fetch_page"}
    assert set(librarian.registry.names()) == {"read_file"}


def test_all_workers_share_one_hook_manager_for_tracing():
    hooks = ra.HookManager()
    researcher = build_worker("researcher", hooks, client=object())
    librarian = build_worker("librarian", hooks, client=object())
    assert researcher.registry.hooks is hooks
    assert librarian.registry.hooks is hooks


def test_routes_each_subtask_to_its_named_worker():
    plan = [
        {"worker": "librarian", "task": "read brief"},
        {"worker": "researcher", "task": "find ceo"},
    ]
    sup = _supervisor(plan)
    out = sup.handle("read the brief and find the ceo")
    assert [r["worker"] for r in out["results"]] == ["librarian", "researcher"]
    assert sup.workers["librarian"].seen == ["read brief"]
    assert sup.workers["researcher"].seen == ["find ceo"]
    assert out["answer"] == "INTEGRATED ANSWER"  # two workers -> integrated


def test_single_worker_skips_integration_call():
    sup = _supervisor([{"worker": "librarian", "task": "read brief"}])
    out = sup.handle("just read the brief")
    assert out["answer"] == "did:read brief"  # returns the worker answer directly
    assert len(sup._client.chat.completions.calls) == 1  # only the plan call, no integrate


def test_worker_failure_does_not_crash_the_graph():
    class Boom:
        def run_turn(self, task):
            raise RuntimeError("groq exploded")

    sup = _supervisor([{"worker": "researcher", "task": "search"}])
    sup.workers["researcher"] = Boom()
    out = sup.handle("search the web")
    assert "could not complete" in out["results"][0]["answer"]
    assert "groq exploded" in out["results"][0]["answer"]


def test_empty_plan_returns_no_worker_message():
    sup = _supervisor([])
    out = sup.handle("nonsense the model cannot route")
    assert out["plan"] == []
    assert "No suitable worker" in out["answer"]


def test_plan_drops_steps_naming_unknown_workers():
    sup = _supervisor([{"worker": "ghost", "task": "x"}, {"worker": "librarian", "task": "read"}])
    out = sup.handle("mixed plan")
    assert [r["worker"] for r in out["results"]] == ["librarian"]


class _RaiseOnCreate:
    """A completions stub that returns the plan but raises on the integrate call
    (integrate is the call without response_format)."""

    def __init__(self, plan, fail_on_plan=False):
        self._plan = plan
        self._fail_on_plan = fail_on_plan

    def create(self, **kwargs):
        planning = "response_format" in kwargs
        if planning and self._fail_on_plan:
            raise RuntimeError("api down")
        if planning:
            return _Resp(json.dumps({"plan": self._plan}))
        raise RuntimeError("integrate down")


def _client_with(completions) -> FakeClient:
    client = FakeClient([])
    client.chat = type("Chat", (), {"completions": completions})()
    return client


def test_integration_failure_falls_back_to_combined_worker_results():
    plan = [{"worker": "librarian", "task": "read"}, {"worker": "researcher", "task": "search"}]
    sup = Supervisor(client=_client_with(_RaiseOnCreate(plan)), worker_client=object())
    sup.workers = {"researcher": FakeWorker(), "librarian": FakeWorker()}
    out = sup.handle("do both")
    # workers already did their (paid) work; it must be preserved, not discarded
    assert "did:read" in out["answer"] and "did:search" in out["answer"]


def test_planning_api_failure_returns_no_worker_message():
    sup = Supervisor(client=_client_with(_RaiseOnCreate([], fail_on_plan=True)), worker_client=object())
    sup.workers = {"researcher": FakeWorker(), "librarian": FakeWorker()}
    out = sup.handle("anything")
    assert out["plan"] == [] and "No suitable worker" in out["answer"]


class _FlakyWorker:
    """Raises tool_use_failed for the first `fail_times` calls, then succeeds."""

    def __init__(self, fail_times: int):
        self.fail_times = fail_times
        self.calls = 0

    def run_turn(self, task: str) -> str:
        self.calls += 1
        if self.calls <= self.fail_times:
            raise RuntimeError("Error code: 400 - tool_use_failed: malformed function call")
        return f"ok:{task}"


def test_worker_retried_on_tool_use_failed_then_succeeds():
    sup = _supervisor([{"worker": "researcher", "task": "search"}])
    sup._worker_retries = 2  # pin, independent of the env
    flaky = _FlakyWorker(fail_times=2)  # fails twice, succeeds on the 3rd attempt
    sup.workers["researcher"] = flaky
    out = sup.handle("go")
    assert flaky.calls == 3  # 1 initial + 2 retries
    assert out["results"][0]["answer"] == "ok:search"


def test_worker_not_retried_on_non_tool_use_failed_error():
    class _AlwaysBoom:
        def __init__(self):
            self.calls = 0

        def run_turn(self, task: str) -> str:
            self.calls += 1
            raise RuntimeError("a genuine worker bug")

    sup = _supervisor([{"worker": "researcher", "task": "search"}])
    sup._worker_retries = 2
    boom = _AlwaysBoom()
    sup.workers["researcher"] = boom
    out = sup.handle("go")
    assert boom.calls == 1  # not retried (error is not tool_use_failed)
    assert "could not complete" in out["results"][0]["answer"]
    assert "a genuine worker bug" in out["results"][0]["answer"]
