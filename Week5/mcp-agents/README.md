# Week 5 — MCP Server + Multi-Agent System + Tracing

Wraps the Week 4 [research-agent](../../Week4/research-agent) and adds, on top of it:

1. **A custom MCP server** (`mcp_server.py`) exposing one resource
   (`memory://facts`) and one tool (`web_search`).
2. **Claude Code connection** via `.mcp.json` (repo root).
3. **A supervisor + worker** multi-agent system (`supervisor.py`, `workers.py`)
   that routes each request to one of ≥2 sub-agents.
4. **A tracing layer** (`tracing.py`) that logs every tool call across the whole
   agent graph with a shared trace id.

Nothing is hardcoded: API keys, model, paths, and the trace location all come
from config / `.env` (reused from the research-agent via `ra_bridge.py`), and all
connections are real (live Groq + SerpAPI).

## Setup

```bash
cd Week5/mcp-agents
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # installs mcp + research-agent deps
# Keys are reused from Week4/research-agent/.env (GROQ_API_KEY, SERPAPI_API_KEY).
```

## Run

```bash
.venv/Scripts/python mcp_server.py         # start the MCP server (stdio)
.venv/Scripts/python run_demo.py           # end-to-end: supervisor -> workers -> tools + trace
.venv/Scripts/python -m pytest tests/ -q   # unit tests (no keys needed; fakes/mocks)
```

## Connecting to Claude Code (Task 2)

The repo-root [`.mcp.json`](../../.mcp.json) registers the server so Claude Code
auto-discovers it when the **repository root** is opened as the workspace:

```json
{
  "mcpServers": {
    "agentika-research": {
      "command": "Week5/mcp-agents/.venv/Scripts/python.exe",
      "args": ["Week5/mcp-agents/mcp_server.py"]
    }
  }
}
```

Paths are **relative to the repo root** — no hardcoded machine paths. Open the
repo root as the Claude Code workspace, then `claude mcp list` shows
`agentika-research`, and the `web_search` tool + `memory://facts` resource become
available in chat.

- macOS/Linux: the interpreter is `.venv/bin/python` (not `.venv/Scripts/python.exe`).
- Alternative (registers a path without committing one):
  `claude mcp add agentika-research -- <python> Week5/mcp-agents/mcp_server.py`.

See [`CODE_EXPLAINED.md`](CODE_EXPLAINED.md) for a full why/what/how walkthrough.
