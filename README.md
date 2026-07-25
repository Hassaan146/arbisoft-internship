# Arbisoft Internship

Weekly project work completed during my internship at Arbisoft. Each week lives in its own folder with its own README, architecture notes, and prompt log.

## Weeks

### Week 1 — Veldara: Live 3D SPA

A single-page application recreating the **Veldara** reference design: a cinematic autoplaying flower-video background shared across every route, with glassmorphic panels floating over it.

- **Stack:** Vite + React 18, React Router v6, ESLint (flat config) + Prettier, Vitest + Testing Library
- **Highlights:** immersive scroll landing with a particle field and scroll-revealed cards, contact form with client-side validation, shared layout across 3+ routes, 17 unit tests
- **Details:** see [`Week1/README.md`](Week1/README.md) and [`Week1/ARCHITECTURE.md`](Week1/ARCHITECTURE.md)

## Running Week 1

```bash
cd Week1
npm install
npm run dev
```

Tests and lint:

```bash
npm test
npm run lint
```

## Repo notes

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution/workflow conventions used during the internship
- `prompts.md` (root and per-week) — a log of the AI prompts used while building each week's project
