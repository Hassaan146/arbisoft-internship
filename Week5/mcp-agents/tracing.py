"""Task 4 — a tracing layer that logs EVERY tool call across the agent graph.

The workers dispatch tools through a ``TracingRegistry`` (a thin subclass of the
research-agent's ``ToolRegistry``) whose ``dispatch`` records *every* call —
success, tool error, raised exception, policy block, **and** the pre-execution
early returns (unknown tool / invalid arguments) that a post-hook would miss.
That makes "every tool call is traced" literally true at the dispatch boundary.

Cross-agent context travels via ``contextvars``:
  * ``trace_id`` — one id per top-level request (set by the supervisor),
  * ``agent``    — which agent is currently acting (supervisor / a worker).

The supervisor sets ``agent`` around each delegation, so each recorded call is
attributed to the worker that made it. Records are appended as JSONL (path from
``MCP_TRACE_PATH`` or a default beside this file — never a hardcoded absolute),
and ``render_trace`` prints them as a supervisor → worker → tool tree.

Boundaries (documented, not bugs):
  * A model error that happens *before* a dispatch (e.g. Groq's ``tool_use_failed``,
    where the LLM never emits a valid tool call) is not a tool call and is not
    traced — there is nothing to dispatch.
  * ``contextvars`` do not auto-propagate into new threads, so if workers were run
    concurrently each worker thread would need ``contextvars.copy_context()``.
    Correct today because the supervisor runs workers sequentially.
"""

import contextvars
import json
import os
import threading
import time
import uuid
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path

import ra_bridge as ra

_trace_id: contextvars.ContextVar[str | None] = contextvars.ContextVar("trace_id", default=None)
_agent: contextvars.ContextVar[str] = contextvars.ContextVar("agent", default="root")

_DEFAULT_PATH = Path(__file__).resolve().parent / "agent_trace.jsonl"
_seq_lock = threading.Lock()
_seq: dict[str, int] = defaultdict(int)  # trace_id -> monotonically increasing span number


def trace_path() -> Path:
    """Where traces are written (env override, else beside this module)."""
    return Path(os.getenv("MCP_TRACE_PATH", str(_DEFAULT_PATH)))


def start_trace(clear: bool = False) -> str:
    """Begin a new trace (one per top-level request) and return its id. The
    default current agent becomes 'supervisor'."""
    if clear and trace_path().exists():
        trace_path().unlink()
    tid = uuid.uuid4().hex[:12]
    _trace_id.set(tid)
    _agent.set("supervisor")
    return tid


def end_trace() -> None:
    """Clear the current trace context; subsequent tool calls are not recorded."""
    tid = _trace_id.get()
    if tid is not None:
        with _seq_lock:
            _seq.pop(tid, None)  # don't let the seq map grow unbounded
    _trace_id.set(None)


class use_agent:
    """Context manager: attribute the enclosed tool calls to ``name``."""

    def __init__(self, name: str) -> None:
        self.name = name
        self._token = None

    def __enter__(self) -> "use_agent":
        self._token = _agent.set(self.name)
        return self

    def __exit__(self, *exc) -> None:
        _agent.reset(self._token)


def _next_seq(tid: str) -> int:
    with _seq_lock:
        _seq[tid] += 1
        return _seq[tid]


def _record(tool: str, args: dict, status: str, duration_ms: float, error: str | None = None) -> None:
    tid = _trace_id.get()
    if tid is None:
        return  # not inside a trace -> nothing to attribute
    record = {
        "ts": datetime.now(UTC).isoformat(timespec="milliseconds"),
        "trace_id": tid,
        "seq": _next_seq(tid),
        "agent": _agent.get(),
        "tool": tool,
        "args": args,
        "status": status,
        "duration_ms": round(duration_ms, 1),
    }
    if error:
        record["error"] = error
    try:
        path = trace_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")
    except Exception:
        # Tracing must NEVER break a tool call: a bad MCP_TRACE_PATH or an I/O
        # error silently drops the span instead of propagating out of dispatch.
        pass


def _safe_args(raw_args) -> dict:
    """Best-effort dict view of dispatch args (which may be a JSON string, a
    dict, or malformed) so even invalid-argument calls get a readable record."""
    if isinstance(raw_args, dict):
        return raw_args
    if isinstance(raw_args, str):
        try:
            parsed = json.loads(raw_args)
            return parsed if isinstance(parsed, dict) else {"_raw": raw_args}
        except json.JSONDecodeError:
            return {"_raw": raw_args}
    return {"_raw": str(raw_args)}


class TracingRegistry(ra.ToolRegistry):
    """A ToolRegistry that records EVERY ``dispatch`` into the active trace,
    attributed to the current agent. Wrapping ``dispatch`` (rather than using a
    post-hook) is what captures the unknown-tool and invalid-argument early
    returns that never reach the hooks."""

    def dispatch(self, name: str, raw_args) -> ra.ToolResult:
        start = time.perf_counter()
        result = super().dispatch(name, raw_args)
        duration_ms = (time.perf_counter() - start) * 1000
        _record(
            name,
            _safe_args(raw_args),
            "ok" if result.ok else "error",
            duration_ms,
            None if result.ok else result.error,
        )
        return result


# ---- rendering --------------------------------------------------------------


def _fmt_args(args: dict) -> str:
    parts = [f"{k}={str(v)[:40]!r}" for k, v in args.items()]
    return ", ".join(parts)


def load_trace(path=None, trace_id: str | None = None) -> list[dict]:
    p = Path(path) if path else trace_path()
    if not p.is_file():
        return []
    records = [json.loads(line) for line in p.read_text(encoding="utf-8").splitlines() if line.strip()]
    if trace_id is not None:
        records = [r for r in records if r["trace_id"] == trace_id]
    return records


def render_trace(path=None, trace_id: str | None = None) -> str:
    """Render trace records as a per-trace, grouped-by-agent tree."""
    records = load_trace(path, trace_id)
    if not records:
        return "(no trace recorded)"
    by_trace: dict[str, list[dict]] = defaultdict(list)
    for r in records:
        by_trace[r["trace_id"]].append(r)

    lines: list[str] = []
    for tid, recs in by_trace.items():
        recs.sort(key=lambda r: r["seq"])
        lines.append(f"trace {tid}  ({len(recs)} tool call(s))")
        last_agent = None
        for r in recs:
            if r["agent"] != last_agent:
                lines.append(f"  agent: {r['agent']}")
                last_agent = r["agent"]
            mark = "ok" if r["status"] == "ok" else r["status"].upper()
            lines.append(f"    - {r['tool']}({_fmt_args(r['args'])}) -> {mark} [{r['duration_ms']}ms]")
    return "\n".join(lines)
