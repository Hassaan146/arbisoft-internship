# Week 5 — MCP + Multi-Agent + Tracing, Fully Explained

A complete walkthrough of this project: every file and every important
mechanism, with **What / How / Why** for each. Read top to bottom and you should
be able to defend any part of it. This builds **on top of** the Week 4
research-agent (`../../Week4/research-agent`) — Week 4 is "the agent," Week 5 is
"expose it over MCP, orchestrate it with a supervisor, and trace it."

---

## 0. The one-paragraph mental model

Week 4 built one agent (LLM + tools + a loop). Week 5 does three things around
it: (1) **publishes** two of its capabilities over the **Model Context Protocol
(MCP)** so any MCP host (Claude Code) can use them; (2) puts a **supervisor** in
front of **worker** sub-agents that each own a narrow slice of the tools; and
(3) **traces** every tool call any worker makes, tagged with which agent made it
and one id per request. Everything real (live Groq + SerpAPI), nothing hardcoded.

---

## 1. The four tasks and how they connect

```
   Claude Code ──MCP(stdio)──►  mcp_server.py        TASK 1 (server) + TASK 2 (.mcp.json)
                                 • resource memory://facts
                                 • tool     web_search
                                        │ reuse
        ┌───────────────────────────────▼──────────────────────────────┐
        │        Week4/research-agent   (imported via ra_bridge.py)     │
        │  ToolRegistry · web_search/read_file · MemoryStore · Agent    │
        └───────────▲───────────────────────────────▲──────────────────┘
                    │ reuse                           │ reuse
   TASK 3   supervisor.py ──delegates──► workers.py (researcher, librarian)
                    │                                 │
                    └── every dispatch ──► TASK 4  tracing.py (TracingRegistry
                        recorded with trace_id + agent → JSONL → render_trace)
```

The **same research-agent core** is shared by the MCP server and the workers.
The supervisor annotates the trace (trace id + current agent); the workers
dispatch tools through a `TracingRegistry` that records every call. One system,
four cooperating pieces.

---

## 2. `ra_bridge.py` — the single reuse seam

**What:** one module that makes the Week-4 research-agent importable and
re-exports the pieces Week 5 uses (`settings`, `ToolRegistry`, `Agent`,
`MemoryStore`, the tool functions, hooks, schemas).

**How:** `RESEARCH_AGENT_DIR = Path(__file__).resolve().parents[2] / "Week4" /
"research-agent"` — the path is **computed from this file's location**, never
hardcoded. It's inserted into `sys.path`, then the research-agent modules are
imported and re-exported. Every other Week-5 module does `import ra_bridge as ra`.

