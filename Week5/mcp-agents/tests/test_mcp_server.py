"""Task 1 tests — the MCP server exposes exactly one resource + one tool, the
resource returns seeded JSON facts, and the tool is wired to the research-agent's
search. Uses the SDK's in-memory client (no subprocess) and mocks the search so
the suite needs no API keys or network (mirrors Week4/research-agent/tests).
"""

import asyncio
import json

from mcp.shared.memory import create_connected_server_and_client_session as connect

import mcp_server
import ra_bridge as ra


def _run(coro):
    return asyncio.run(coro)


def test_exposes_exactly_one_tool_and_one_resource():
    async def go():
        async with connect(mcp_server.mcp._mcp_server) as client:
            tools = await client.list_tools()
            resources = await client.list_resources()
            return [t.name for t in tools.tools], [str(r.uri) for r in resources.resources]

    tool_names, resource_uris = _run(go())
    assert tool_names == ["web_search"]
    assert resource_uris == ["memory://facts"]


def test_web_search_tool_advertises_a_query_parameter():
    async def go():
        async with connect(mcp_server.mcp._mcp_server) as client:
            tools = await client.list_tools()
            return next(t for t in tools.tools if t.name == "web_search")

    tool = _run(go())
    assert "query" in tool.inputSchema["properties"]
    assert tool.description and "search" in tool.description.lower()


def test_resource_declares_json_mime_type():
    async def go():
        async with connect(mcp_server.mcp._mcp_server) as client:
            resources = await client.list_resources()
            return next(r for r in resources.resources if str(r.uri) == "memory://facts")

    resource = _run(go())
    assert resource.mimeType == "application/json"


def test_resource_returns_valid_json_facts_seeded_from_docs():
    async def go():
        async with connect(mcp_server.mcp._mcp_server) as client:
            result = await client.read_resource("memory://facts")
            return result.contents[0].text

    text = _run(go())
    facts = json.loads(text)  # must be valid JSON
    assert isinstance(facts, dict)
    # docs/ exists in the research-agent, so the store is seeded (not empty),
    # and every value is a non-empty string preview.
    assert len(facts) >= 1
    assert all(isinstance(v, str) and v for v in facts.values())


def test_web_search_tool_dispatches_to_research_agent_search(monkeypatch):
    captured = {}

    def fake_search(args: ra.SearchQuery) -> ra.ToolResult:
        captured["query"] = args.query
        return ra.ToolResult(ok=True, data=[{"title": "T", "url": "http://u", "snippet": "S"}])

    # mcp_server calls ra.ra_web_search(...); patch it on the bridge module.
    monkeypatch.setattr(ra, "ra_web_search", fake_search)

    async def go():
        async with connect(mcp_server.mcp._mcp_server) as client:
            return await client.call_tool("web_search", {"query": "who founded anthropic"})

    result = _run(go())
    payload = json.loads(result.content[0].text)
    assert captured["query"] == "who founded anthropic"  # the model's arg reached the real tool
    assert payload["ok"] is True
    assert payload["data"][0]["title"] == "T"
