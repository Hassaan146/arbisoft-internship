"""Task 3 — a supervisor agent that routes a request to worker sub-agents.

Pattern: **plan -> delegate -> integrate** (supervisor + workers). The supervisor
uses one LLM call to break the request into ordered subtasks, each assigned to a
worker; it delegates each subtask to that worker (a research-agent Agent), then
integrates the results. All workers share one ``HookManager``, so Task 4's
tracing hook records every tool call across the whole graph.

Nothing is hardcoded: model + keys come from the research-agent config (.env),
worker roles are declared once in ``workers.py``.
"""

import json

from groq import Groq

import ra_bridge as ra
from workers import WORKER_ROLES, build_all_workers


def _roles_block() -> str:
    return "\n".join(f"- {name}: {role}" for name, role in WORKER_ROLES.items())


ROUTER_PROMPT = (
    "You are a supervisor agent. Break the user's request into the FEWEST ordered "
    "subtasks and assign each to exactly ONE worker.\n\nWorkers:\n"
    + _roles_block()
    + '\n\nReturn strict JSON: {"plan": [{"worker": "<name>", "task": "<one subtask>"}]}. '
    "Put document/file subtasks on the librarian and web/current-fact subtasks on the "
    "researcher. If one worker suffices, return a single-item plan."
)

INTEGRATE_PROMPT = (
    "You are the supervisor. Combine the worker results below into one clear, coherent "
    "answer to the user's original request. Keep sources/URLs where relevant."
)


class Supervisor:
    def __init__(self, hooks: ra.HookManager | None = None, client=None, worker_client=None) -> None:
        self.hooks = hooks if hooks is not None else ra.HookManager()
        self._client = client if client is not None else Groq(api_key=ra.settings.groq_api_key)
        self.workers = build_all_workers(self.hooks, client=worker_client)

    # ---- plan -------------------------------------------------------------

    def _plan(self, request: str) -> list[dict]:
        try:
            resp = self._client.chat.completions.create(
                model=ra.settings.model,
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=ra.settings.planner_max_tokens,
                messages=[
                    {"role": "system", "content": ROUTER_PROMPT},
                    {"role": "user", "content": request},
                ],
            )
            plan = json.loads(resp.choices[0].message.content).get("plan", [])
        except Exception:
            # Planning is best-effort: any failure (API error or bad JSON) falls
            # back to an empty plan -> the "no suitable worker" response.
            return []
        # Keep only steps that name a real worker (validate the LLM's routing).
        return [s for s in plan if isinstance(s, dict) and s.get("worker") in self.workers and s.get("task")]

    # ---- delegate ---------------------------------------------------------

    def _run_worker(self, name: str, task: str) -> str:
        """Delegate one subtask to a worker. (Task 4 wraps this with trace context.)

        A worker failure (e.g. the model emitting a malformed tool call) must not
        crash the whole graph: it becomes a readable error the supervisor can
        still integrate around — the same "errors as observations" rule the
        research-agent uses for tools."""
        try:
            return self.workers[name].run_turn(task)
        except Exception as exc:
            return f"[worker '{name}' could not complete this subtask: {type(exc).__name__}: {exc}]"

    # ---- integrate --------------------------------------------------------

    def _integrate(self, request: str, results: list[tuple[str, str, str]]) -> str:
        joined = "\n\n".join(f"[{worker}] task: {task}\n{answer}" for worker, task, answer in results)
        resp = self._client.chat.completions.create(
            model=ra.settings.model,
            temperature=0.2,
            max_tokens=ra.settings.planner_max_tokens,
            messages=[
                {"role": "system", "content": INTEGRATE_PROMPT},
                {"role": "user", "content": f"Original request:\n{request}\n\nWorker results:\n{joined}"},
            ],
        )
        return resp.choices[0].message.content or ""

    # ---- orchestrate ------------------------------------------------------

    def handle(self, request: str) -> dict:
        """Route the request through the workers. Returns {answer, plan, results}."""
        plan = self._plan(request)
        if not plan:
            return {"answer": "No suitable worker could handle this request.", "plan": [], "results": []}

        results = [
            (step["worker"], step["task"], self._run_worker(step["worker"], step["task"])) for step in plan
        ]

        # One worker -> return its answer directly (skip a needless integration call).
        if len(results) == 1:
            answer = results[0][2]
        else:
            try:
                answer = self._integrate(request, results)
            except Exception:
                # Integration failed after the workers already did their (paid)
                # work; don't discard it — return the combined worker results.
                answer = "\n\n".join(f"[{worker}] {ans}" for worker, _task, ans in results)
        return {
            "answer": answer,
            "plan": plan,
            "results": [{"worker": w, "task": t, "answer": a} for w, t, a in results],
        }
