# Week 5 — MCP & Multi-Agent Systems: Conceptual Guide

A concept-first walkthrough of the Week 5 syllabus. Each section explains the *idea*, *why it exists*, and *how it works*, with small examples. The goal is full understanding — enough that you can defend every design choice, not just recite it. Code samples are Python/JSON unless noted.

---

## Table of Contents

1. [Model Context Protocol (MCP): fundamentals, transport, capabilities](#1-model-context-protocol-mcp)
2. [Building MCP servers: resources, tools, and prompts](#2-building-mcp-servers)
3. [Connecting MCP clients to existing apps](#3-connecting-mcp-clients)
4. [Multi-agent orchestration: supervisor + worker, hand-offs](#4-multi-agent-orchestration)
5. [Tool design for agents: names, scopes, error messages](#5-tool-design-for-agents)
6. [Agent debugging: tracing, replaying, isolating failures](#6-agent-debugging)
7. [Cost & latency strategy for multi-agent systems](#7-cost--latency-strategy)
8. [Recap (Web track): structured outputs & output validation as guardrails](#8-structured-outputs--validation)

---

## 1. Model Context Protocol (MCP)

### The core idea

**MCP is a standard way for an AI application to talk to external tools and data.** Think of it as **"USB-C for AI apps"**: one connector shape, so any compliant client (Claude Desktop, Claude Code, Cursor, …) can plug into any compliant server (a GitHub server, a Postgres server, your custom server) without custom glue each time.

The one-line mental model:

> **MCP = a client–server protocol that lets an LLM app discover and use capabilities exposed by external servers, over a well-defined message format.**

### Why it exists — the M×N problem

Before MCP, every AI app integrated every tool with **bespoke code**. If you have **M** apps and **N** tools, you write **M×N** integrations. Each one reinvents auth, schemas, error handling, streaming.

MCP turns that into **M+N**: each app implements the MCP *client* side once; each tool implements the MCP *server* side once. Any client works with any server.

```
Without MCP (M×N):              With MCP (M+N):

App1 ─┬─ GitHub                App1 ─┐            ┌─ GitHub-server
      ├─ Slack                 App2 ─┼─ MCP ─────┼─ Slack-server
App2 ─┼─ GitHub                App3 ─┘  (spec)    └─ Postgres-server
      └─ Postgres
  (every line = custom code)      (every side implements the spec once)
```

This is the exact same architectural win as USB, ODBC (databases), or LSP (the Language Server Protocol that lets any editor talk to any language's tooling). MCP is deliberately modeled on LSP.

### The three roles

- **Host** — the LLM application the user interacts with (Claude Desktop, Claude Code, an IDE). It owns the model and the conversation.
- **Client** — a connector *inside* the host. The host creates **one client per server**, and each client keeps a dedicated 1:1 connection to that server. (So "host" is the app; "client" is the per-server plug.)
- **Server** — an external program that exposes capabilities (tools/resources/prompts). Can be local (a subprocess on your machine) or remote (a web service).

```
┌─────────────────── HOST (e.g. Claude Desktop) ───────────────────┐
│   the LLM + conversation                                          │
│                                                                   │
│   ┌── Client A ──┐   ┌── Client B ──┐   ┌── Client C ──┐          │
│   │  1:1 conn    │   │  1:1 conn    │   │  1:1 conn    │          │
└───┼──────────────┼───┼──────────────┼───┼──────────────┼─────────┘
    ▼              ▼   ▼              ▼   ▼              ▼
 Server A       Server B          Server C
 (filesystem)   (GitHub)          (your custom server)
```

### The wire format: JSON-RPC 2.0

MCP messages are **JSON-RPC 2.0**. There are three message shapes:

- **Request** — has an `id`, expects a response: `{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}`
- **Response** — carries the matching `id` plus a `result` or an `error`.
- **Notification** — no `id`, fire-and-forget (e.g. "the resource list changed").

Using JSON-RPC means MCP inherits a mature, language-neutral request/response + notification model instead of inventing one.

### Transport — how bytes actually move

The **protocol** (JSON-RPC messages) is separate from the **transport** (how they're carried). Two standard transports:

1. **stdio** — the host launches the server as a **child process** and talks over its stdin/stdout. Simplest, no network, ideal for **local** servers (filesystem, a local database, a CLI wrapper). Each JSON message is one line.
2. **Streamable HTTP** — the server is a **web service**; the client POSTs JSON-RPC to an endpoint, and the server can stream results back using Server-Sent Events (SSE) when it needs to push multiple messages or progress updates. This is the transport for **remote** servers.
   - *Historical note you should know for interviews:* the original spec had a separate **"HTTP + SSE"** transport. The 2025 revision replaced it with **Streamable HTTP**, which folds SSE in as an optional streaming response on a single endpoint. If you see "SSE transport" in older docs/code, that's the predecessor.

Because transport is pluggable, the *same* server logic can run locally over stdio or be deployed remotely over HTTP — you only swap the transport.

### The lifecycle: initialize → operate → shutdown

Every MCP session begins with a **capability handshake**:

1. Client sends `initialize` with its protocol version and what *it* supports.
2. Server replies with *its* protocol version and the capabilities it offers (does it have tools? resources? prompts? does it support subscriptions?).
3. Client sends an `initialized` notification. Now normal operation begins.

This negotiation is why MCP is **version-tolerant**: both sides learn what the other can do before any real work, so a newer client can still talk to an older server (and vice versa) by sticking to the overlap.

### The three server capabilities (the heart of MCP)

A server exposes up to three kinds of things. The distinction is **who is in control** — this is the single most important idea to internalize:

| Capability | Controlled by | Analogy | Example |
|---|---|---|---|
| **Resources** | **Application** | GET data / a file | "Contents of `config.yaml`", a DB row, a log file |
| **Tools** | **Model** | POST an action / a function | `create_issue()`, `run_query()`, `send_email()` |
| **Prompts** | **User** | A slash-command template | "/summarize-pr", "/write-tests" |

- **Resources** are *read-only context* the app can pull in (like attaching a file). The **application** decides when to use them — they don't have side effects.
- **Tools** are *functions the model chooses to call*. The **model** decides, at inference time, when to invoke them. These can have side effects.
- **Prompts** are *user-triggered templates* — reusable, parameterized message sequences the **user** invokes deliberately (e.g. from a menu).

There are also two **client-side** capabilities a server can *request* from the host (control flows the other direction):

- **Sampling** — the server asks the host's LLM to generate a completion for it ("please have your model summarize this"). This lets servers stay model-agnostic — they borrow the host's model instead of shipping their own API key.
- **Roots** — the client tells the server which directories/URIs it's allowed to operate within (a scoping/permission boundary).
- **Elicitation** (newer) — the server asks the host to prompt the *user* for additional input mid-operation.

> **Defense tip:** If someone asks "why not just give the model function-calling tools directly?" — the answer is *standardization and reuse*. Function calling is per-app, per-SDK. MCP makes the tool a portable server any MCP host can consume, with a negotiated lifecycle, typed schemas, and a permission model built in.

---

## 2. Building MCP Servers

### What a server actually is

A server is a small program that (a) speaks JSON-RPC over a transport and (b) registers handlers for the capabilities it offers. You rarely write the JSON-RPC plumbing yourself — you use an SDK (e.g. the Python `mcp` package's **FastMCP**, or the TypeScript SDK). You just declare tools/resources/prompts and the SDK handles `list`/`call` dispatch, schema generation, and transport.

### Minimal server (Python, FastMCP)

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather-server")   # server name shown to the host

# ---- A TOOL (model-controlled action) ----
@mcp.tool()
def get_forecast(city: str, days: int = 1) -> str:
    """Get the weather forecast for a city.

    Args:
        city: City name, e.g. "Lahore".
        days: How many days ahead (1-7).
    """
    # ... call a weather API ...
    return f"{city}: sunny, 34°C for the next {days} day(s)."

# ---- A RESOURCE (app-controlled, read-only context) ----
@mcp.resource("config://units")
def units() -> str:
    """The unit system this server reports in."""
    return "metric (Celsius, km/h)"

# ---- A PROMPT (user-triggered template) ----
@mcp.prompt()
def trip_brief(city: str) -> str:
    """Produce a short weather brief for a trip."""
    return f"Give me a 3-line weather brief for a trip to {city} tomorrow."

if __name__ == "__main__":
    mcp.run(transport="stdio")     # or "streamable-http" for remote
```

Notice what the SDK does **for free**:

- The function's **docstring** becomes the tool description the model reads.
- The **type hints** (`city: str`, `days: int = 1`) become the JSON Schema for arguments — so the host can validate calls and the model knows the shape.
- Registration means the server answers `tools/list`, `resources/list`, `prompts/list` automatically, and dispatches `tools/call` to the right function.

### The request flow for a tool call

```
1. Host → Server:  tools/list                 ("what can you do?")
2. Server → Host:  [get_forecast schema, ...]
3. (Model, given the schemas, decides to call get_forecast)
4. Host → Server:  tools/call {name:"get_forecast", args:{city:"Lahore", days:3}}
5. Server runs the Python function
6. Server → Host:  result (text / structured content)  OR  an error
7. Host feeds the result back into the model as an observation
```

### Design rules specific to *servers*

- **Resources for reading, tools for doing.** If it has side effects, it's a tool. If it's just context to pull in, it's a resource. Mixing these confuses both the model and the permission model.
- **Keep tools coarse enough to be useful, narrow enough to be safe.** (Full treatment in §5.)
- **Return good errors, not exceptions.** An unhandled exception may kill the connection; a *returned* error message lets the model recover (retry with different args). MCP distinguishes **protocol errors** (JSON-RPC `error` — malformed request, unknown method) from **tool execution errors** (the tool ran but failed — return these as tool results flagged as errors so the model can see and react).
- **Declare capabilities honestly** in the handshake so clients don't attempt unsupported operations.
- **Statelessness where possible.** Remote HTTP servers may serve many clients; avoid per-connection global state unless the transport session guarantees it.

---

## 3. Connecting MCP Clients

### The mental model

You (the developer/user) don't usually write a client from scratch — you **configure an existing host** to launch or connect to a server. The host then creates the client, runs the handshake, lists capabilities, and surfaces the tools to its model.

### Claude Desktop / Claude Code (config-file style)

Hosts read a JSON config that says *how to start each server*. For a **stdio** server it's literally a command the host will spawn:

```json
{
  "mcpServers": {
    "weather": {
      "command": "python",
      "args": ["/abs/path/to/weather_server.py"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    }
  }
}
```

- `command` + `args` = how the host launches the subprocess (stdio transport).
- `env` = secrets/config passed to the server process (keep tokens here, not in code).
- In **Claude Code** you can also add servers via the CLI (`claude mcp add ...`) and scope them to a project or your user profile; a remote server is added by URL instead of a command.

For a **remote** server, the config points at a URL (Streamable HTTP) instead of a command, and typically carries an auth header/OAuth flow.

### Cursor and other IDE hosts

Cursor uses the same idea — a settings pane / JSON where you register servers. Because everyone speaks MCP, **the same weather server you wrote works in Claude Desktop, Claude Code, and Cursor with no code changes** — only the registration differs. That portability *is* the payoff of the protocol.

### Custom clients (when you're building your own host)

If you're writing your own agent app, you use the client SDK to:

1. Start a transport (spawn the subprocess for stdio, or open the HTTP session).
2. Run `initialize` / `initialized`.
3. Call `list_tools()` and translate those schemas into your model's tool-calling format.
4. When the model emits a tool call, dispatch `call_tool(name, args)` to the right server, then feed the result back.

```python
# Sketch of a custom client loop (pseudo-Python)
async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        tools = await session.list_tools()          # discover
        # give `tools` to your LLM as its tool schema...
        # when the model calls one:
        result = await session.call_tool(name, arguments)  # dispatch
        # append result to the conversation and loop
```

The key insight: **a custom host is just an agent loop (Week 4) whose tools happen to come from MCP servers instead of being hardcoded.** MCP is the discovery + transport layer; your agent loop is unchanged.

---

## 4. Multi-Agent Orchestration

### Why more than one agent?

A single agent with 30 tools and a 5-page system prompt gets **confused**: too many choices, a bloated context, and no separation of concerns. Splitting the work across **specialized agents** — each with a focused prompt and a small tool set — is the same instinct as breaking a monolith into services. It improves reliability and makes each part debuggable in isolation.

Use multiple agents when the task has **separable sub-problems** (research vs. writing vs. reviewing) or needs **parallelism**. Don't use them when a single agent or a fixed pipeline would do — coordination has real cost (§7).

### The supervisor + worker pattern (a.k.a. orchestrator–workers)

The dominant pattern: one **supervisor** (a.k.a. orchestrator/lead) agent owns the goal and delegates to **worker** (sub-)agents.

```
                 ┌──────────────────────────┐
      goal ────► │        SUPERVISOR        │  plans, delegates,
                 │   (owns the objective)   │  integrates results
                 └───┬───────────┬──────────┘
         delegate    │           │    delegate
                     ▼           ▼
         ┌────────────────┐ ┌────────────────┐
         │   WORKER A     │ │   WORKER B     │   each: focused prompt,
         │ (e.g. search)  │ │ (e.g. code)    │   small toolset,
         └───────┬────────┘ └───────┬────────┘   own context window
                 │  result          │ result
                 └────────┬─────────┘
                          ▼
                 ┌──────────────────────────┐
                 │   SUPERVISOR integrates  │ ─► final answer
                 └──────────────────────────┘
```

- **Supervisor** decides *what* needs doing and *who* does it. It holds the high-level plan and the final synthesis. It usually does **not** do the low-level work itself.
- **Workers** are agents (or plain LLM calls) with **narrow responsibility** and their **own context window** — this is crucial: a worker's messy intermediate reasoning never pollutes the supervisor's context. The worker returns only a clean result.
- Workers can run **in parallel** when independent (three searches at once), which cuts wall-clock latency.

A common framing: the supervisor treats each worker as **a tool it can call** ("agents-as-tools"). Calling `research_subagent("history of X")` looks, to the supervisor, just like calling any other tool — but behind that tool is a whole sub-agent loop.

### Hand-offs

A **hand-off** is transferring control (and relevant context) from one agent to another. Two flavors:

- **Delegation (call-and-return):** supervisor calls a worker, worker does its job, returns a result, control comes back to the supervisor. (Orchestrator–worker.) The supervisor stays in charge.
- **Swap (control transfer):** Agent A decides Agent B should take over entirely and hands the conversation off — e.g. a triage agent routes a support chat to a billing agent, and billing now owns the dialogue. Control does *not* automatically return.

The hard part of any hand-off is **context transfer**: the receiving agent needs *enough* context to succeed but not the *entire* transcript (which is expensive and distracting). Good hand-offs pass a **compact, purpose-built brief** — the task, the constraints, the relevant facts — not a raw dump.

> **Defense tip:** "Why give each worker its own context window instead of one shared history?" — Because context is a scarce, expensive resource and models degrade as it fills with irrelevant detail ("context rot"). Isolation keeps each agent's window small, focused, and cheap, and prevents one worker's failure or verbosity from derailing the others.

### Other orchestration shapes (know they exist)

- **Router / triage:** one classifier agent routes the request to the right specialist. Cheap, common.
- **Pipeline (chaining):** output of A feeds B feeds C. Deterministic; not really "multi-agent autonomy," just staged prompts.
- **Evaluator–optimizer:** one agent produces, another critiques, loop until the critic is satisfied. Great for quality-sensitive output.
- **Parallel voting/ensemble:** run the same task N ways, aggregate.

---

## 5. Tool Design for Agents

Tools are the agent's hands. **Bad tools are the #1 cause of agent failure** — more than model quality. The model can only be as good as the interface you give it. This section is the practical craft.

### Clear names

The name is the **first thing the model reasons over**. Names should be unambiguous, action-oriented, and consistent.

- ✅ `search_customers_by_email`, `create_calendar_event`, `cancel_order`
- ❌ `do_it`, `handler`, `process`, `data2` — the model has to guess.
- Be consistent across your tool set: if one is `get_user`, don't make another `fetchOrder`. Mixed conventions make the model hesitate.
- Encode the *object* and the *action*: `verb_noun`. It reads like an API and disambiguates similar tools.

### Narrow scopes (one tool, one job)

- A tool should do **one well-defined thing**. `manage_database(action, ...)` with a mega-switch is worse than `create_row`, `read_row`, `delete_row` — the mega-tool forces the model to juggle a complex argument space and hides which operations are dangerous.
- But don't over-shatter either: if the model must call five tools in a fixed sequence every time, that sequence should probably be **one** tool. Right-size to the *unit of decision*, not the unit of code.
- Narrow scope is also a **safety boundary**: a tool that can only read is safe to expose widely; a tool that can delete deserves its own narrow, clearly-named, permission-gated surface.

### Great descriptions and schemas

The model sees the **name + description + parameter schema** — that *is* the tool, as far as it's concerned. Treat the description like documentation written for a smart but literal new hire:

- State **what it does, when to use it, and when NOT to use it.**
- Describe **each parameter**, its format, and give examples ("`date`: ISO-8601, e.g. `2026-07-15`").
- Mark required vs. optional and defaults.
- Call out side effects and irreversibility ("**Permanently** deletes; cannot be undone").

### Good error messages (the highest-leverage detail)

When a tool fails, the error text is fed **back to the model** as the next observation. A good error is **actionable** so the model can self-correct; a bad one causes flailing or giving up.

| ❌ Bad error | ✅ Good error |
|---|---|
| `Error 400` | `Invalid 'date': got "15-07-2026", expected ISO-8601 like "2026-07-15". Please retry.` |
| `null` | `No customer found with email "x@y.com". Check the spelling or use search_customers to list matches.` |
| *(throws, kills connection)* | *(returns an error result the model can read and react to)* |

Principles:
- **Say what was wrong and how to fix it.** Name the offending argument and the expected format.
- **Suggest the next action** ("use `search_customers` to find the id").
- **Fail as a value, not as a crash** — return the error to the model rather than throwing (see §2).
- **Don't leak secrets/stack traces** into the model's context; summarize instead.

### The "poka-yoke" idea (design out the mistake)

Shape tools so wrong usage is **hard by construction**: require an `absolute_path` rather than accepting relative paths the model gets wrong; make destructive tools demand an explicit confirmation token; use enums instead of free-text where only a few values are valid. The best error message is the one you made impossible to trigger.

> **Defense tip:** "How do you know your tools are good?" — Read the transcripts (§6). If the model repeatedly mis-formats an argument, retries the same call, or picks the wrong tool, that's a **tool-design bug**, not a model bug. Fix the name/description/error, and the failure disappears.

---

## 6. Agent Debugging

Agents fail in ways ordinary programs don't: the "bug" is often a bad *decision*, spread across many LLM calls, and **non-deterministic**. Debugging is therefore about **observability** — making the invisible reasoning visible.

### Tracing tool calls

A **trace** is the full, ordered record of what happened in a run: every model input, every tool call with its exact arguments, every result/error, timing, and token counts. This is the agent equivalent of a stack trace + request log.

What to log for each step:
- The **messages sent to the model** (system prompt + history) — so you can see what it actually knew.
- The **tool call**: name + arguments (the model's decision).
- The **tool result or error** (the observation).
- **Metadata**: latency, tokens in/out, cost, which agent (in multi-agent systems), a run/trace id.

Tools like **LangSmith**, LangFuse, or OpenTelemetry-based tracing render this as a timeline/tree you can click through. Even a plain structured log (one JSON line per step) is enormously better than nothing.

### Reading a trace — what you're hunting for

- **Wrong tool chosen** → tool names/descriptions overlap or are unclear (§5).
- **Right tool, wrong arguments** → schema/description unclear, or the model lacked context.
- **Loops / repeated identical calls** → the error message wasn't actionable, so the model retries blindly (§5).
- **Context bloat** → the window is full of stale results; consider summarization or worker isolation (§4, §7).
- **Silent wrong answer** → the model fabricated instead of calling a tool → tighten the prompt or add validation (§8).

### Replaying transcripts

Because a run is *just* a sequence of messages, you can **save and replay** it. Two big uses:

1. **Deterministic re-run:** feed the exact same transcript up to step *k*, then change one thing (a tool's output, the prompt wording, the model) and see if the outcome improves. This turns a flaky, non-deterministic system into something you can iterate on like a normal bug.
2. **Regression tests / evals:** curate real transcripts that once failed, and replay them after every change to confirm you didn't reintroduce the bug. This is how you keep agents from silently regressing.

### Isolating failures (bisecting the pipeline)

In a multi-step or multi-agent system, first answer **"which step/agent failed?"** before **"why?"**:

- **Run components in isolation.** Give the worker agent the *exact* input the supervisor gave it and see if it fails standalone. If it does → the worker is the bug. If it doesn't → the bug is in what the supervisor *passed* (a context/hand-off bug).
- **Pin the non-determinism.** Set temperature low and fix seeds where possible while debugging, so a failure reproduces.
- **Shrink the case.** Strip the transcript to the minimal steps that still reproduce the failure — the agent version of a minimal repro.
- **Check the boundaries first.** Most multi-agent bugs live at the **hand-off** (wrong/insufficient context passed) or in **tool I/O** (bad args, unhandled error), not inside the model's "thinking."

> **Defense tip:** The mindset is *"the model did exactly what its inputs told it to."* When it misbehaves, don't blame the model first — find the input (prompt, tool description, hand-off context, tool result) that made that behavior the reasonable choice. The trace shows you that input.

---

## 7. Cost & Latency Strategy

Multi-agent systems can burn **10–15× the tokens** of a single chat, because every agent re-reads context, sub-agents run in parallel, and orchestration adds overhead. Cost and latency are **design constraints**, not afterthoughts. The core question: **where is a token worth spending?**

### Where the tokens actually go

- **Context size × number of calls.** Every LLM call pays for its *entire* input context each time. In an agent loop, history grows every step, so late steps are the most expensive. Multi-agent multiplies this across agents.
- **Redundant re-reading.** A supervisor that stuffs full worker transcripts back into its context pays for that verbosity on every subsequent step.
- **Model tier.** A frontier model costs many times more per token than a small one.

### Strategies (roughly highest-leverage first)

1. **Right-size the model per role.** Use a **cheap, fast model for narrow/simple work** (routing, classification, extraction, a well-scoped worker) and reserve the **expensive frontier model for hard reasoning** (the supervisor's planning, ambiguous synthesis). This single decision often dominates the bill. "Where to spend tokens" ≈ "which steps deserve the big model."
2. **Control context growth.**
   - **Summarize/compact** long histories instead of carrying every raw message.
   - **Isolate worker context** (§4): workers return a *clean result*, not their scratch work, so the supervisor's window stays small.
   - Pull in resources **on demand** rather than pre-loading everything.
3. **Prompt caching.** If a large chunk of context (system prompt, tool definitions, a big document) is reused across calls, cache it so you don't re-pay full price to re-read it. Huge for agent loops where the system prompt is constant.
4. **Parallelize for latency (not cost).** Running independent workers concurrently doesn't reduce tokens, but it cuts **wall-clock** time. Trade: more simultaneous spend, faster answer.
5. **Cap the loop.** Set a max-steps / max-tokens / max-cost budget per run so a confused agent can't loop forever and drain money. Fail gracefully at the cap.
6. **Don't reach for multi-agent unless it pays.** The cheapest orchestration is the one you didn't build. A single well-tooled agent, or a deterministic pipeline, is often cheaper *and* more reliable. Add agents only where parallelism or specialization clearly earns its keep.

### The trade-off triangle

```
        QUALITY
         /    \
        /      \    You usually get to pick two.
       /        \   Multi-agent buys quality + (via parallelism)
   COST ──────── LATENCY   speed, by spending tokens.
```

Every knob — model tier, number of agents, context size, parallelism — moves you around this triangle. Naming *which* corner you're optimizing for makes the design defensible.

> **Defense tip:** "Why is this cheap where it can be and expensive where it must be?" is the sentence you want to be able to say about your own system. Point at each role and justify its model tier and its context size.

---

## 8. Structured Outputs & Validation (Web-track recap)

### The problem

An LLM emits **text**. Your web app needs **data** — a specific JSON object your code can rely on. If the model returns prose, a missing field, or slightly malformed JSON, downstream code breaks. In an *agentic* system this is worse: one agent's output is the next agent's input, so a malformed hand-off corrupts everything after it. **Structured outputs + validation are the guardrail** that keeps the free-form model plugged into rigid code.

### Structured outputs — getting reliable shape

Ways to make the model emit a defined shape, weakest to strongest:

1. **Ask nicely in the prompt** ("respond as JSON with keys `x`, `y`"). Works often, guarantees nothing.
2. **Tool/function calling.** Define the output as a tool's input schema; the model "calls the tool" and the provider ensures the arguments match the schema. This is the pragmatic default and reuses the same schema machinery as §5.
3. **Native structured-output / JSON mode.** Many providers can *constrain* generation to a supplied JSON Schema so the result is guaranteed parseable and schema-conformant. Strongest guarantee when available.

You typically define the schema once with a model like **Pydantic** (Python) or **Zod** (TS) and hand it to whichever mechanism you use.

```python
from pydantic import BaseModel, Field

class SupportTicket(BaseModel):
    category: str = Field(description="one of: billing, technical, account")
    urgency: int  = Field(ge=1, le=5)
    summary: str

# The schema drives BOTH the model's output format AND the validation below.
```

### Validation — trust but verify

Even "guaranteed" JSON can be **semantically** wrong: valid shape, nonsense content (urgency 5 for "how are you?", a category outside your enum, a hallucinated order id). **Structure ≠ correctness.** So you validate in layers:

1. **Syntactic:** does it parse as JSON? (parse mode / try/except)
2. **Schema:** do types, required fields, enums, ranges hold? (Pydantic/Zod does this on parse.)
3. **Semantic / business rules:** does it make sense against reality? (Is that `order_id` actually in the DB? Is the total ≥ 0? Does the category exist?)

```python
try:
    ticket = SupportTicket.model_validate_json(model_output)  # (1)+(2)
except ValidationError as e:
    # feed the error BACK to the model to self-correct (retry loop)
    ...
if ticket.category not in KNOWN_CATEGORIES:                    # (3)
    raise BusinessRuleError(...)
```

### Validation as an *agent guardrail*

Tie it back to agents (this is the "recap" point): validation isn't just input hygiene, it's a **control mechanism**.

- **Reject-and-retry:** if output fails validation, feed the validation error back to the model as an observation and let it try again — the same actionable-error principle as tool design (§5).
- **Guard the hand-off:** validate a worker's output *before* it enters the supervisor's context, so bad data never propagates (§4).
- **Guard the side effect:** validate *before* a tool acts on the model's output — never let unvalidated model text drive a DELETE or a payment.
- **Fail closed:** if validation keeps failing, stop and surface an error rather than acting on garbage. A guardrail that lets bad data through isn't a guardrail.

> **Defense tip:** The one-liner is *"structured output gives me a shape I can parse; validation gives me content I can trust; together they're the seam between an unpredictable model and predictable code."* Everything web-facing depends on that seam holding.

---

## Putting it together — the Week 5 through-line

```
   MCP  ──────────────► standard way to expose tools/data (§1–2)
    │
    ▼
   Hosts/clients plug servers in (§3) ──► an agent gets portable tools
    │
    ▼
   Multiple agents split the work (§4) ──► supervisor + workers, hand-offs
    │                                        │
    │   good TOOLS make each agent reliable (§5)
    │   good TRACES make failures findable (§6)
    │   cost/latency choices make it affordable (§7)
    ▼
   Structured output + validation (§8) ──► the model's output is safe to
                                            act on and safe to hand off
```

**The single sentence to remember:** *MCP standardizes how agents get their tools; orchestration decides who uses them; tool design, tracing, and cost strategy make the system reliable and affordable; and structured-output validation is the guardrail that lets an unpredictable model drive predictable software.*