**Why:** DRY and "no drift" — there is exactly one copy of the tools, memory, and
loop (Week 4's), and one place that wires Week 5 to it. Because the `week-5`
branch is rebased onto `week-4`, that folder is physically present in the tree,
so an *import* (not a copy) is possible. If the folder is missing, the bridge
raises a clear error instead of a confusing `ImportError`.

---

## 3. MCP in 60 seconds (the protocol behind Task 1 & 2)

- **MCP = a standard client/server protocol** so any AI host can use any tool
  server without custom glue ("USB-C for AI apps"). Messages are JSON-RPC 2.0.
- **Transport:** here we use **stdio** — the host launches the server as a
  subprocess and talks over its stdin/stdout. (The other standard transport is
  Streamable HTTP for remote servers.)
- **Three capabilities**, distinguished by *who is in control*:
  - **Resource** = read-only context the *application* pulls in (like attaching
    a file). Here: `memory://facts`.
  - **Tool** = a function the *model* chooses to call (can have side effects).
    Here: `web_search`.
  - **Prompt** = a *user*-triggered template (not used in this project).

Internalizing "resource = app-controlled read, tool = model-controlled action"
is the key to why we exposed memory as a resource and search as a tool.

---

## 4. `mcp_server.py` — the custom MCP server (Task 1)

**What:** a FastMCP server exposing exactly **one resource** and **one tool**,
wrapping the research-agent.

**How:**
- `mcp = FastMCP("agentika-research")`; `mcp.run()` serves over stdio.
- `@mcp.resource("memory://facts", mime_type="application/json")` returns the
  current facts from a shared `MemoryStore`, as JSON. The store is **seeded at
  startup** by reading the research-agent's `docs/` (`_seed_memory_from_docs`) —
  so the resource is populated and dynamic, with **no literal facts in code**.
- `@mcp.tool() def web_search(query)` calls the research-agent's real SerpAPI
  search (`ra.ra_web_search`) and returns its JSON. FastMCP builds the tool's
  JSON schema from the function signature/docstring.

**Why the details matter:**
- **stdout is the JSON-RPC channel** for stdio, so the server must never
  `print`. We call `ra.ra_web_search`/`ra.ra_read_file` **directly** rather than
  through the registry, whose logging hook prints — that would corrupt the
  protocol stream. (A one-line comment guards this.)
- We set `logging.getLogger("httpx").setLevel(WARNING)` because SerpAPI puts the
  API key in the request URL, which httpx would otherwise log — keeping the key
  out of logs/stderr.
- The MCP schema is generated from Python, so it can't drift from the code.

---

## 5. `.mcp.json` — connecting to Claude Code (Task 2)

**What:** the repo-root config that registers the server so Claude Code
auto-discovers it.

**How:** `{"mcpServers": {"agentika-research": {"command": "...python", "args":
["...mcp_server.py"]}}}`. The paths are **relative to the repo root** (the
workspace), so there is no hardcoded absolute machine path. Claude Code launches
that command over stdio, runs the MCP handshake, and surfaces the tool + resource.

**Why:** MCP's payoff is portability — the *same* server we wrote works in any
MCP host by registration alone. Verified two ways: `claude mcp list` shows
`agentika-research` (Pending approval — the expected state for a project-scoped
server until the user approves it once), and an automated test launches the exact
config command and completes `initialize` + `list`.

---

## 6. `workers.py` — the worker sub-agents (Task 3, part 1)

**What:** ≥2 workers, each a reused research-agent `Agent` with a **narrow tool
subset**: `researcher` (web_search + fetch_page) and `librarian` (read_file).

**How:** `build_worker(name, hooks, client)` creates a `TracingRegistry` (see
§8), registers only that role's tools on it, and wraps it in an `Agent`. The
tool functions are the real Week-4 tools (reused, `__name__` gives the tool
name). `WORKER_TOOLS` (capabilities) and `WORKER_ROLES` (routing descriptions)
are the single source of truth; an import-time check keeps them in lock-step.

**Why:**
- **The role emerges from the tools.** A worker with only `read_file` *is* a
  librarian; one with web tools *is* a researcher. No per-worker prompt hacking —
  narrow tool scopes are good agent design *and* the differentiator.
- **All workers share one `HookManager`/registry class**, which is how the trace
  can see every worker's calls uniformly.

---

## 7. `supervisor.py` — plan → delegate → integrate (Task 3, part 2)

**What:** the orchestrator. Given a request, it plans subtasks, routes each to a
worker, and integrates the results.

**How, `handle(request)`:**
1. `tracing.start_trace()` — one trace id per request.
2. `_plan` — one LLM call (`response_format=json_object`) returns
   `{"plan": [{"worker","task"}]}`; only steps naming a **real** worker with a
   non-empty task survive (the LLM's routing is *validated*, not trusted).
3. For each step, `_run_worker` delegates to that worker **inside
   `tracing.use_agent(name)`** so its tool calls are attributed to it.
4. **Integrate:** one worker → return its answer directly (skip a needless LLM
   call); multiple → one LLM call combines them.
5. Returns `{answer, plan, results, trace_id}`.

**Why the robustness choices:**
- **Errors are observations, never crashes.** `_run_worker` catches worker
  failures and returns a readable note; `_plan`/`_integrate` API calls are
  guarded so a transient error can't crash `handle` or *discard already-completed
  (paid) worker work* (it falls back to the combined worker results).
- **Bounded retry** (`WORKER_RETRIES`, default 2) on Groq's intermittent
  `tool_use_failed` — the llama model sometimes emits a malformed tool call;
  retrying the delegation recovers it, while any *other* error fails fast.
- Model/keys come from `ra.settings` (`.env`) — nothing hardcoded.

---

## 8. `tracing.py` — log every tool call across the graph (Task 4)

**What:** records **every** tool call any agent makes, attributed to that agent,
with one id per request; plus a tree renderer.

**How:**
- Context travels via **`contextvars`**: `trace_id` (set by the supervisor per
  request) and `agent` (set by `use_agent(name)` around each delegation).
- **`TracingRegistry(ra.ToolRegistry)`** overrides `dispatch`: it times
  `super().dispatch(...)` and writes a JSONL span (`ts, trace_id, seq, agent,
  tool, args, status, duration_ms, error`). Workers dispatch through it, so every
  call is recorded automatically.
- `render_trace` groups spans by trace then agent into a
  supervisor → worker → tool tree. Path from `MCP_TRACE_PATH` or a `__file__`-
  derived default.

**Why wrap `dispatch` instead of using a post-hook?** A post-hook only fires when
a tool *runs*. The registry's early returns — **unknown tool** and **invalid
arguments** — never reach the hooks, so a malformed tool call would be invisible
in the trace. Wrapping `dispatch` captures *every* outcome (success, tool error,
raised exception, policy block, **and** those early returns), making "every tool
call is traced" literally true. The write is `mkdir`-guarded and `try/except`-ed
so a bad `MCP_TRACE_PATH` can never break a tool call (dispatch keeps its "never
raises" contract).

**Documented boundaries (not bugs):** a model error *before* any dispatch (Groq's
`tool_use_failed`, where no valid tool call is emitted) is not a tool call and is
not traced. And `contextvars` don't auto-propagate into new threads, so
concurrent workers would each need `copy_context()` — fine today because the
supervisor runs workers sequentially.

---

## 9. `run_demo.py` — the end-to-end proof (Step 9)

Inspects the MCP server over the protocol (Task 1+2: lists the tool + resource,
reads `memory://facts`), then sends a two-part request through the supervisor so
**both** workers act (Task 3), and prints the **cross-agent trace** (Task 4). A
green run shows two tool calls attributed to two agents — the whole system in one
screen.

---

## 10. A full request trace — "read the brief and search for MCP"

1. **`supervisor.handle`** starts a trace (`tracing.start_trace()` → id).
2. **`_plan`** (Groq, JSON mode) → `[{librarian, "read company_brief.txt…"},
   {researcher, "search the web for MCP"}]`; both workers are real, both kept.
3. **librarian** (inside `use_agent("librarian")`) runs its `Agent.run_turn`;
   the model calls `read_file` → **`TracingRegistry.dispatch`** runs the real
   tool and writes span #1 `{agent: librarian, tool: read_file, ok}`.
4. **researcher** (inside `use_agent("researcher")`) → model calls `web_search`
   → dispatch runs real SerpAPI → span #2 `{agent: researcher, tool: web_search,
   ok}`. (If Groq had emitted `tool_use_failed`, `_run_worker` would retry.)
5. **`_integrate`** (Groq) merges both worker answers into one reply.
6. **`render_trace(trace_id)`** prints the two spans grouped by agent.

Every Week-5 concept — MCP resource/tool, reuse, routing, delegation,
integration, and per-agent tracing — appears exactly once in that path.

---

## 11. Testing (why it's trustworthy without keys)

23 tests, no network/keys, mirroring the research-agent's fake-client style:
- **MCP** (`test_mcp_server.py`): in-memory SDK client asserts exactly one tool +
  one resource, JSON mime, seeded facts, and that the tool dispatches the model's
  arg (search mocked).
- **Claude Code** (`test_claude_code_config.py`): the committed `.mcp.json` is
  valid and its exact command launches a working server (subprocess handshake).
- **Supervisor** (`test_supervisor.py`): fake Groq + fake workers assert routing,
  narrow scopes, shared hooks, single-worker skip, and failure resilience.
- **Tracing** (`test_tracing.py`): real registry + dummy tools assert every
  dispatch (incl. unknown-tool / invalid-args) is recorded with trace id + agent,
  ordered, and rendered.

---

## 12. Cross-cutting principles

1. **Reuse, don't reimplement** — one research-agent core, imported via
   `ra_bridge`. Week 5 adds an MCP face, an orchestrator, and a tracer around it.
2. **Nothing hardcoded** — keys/model from `.env`, paths from `__file__`, MCP
   schemas from Pydantic, trace path/retries/port from env.
3. **Never crash; errors are observations** — worker failures, guarded LLM calls,
   and a tracing write that can't take down a tool call.
4. **Standardize the boundary** — MCP makes the tool portable to any host; the
   `TracingRegistry` makes every dispatch observable in one place.

---

**If you can explain §3 (MCP resource vs tool), §7 (plan→delegate→integrate), and
§8 (why tracing wraps `dispatch`), you understand this project end to end.**
