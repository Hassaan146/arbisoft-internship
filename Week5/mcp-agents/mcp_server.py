"""Task 1 — a custom MCP server that wraps the Week 4 research-agent.

Exposes exactly one resource and one tool (the Week-5 requirement):

  * resource  ``memory://facts``     -> the agent's live session-memory facts
  * tool      ``web_search(query)``  -> the research-agent's real web search

Runs over **stdio** so any MCP host (e.g. Claude Code) can launch it as a
subprocess. Nothing is hardcoded: the SerpAPI key and model come from the
research-agent's config (``.env``), and the seed facts are read from the
``docs/`` folder at startup — no literal facts in code.

Note: stdout is the JSON-RPC channel for stdio transport, so this module must
never ``print``. We call the underlying tools directly (not via the registry,
whose logging hook prints), keeping stdout clean.
"""

import json
import logging

from mcp.server.fastmcp import FastMCP

import ra_bridge as ra

# httpx logs each request URL at INFO; SerpAPI carries the API key in the query
# string, so quiet it to WARNING to keep the key out of logs/stderr.
logging.getLogger("httpx").setLevel(logging.WARNING)

mcp = FastMCP("agentika-research")

# One shared in-memory store = the "app resource". Seeded from the agent's own
# documents so the resource is populated and dynamic (never hardcoded facts).
_memory = ra.MemoryStore()


def _seed_memory_from_docs() -> None:
    docs_dir = ra.settings.docs_dir
    if not docs_dir.is_dir():
        return
    for path in sorted(docs_dir.iterdir()):
        if path.suffix.lower() not in {".txt", ".pdf"}:
            continue
        result = ra.ra_read_file(ra.ReadFileInput(path=path.name))
        if result.ok and isinstance(result.data, dict):
            preview = str(result.data.get("content", "")).strip()[:200]
            if preview:
                _memory.remember(path.stem, preview, source_turn=0)


_seed_memory_from_docs()


@mcp.resource("memory://facts")
def memory_facts() -> str:
    """The research agent's current session-memory facts as a JSON object
    (``{key: value}``), seeded from its documents and updated as the agent
    learns."""
    facts = {fact.key: fact.value for fact in _memory.facts}
    return json.dumps(facts, ensure_ascii=False, indent=2)


@mcp.tool()
def web_search(query: str) -> str:
    """Search the web (Google via SerpAPI) and return the top results as JSON.

    Args:
        query: What to search for, e.g. "current CEO of Anthropic".
    """
    result = ra.ra_web_search(ra.SearchQuery(query=query))
    return result.to_model_text()


if __name__ == "__main__":
    mcp.run()  # stdio transport (default)
