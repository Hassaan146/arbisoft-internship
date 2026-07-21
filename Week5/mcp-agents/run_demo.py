"""End-to-end demo (Step 9) — exercises all four Week-5 tasks together:

  1. MCP server exposes a resource (memory://facts) + a tool (web_search),
  2. reached here through the SDK's in-memory client (same protocol Claude Code uses),
  3. a supervisor routes a request to the researcher + librarian workers,
  4. and every tool call across that graph is traced.

Real calls: Groq (planning + workers) and SerpAPI (web_search). Keys/model come
from Week4/research-agent/.env via ra_bridge — nothing hardcoded here.
"""

import asyncio
import json
import logging

from mcp.shared.memory import create_connected_server_and_client_session as connect

import mcp_server
import tracing
from supervisor import Supervisor

logging.getLogger("httpx").setLevel(logging.WARNING)  # keep the SerpAPI key out of logs

RULE = "=" * 72


async def _inspect_mcp_server() -> tuple[list[str], list[str], str]:
    async with connect(mcp_server.mcp._mcp_server) as client:
        tools = await client.list_tools()
        resources = await client.list_resources()
        facts = await client.read_resource("memory://facts")
        return (
            [t.name for t in tools.tools],
            [str(r.uri) for r in resources.resources],
            facts.contents[0].text,
        )


def main() -> None:
    print(RULE)
    print("WEEK 5 DEMO — MCP server + supervisor/workers + cross-agent tracing")
    print(RULE)

    # Tasks 1 + 2 — the MCP server, reached over the MCP protocol.
    tool_names, resource_uris, facts_json = asyncio.run(_inspect_mcp_server())
    print("\n[1+2 MCP] tools     :", tool_names)
    print("[1+2 MCP] resources :", resource_uris)
    print("[1+2 MCP] memory://facts keys:", list(json.loads(facts_json).keys()))

    # Tasks 3 + 4 — supervisor routes to workers; every tool call is traced.
    trace_file = tracing.trace_path()
    if trace_file.exists():
        trace_file.unlink()  # start the demo with a clean trace

    supervisor = Supervisor()
    request = (
        "Read company_brief.txt from the docs folder and summarize it, and separately "
        "search the web for what the Model Context Protocol (MCP) is."
    )
    print("\n[3 REQUEST]", request)
    result = supervisor.handle(request)

    print("\n[3 PLAN]")
    for step in result["plan"]:
        print(f"   - {step['worker']:10s} -> {step['task']}")

    print("\n[3 ANSWER]\n", result["answer"].strip())

    print("\n[4 TRACE]")
    print(tracing.render_trace(trace_id=result["trace_id"]))
    print("\n" + RULE)
    print("Full trace JSONL:", trace_file)


if __name__ == "__main__":
    main()
