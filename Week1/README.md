# Veldara — Live 3D SPA

A live single-page application that faithfully recreates the **Veldara**
reference design. The landing page background is the exact cinematic flower clip,
**autoplaying on a seamless loop**. Every routed page floats **glassmorphic**
panels over that same flower clip, so the whole app shares one continuous,
moving background.

## Stack

- **Vite** + **React 18** — fast SPA tooling
- **Autoplaying `<video>` background** — the flower clip, force-muted and looped,
  shared via `VideoBackground` with a robust autoplay helper (`videoSource.js`)
- **React Router v6** — client-side routing with a shared layout
- **ESLint (flat config)** + **Prettier** — linting & formatting
- **Vitest** + **Testing Library** — unit tests
- **FastAPI + Pydantic** (`backend/`) — reviews CRUD API with layered
  architecture, **Ruff** linting, and **pytest** tests

## Requirements covered

| Requirement                            | Where                                                       |
| -------------------------------------- | ----------------------------------------------------------- |
| SPA with 3+ routes and a shared layout | `src/App.jsx`, `src/components/layout/Layout.jsx`           |
| A form with client-side validation     | `src/components/ContactForm.jsx`                            |
| ESLint + Prettier, clean lint pass     | `eslint.config.js`, `.prettierrc`                          |
| 3+ unit tests                          | 17 tests across `ContactForm`, `ui`, `pages`, `App` suites |
| Live background + Glassmorphism        | `VideoBackground.jsx` + `.glass` design system in `index.css` |
| Reviews CRUD API (backend)             | `backend/` — FastAPI + Pydantic, Ruff, 26 pytest tests       |

### Routes

- `/` — Immersive scroll landing: the exact Veldara design with the
  autoplaying flower video, a drifting particle field, scroll-revealed
  cards, and a final reveal — its own full-bleed layout
- `/about` — How the project was made (glassmorphism)
- `/reviews` — Website reviews, loaded live from the backend API with a
  submit form; falls back to bundled samples if the API is down (glassmorphism)
- `/contact` — Contact form with client-side validation (glassmorphism)
- `*` — 404 fallback

## Project structure

```
src/
  components/  layout/  (Layout, Navbar)
               ui/      (GlassCard, PageHead, FeatureCard, Stars, SocialLinks)
               VideoBackground.jsx  ContactForm.jsx  ReviewForm.jsx
               ErrorBoundary.jsx
  hooks/       useAutoplayVideo  useParticles  useHeroFade
               useCardScrollMask  useScrollReveal  useReviews
  services/    reviewsApi.js  (all backend calls live here)
  data/        about  reviews  contactPoints  landingCards
  pages/       Landing (+ Landing.css)  About  Reviews  Contact  NotFound
  utils/       contactValidation.js
  videoSource.js   index.css   App.jsx   main.jsx
backend/
  app/         FastAPI service: main (factory) → api/routes → services
               → repositories, with Pydantic schemas and env-based config
  tests/       pytest suite (API integration + repository unit tests)
  data/        reviews.seed.json (committed) → reviews.json (runtime)
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for a full conceptual walkthrough
and [`backend/README.md`](./backend/README.md) for the API reference.

## Getting started

```bash
npm install      # install dependencies (the project's isolated environment)
npm run dev      # start the dev server (proxies /api → localhost:8001)
```

To run the reviews API alongside it:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8001
```

The Reviews page works either way — live data with the backend running,
bundled sample data without it.

## Scripts

```bash
npm run dev          # start Vite dev server
npm run build        # production build
npm run preview      # preview the production build
npm run lint         # ESLint (clean pass)
npm run format       # Prettier write
npm run format:check # Prettier check
npm test             # run unit tests once
npm run test:watch   # run tests in watch mode
```

Backend (from `backend/`, inside its venv):

```bash
python -m uvicorn app.main:app --reload --port 8001   # run the API
python -m ruff check .                                # lint
python -m ruff format .                               # format
python -m pytest                                      # 26 backend tests
```

## Design techniques

- **Autoplaying flower video** — the exact reference clip, force-muted and
  looped, plays continuously as the background on every page. A robust autoplay
  helper retries on media-ready events, resumes when the tab becomes visible,
  and falls back to the user's first interaction if a browser blocks muted
  autoplay.
- **Glassmorphism** — translucent, blurred `.glass` panels (navbar, cards,
  forms, footer) reveal the shared flower background behind every routed page.
- **Scroll choreography** — the landing reproduces the reference experience:
  particle field, hero fade, mask-wipe card reveal, and an `IntersectionObserver`
  reveal.
