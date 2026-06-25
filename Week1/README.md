# Nebula — AI Data Analytics SPA

A live, 3D single-page application for an AI data-analytics SaaS, built with
**React**, **React Router**, and **Three.js** (via React Three Fiber). The
landing page sits in front of a continuously animated 3D nebula, and every other
page floats **glassmorphic** panels over that same live background.

## Stack

- **Vite** + **React 18** — fast SPA tooling
- **React Three Fiber** + **drei** — the live 3D background (`Scene3D`)
- **React Router v6** — client-side routing with a shared layout
- **ESLint (flat config)** + **Prettier** — linting & formatting
- **Vitest** + **Testing Library** — unit tests

## Requirements covered

| Requirement                                   | Where                                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| SPA with 3+ routes and a shared layout        | `src/App.jsx`, `src/components/Layout.jsx` (4 routes + 404) |
| A form with client-side validation            | `src/components/ContactForm.jsx`                            |
| ESLint + Prettier, clean lint pass            | `eslint.config.js`, `.prettierrc`                          |
| 3+ unit tests for a component                 | `src/components/ContactForm.test.jsx` (9 tests)            |
| Live 3D + Glassmorphism design                | `Scene3D.jsx` + `.glass` design system in `index.css`     |

### Routes

- `/` — Immersive scroll-video landing (scroll-scrubbed cinematic background,
  drifting particle field, scroll-revealed cards) in its own full-bleed layout
- `/dashboard` — Glassmorphic analytics overview
- `/pricing` — Glassmorphic pricing tiers
- `/contact` — Glassmorphic contact form with validation
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

- **Glassmorphism** — translucent, blurred `.glass` panels (navbar, cards,
  forms, footer) reveal the shared live 3D background behind every page.
- **Live 3D** — morphing icosahedron "crystals", an additive-blended particle
  field, drifting stars, and pointer parallax, all rendered with React Three
  Fiber and persisted across route changes.
