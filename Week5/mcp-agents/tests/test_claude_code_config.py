"""Task 2 tests — the committed repo-root .mcp.json is valid, its paths resolve
from the repo root, and the exact command it declares launches a working MCP
server over stdio (the same path Claude Code takes). No API keys needed:
initialize + list only.
"""

import asyncio
import json
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

REPO_ROOT = Path(__file__).resolve().parents[3]
MCP_CONFIG = REPO_ROOT / ".mcp.json"
SERVER_NAME = "agentika-research"


def _server_entry() -> dict:
    return json.loads(MCP_CONFIG.read_text())["mcpServers"][SERVER_NAME]


def test_mcp_json_is_valid_and_registers_the_server():
    assert MCP_CONFIG.is_file(), f"{MCP_CONFIG} is missing"
    entry = _server_entry()
    assert entry["command"] and entry["args"]


def test_config_paths_resolve_from_repo_root():
    entry = _server_entry()
    assert (REPO_ROOT / entry["command"]).exists(), "interpreter in .mcp.json not found from repo root"
    assert (REPO_ROOT / entry["args"][-1]).is_file(), "server script in .mcp.json not found from repo root"


def test_config_command_launches_a_working_server():
    entry = _server_entry()
    command = str((REPO_ROOT / entry["command"]).resolve())
    args = [str((REPO_ROOT / a).resolve()) if (REPO_ROOT / a).exists() else a for a in entry["args"]]

    async def go():
        params = StdioServerParameters(command=command, args=args)
        async with (
            stdio_client(params) as (read, write),
            ClientSession(read, write) as session,
        ):
            init = await session.initialize()
            tools = await session.list_tools()
            resources = await session.list_resources()
            return (
                init.serverInfo.name,
                [t.name for t in tools.tools],
                [str(r.uri) for r in resources.resources],
            )

    name, tool_names, resource_uris = asyncio.run(go())
    assert name == SERVER_NAME
    assert tool_names == ["web_search"]
    assert resource_uris == ["memory://facts"]
