"""Reuse bridge to the Week 4 research-agent.

Week 5 wraps the existing research-agent rather than duplicating it. Because the
week-5 branch is rebased onto week-4, ``Week4/research-agent/`` is present in the
tree; we add it to ``sys.path`` (computed from THIS file's location — never a
hardcoded absolute path) and re-export the exact pieces Week 5 builds on. This is
the single import seam, so every other Week-5 module does ``import ra_bridge as ra``.
"""

import sys
from pathlib import Path

# Week5/mcp-agents/ra_bridge.py -> parents[2] is the repo root -> Week4/research-agent
RESEARCH_AGENT_DIR = Path(__file__).resolve().parents[2] / "Week4" / "research-agent"

if not RESEARCH_AGENT_DIR.is_dir():
    raise RuntimeError(
        f"research-agent not found at {RESEARCH_AGENT_DIR}. Week 5 reuses "
        "Week4/research-agent — ensure the week-5 branch is rebased onto week-4."
    )
if str(RESEARCH_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(RESEARCH_AGENT_DIR))

# Re-export the reuse surface (imported after sys.path is set up above).
from agent import Agent  # noqa: E402
from config import settings  # noqa: E402
from hooks import HookManager, Metrics, default_hook_manager  # noqa: E402
from memory import MemoryStore  # noqa: E402
from models import FetchPageInput, ReadFileInput, SearchQuery, ToolResult  # noqa: E402
from registry import ToolRegistry  # noqa: E402
from tools import register_all  # noqa: E402
from tools.files import read_file as ra_read_file  # noqa: E402
from tools.search import fetch_page as ra_fetch_page  # noqa: E402
from tools.search import web_search as ra_web_search  # noqa: E402

__all__ = [
    "RESEARCH_AGENT_DIR",
    "settings",
    "ToolRegistry",
    "HookManager",
    "Metrics",
    "default_hook_manager",
    "MemoryStore",
    "Agent",
    "ToolResult",
    "SearchQuery",
    "FetchPageInput",
    "ReadFileInput",
    "register_all",
    "ra_web_search",
    "ra_fetch_page",
    "ra_read_file",
]
