# Week 4 — Progress

Status legend: ⬜ not started · 🔄 in progress · ✅ done

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Research agent with web-search skill (Brave) | ⬜ | `tools/search.py`: web_search + fetch_page |
| 2 | Memory: recall facts from earlier in session | ⬜ | `memory.py`: auto extraction, conflict handling, top-k injection |
| 3 | Hook logging every tool call with timestamps | ⬜ | `hooks.py`: JSONL log with args, duration, status + metrics |
| 4 | File-read plugin (.txt / .pdf) | ⬜ | `tools/files.py`: sandboxed to docs/, size cap |
| 5 | Demo: multi-hop questions using all of the above | ⬜ | `main.py --demo`: file → memory → 2-hop search → recall |
| 6 | Update prompts.md | ✅ | Updated on every push (standing rule) |

## Log

- **2026-07-13** — Concepts doc (`ai-agents-concepts.md`) written; plan reviewed (18 feedback points) and revised; `plan.md` + `progress.md` pushed. Awaiting approval to start implementation.
