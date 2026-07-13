# Week 4 — Prompt Log

All prompts given during Week 4 are recorded here. This file is updated on every push.

---

## 2026-07-13

> make a week 4 branch, add prompts.md to it, also maintain my prompts and automatically add it to the prompts.md at every push
>
> • What are AI agents? Agents vs chatbots vs copilots • Agent architecture: planner → executor → memory loop • Skills (tools/functions): defining and registering callable skills • Function calling with Claude API and OpenAI-compatible APIs • Hooks: pre/post-action interceptors in agent pipelines • Memory types: in-context, vector (ChromaDB), key-value stores • Plugins: extending agents with search, code execution, file I/O • Multi-step reasoning: chain-of-thought, ReAct pattern • Intro to LangChain & LlamaIndex (agents & retrieval) • Agentic coding tools survey: Cursor, Windsurf, Claude Code
>
> These are the concepts of week 4. I want to learn all these topics conceptually. Make a markdown file in which all of these topics are explained conceptually and examples are present. Also, you can use documentation or anything, but I want to get conceptual clarity of all of these topics.
>
> add this prompt too to the week 4 prompts.md

---

> [Screenshot of Week 4 task list: ✅ Build a research agent with a web-search skill (SerpAPI / Brave) ✅ Add memory: agent recalls facts from earlier in the session ✅ Implement a hook that logs every tool call with timestamps ✅ Add a file-read plugin: agent can read .txt / .pdf files ✅ Demo: single agent answers multi-hop questions using all of the above ✅ Update prompts.md]
>
> This is my week 4 tasks, I want to keep things simple but do all the things, provide a detail constructed plan and make a plan.md and make a progress.md as well, and push them to github, when i approve then we will start working on it

*Follow-up review feedback on the first plan draft (summarized): memory oversimplified & modeled as tools instead of internal architecture; no tool-registry abstraction; hooks underutilized (should validate, time, collect metrics); logging lacked args/duration/status; weak error handling; no retry mechanism; search behavior underspecified (snippets vs page content); file-reader security gaps (path traversal, file types, size); multi-hop demo too search-only; no prompt-design documentation; no structured output schemas (Pydantic); config not centralized; no testing strategy; hardcoded step limit; limited extensibility; no justification for custom-vs-LangChain; no architecture diagram. → Plan revised to rev 2 addressing all points.*

---

> now start executing the plan, i will rotate the api keys laterly, keep them in .env
> groq: [key shared privately — kept in .env, gitignored]
> brave: the website is down so serp api, revise the plan.md and also write the reason
> [serpapi key shared privately — kept in .env, gitignored]
> start working and test it completely before providing me

---

> did u add linting config ruff in it ?

---

> add this in the promots.md and commit push
