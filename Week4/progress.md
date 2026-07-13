# Week 4 — Progress

Status legend: ⬜ not started · 🔄 in progress · ✅ done

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Research agent with web-search skill | ✅ | `tools/search.py`: web_search (SerpAPI — Brave signup site was down) + fetch_page fallback |
| 2 | Memory: recall facts from earlier in session | ✅ | `memory.py`: automatic LLM fact extraction, keyed conflict handling with history, top-k injection |
| 3 | Hook logging every tool call with timestamps | ✅ | `hooks.py`: JSONL log (ts, args, duration_ms, status, error) + console echo + metrics + sandbox pre-hook |
| 4 | File-read plugin (.txt / .pdf) | ✅ | `tools/files.py`: sandboxed to docs/, traversal blocked, extension allowlist, size cap, truncation |
| 5 | Demo: multi-hop questions using all of the above | ✅ | `python main.py --demo`: txt → pdf → memory-resolved 2-hop search → memory-only summary |
| 6 | Update prompts.md | ✅ | Updated on every push (standing rule) |

## Verification

- **Unit tests:** `pytest tests/ -q` → 27 passed (no API keys needed).
- **Live demo (2026-07-13):** full 4-turn run succeeded — 6 facts auto-extracted into memory, turn 3 resolved "the company" from memory and did a 2-hop search (CEO → background), turn 4 summarized the session with zero tool calls. Metrics: read_file ×2, web_search ×2, 0 errors.
- **Negative paths:** missing .env → clean one-line error; `../` traversal → blocked by policy hook; `.exe` → rejected; invalid tool args → readable validation error returned to the model; live fetch_page → ok.

## Log

- **2026-07-13** — Concepts doc (`ai-agents-concepts.md`) written; plan reviewed (18 feedback points) and revised to rev 2; plan.md + progress.md pushed.
- **2026-07-13** — Plan rev 3: Brave → SerpAPI (Brave signup site down). Full implementation of `research-agent/` (config, models, registry, hooks, memory, tools, agent, CLI, 27 tests, docs samples incl. generated PDF). Unit + live end-to-end testing passed. All 6 tasks complete.
