"""Task 3 — worker sub-agents.

Each worker is a *reused* Week-4 research-agent ``Agent`` given a **narrow tool
subset** (good agent design: small, focused scopes). The role emerges from the
tools it holds: the *researcher* can search/fetch the web; the *librarian* can
only read local documents. All workers share one ``HookManager`` so a single
tracing hook (Task 4) sees every tool call across every worker.
"""

import ra_bridge as ra

# tool name -> (Pydantic input model, LLM-facing description, implementation).
# The functions are the research-agent's real tools (reused, not reimplemented).
_TOOL_SPECS = {
    "web_search": (
        ra.SearchQuery,
        "Search the web (Google) and return the top results as title/url/snippet. "
        "Use for current or factual information you don't reliably know.",
        ra.ra_web_search,
    ),
    "fetch_page": (
        ra.FetchPageInput,
        "Fetch the readable text of a specific web page. Use only when search "
        "snippets are not enough; pass a URL from a previous web_search result.",
        ra.ra_fetch_page,
    ),
    "read_file": (
        ra.ReadFileInput,
        "Read a .txt or .pdf document from the local docs/ folder by name.",
        ra.ra_read_file,
    ),
}

# Each worker role -> the tools it is allowed to use (narrow scopes).
WORKER_TOOLS: dict[str, list[str]] = {
    "researcher": ["web_search", "fetch_page"],
    "librarian": ["read_file"],
}

# One-line role descriptions the supervisor uses when routing.
WORKER_ROLES: dict[str, str] = {
    "researcher": "searches the web for current facts, people, news, and definitions",
    "librarian": "reads local documents in the docs/ folder",
}


def build_worker(name: str, hooks: ra.HookManager, client=None) -> ra.Agent:
    """Build one worker: a research-agent Agent whose registry exposes only that
    role's tools, wired to the shared ``hooks`` (so tracing/metrics see it)."""
    if name not in WORKER_TOOLS:
        raise ValueError(f"unknown worker '{name}'. Known: {list(WORKER_TOOLS)}")
    registry = ra.ToolRegistry(hooks)
    for tool_name in WORKER_TOOLS[name]:
        input_model, description, fn = _TOOL_SPECS[tool_name]
        registry.register(input_model, description)(fn)  # tool name = fn.__name__
    return ra.Agent(registry, ra.MemoryStore(), client=client)


def build_all_workers(hooks: ra.HookManager, client=None) -> dict[str, ra.Agent]:
    """All workers sharing one hook manager (one trace across the whole graph)."""
    return {name: build_worker(name, hooks, client=client) for name in WORKER_TOOLS}
