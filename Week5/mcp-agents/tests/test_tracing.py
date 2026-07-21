"""Task 4 tests — the tracing layer records EVERY tool call across the graph,
attributed to the acting agent, with no network or LLM. Uses the real
research-agent ToolRegistry + a dummy tool, so it exercises the true
dispatch -> hook -> trace path. The trace file is redirected to a tmp path.
"""

from pydantic import BaseModel, Field

import ra_bridge as ra
import tracing


class _EchoIn(BaseModel):
    text: str = Field(..., description="text to echo")


def _traced_registry() -> tracing.TracingRegistry:
    registry = tracing.TracingRegistry(ra.HookManager())

    @registry.register(_EchoIn, "echo the text")
    def echo(args: _EchoIn) -> ra.ToolResult:
        return ra.ToolResult(ok=True, data=args.text)

    @registry.register(_EchoIn, "always returns an error result")
    def fail(args: _EchoIn) -> ra.ToolResult:
        return ra.ToolResult(ok=False, error="nope")

    @registry.register(_EchoIn, "always raises")
    def boom(args: _EchoIn) -> ra.ToolResult:
        raise RuntimeError("kaboom")

    return registry


def _use_tmp_trace(monkeypatch, tmp_path):
    monkeypatch.setenv("MCP_TRACE_PATH", str(tmp_path / "trace.jsonl"))


def test_records_a_dispatch_with_trace_id_and_agent(monkeypatch, tmp_path):
    _use_tmp_trace(monkeypatch, tmp_path)
    registry = _traced_registry()
    tid = tracing.start_trace(clear=True)
    with tracing.use_agent("researcher"):
        registry.dispatch("echo", '{"text": "hi"}')

    records = tracing.load_trace(trace_id=tid)
    assert len(records) == 1
    rec = records[0]
    assert rec["trace_id"] == tid
    assert rec["agent"] == "researcher"
    assert rec["tool"] == "echo"
    assert rec["status"] == "ok"
    assert rec["args"] == {"text": "hi"}
    assert "duration_ms" in rec


def test_traces_tool_calls_across_multiple_agents(monkeypatch, tmp_path):
    _use_tmp_trace(monkeypatch, tmp_path)
    registry = _traced_registry()
    tid = tracing.start_trace(clear=True)
    with tracing.use_agent("librarian"):
        registry.dispatch("echo", '{"text": "a"}')
    with tracing.use_agent("researcher"):
        registry.dispatch("echo", '{"text": "b"}')

    records = tracing.load_trace(trace_id=tid)
    assert [r["agent"] for r in records] == ["librarian", "researcher"]  # attributed per agent
    assert [r["seq"] for r in records] == [1, 2]  # ordered across the whole graph


def test_error_and_raised_tool_calls_are_recorded(monkeypatch, tmp_path):
    _use_tmp_trace(monkeypatch, tmp_path)
    registry = _traced_registry()
    tid = tracing.start_trace(clear=True)
    with tracing.use_agent("worker"):
        registry.dispatch("fail", '{"text": "x"}')  # ToolResult(ok=False)
        registry.dispatch("boom", '{"text": "y"}')  # raises -> dispatch returns an error result

    records = tracing.load_trace(trace_id=tid)
    by_tool = {r["tool"]: r for r in records}
    assert by_tool["fail"]["status"] == "error" and by_tool["fail"]["error"] == "nope"
    assert by_tool["boom"]["status"] == "error" and "kaboom" in by_tool["boom"]["error"]


def test_unknown_tool_and_invalid_args_dispatches_are_traced(monkeypatch, tmp_path):
    # These take the registry's early-return paths (no hook fires) — the whole
    # reason tracing wraps dispatch rather than using a post-hook.
    _use_tmp_trace(monkeypatch, tmp_path)
    registry = _traced_registry()
    tid = tracing.start_trace(clear=True)
    with tracing.use_agent("researcher"):
        registry.dispatch("does_not_exist", "{}")  # unknown tool
        registry.dispatch("echo", '{"wrong_field": 1}')  # arg validation fails

    records = tracing.load_trace(trace_id=tid)
    by_tool = {r["tool"]: r for r in records}
    assert by_tool["does_not_exist"]["status"] == "error"
    assert "Unknown tool" in by_tool["does_not_exist"]["error"]
    assert by_tool["echo"]["status"] == "error"
    assert "Invalid arguments" in by_tool["echo"]["error"]


def test_nothing_recorded_outside_a_trace(monkeypatch, tmp_path):
    _use_tmp_trace(monkeypatch, tmp_path)
    registry = _traced_registry()
    tracing.end_trace()  # no active trace
    with tracing.use_agent("worker"):
        registry.dispatch("echo", '{"text": "z"}')
    assert tracing.load_trace() == []


def test_render_trace_shows_agents_and_tools(monkeypatch, tmp_path):
    _use_tmp_trace(monkeypatch, tmp_path)
    registry = _traced_registry()
    tid = tracing.start_trace(clear=True)
    with tracing.use_agent("librarian"):
        registry.dispatch("echo", '{"text": "a"}')
    with tracing.use_agent("researcher"):
        registry.dispatch("echo", '{"text": "b"}')

    rendered = tracing.render_trace(trace_id=tid)
    assert tid in rendered
    assert "agent: librarian" in rendered
    assert "agent: researcher" in rendered
    assert "echo(" in rendered
