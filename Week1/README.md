# Veldara — Live 3D SPA

A live, 3D single-page application. The landing page is a faithful recreation of
the **Veldara** reference design, but the cinematic background is a real
**Three.js** flower (via React Three Fiber) that blooms open and closed as you
scroll. Every routed page floats **glassmorphic** panels over that same live 3D
scene.

## Stack

- **Vite** + **React 18** — fast SPA tooling
- **React Three Fiber** + **Three.js** — the live 3D flower (`FlowerScene`)
- **React Router v6** — client-side routing with a shared layout
- **ESLint (flat config)** + **Prettier** — linting & formatting
- **Vitest** + **Testing Library** — unit tests

## Requirements covered

| Requirement                            | Where                                                       |
| -------------------------------------- | ----------------------------------------------------------- |
| SPA with 3+ routes and a shared layout | `src/App.jsx`, `src/components/Layout.jsx`                  |
| A form with client-side validation     | `src/components/ContactForm.jsx`                            |
| ESLint + Prettier, clean lint pass     | `eslint.config.js`, `.prettierrc`                          |
| 3+ unit tests for a component          | `src/components/ContactForm.test.jsx` (8 tests)            |
| Live 3D + Glassmorphism design         | `FlowerScene.jsx` + `.glass` design system in `index.css`  |

### Routes

- `/` — Immersive scroll landing: the Veldara design with a live 3D flower
  background (R3F), a drifting particle field, scroll-revealed cards, and a
  final reveal — its own full-bleed layout
- `/about` — How the project was made (glassmorphism)
- `/reviews` — Website reviews (glassmorphism)
- `/contact` — Contact form with client-side validation (glassmorphism)
- `*` — 404 fallback

## Getting started

```bash
npm install      # install dependencies (the project's isolated environment)
npm run dev      # start the dev server
```

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

## Design techniques

- **Live 3D flower** — a procedural flower built in React Three Fiber: a petal
  shape extruded and arranged in three rings that `lerp` between a bud and a
  full bloom. Scroll-driven on the landing, gently auto-breathing behind the
  routed pages, and frozen for `prefers-reduced-motion` / `?static=1`.
- **Glassmorphism** — translucent, blurred `.glass` panels (navbar, cards,
  forms, footer) reveal the shared live 3D scene behind every routed page.
- **Scroll choreography** — the landing reproduces the reference experience:
  particle field, hero fade, mask-wipe card reveal, and an `IntersectionObserver`
  reveal.
