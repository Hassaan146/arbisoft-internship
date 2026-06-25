# Veldara — Live 3D SPA

A live single-page application that faithfully recreates the **Veldara**
reference design. The landing page background is the exact cinematic flower clip,
**scroll-scrubbed** frame-by-frame as you scroll (the flower blooms open and
closed). Every routed page floats **glassmorphic** panels over that same flower
clip, so the whole app shares one continuous background.

## Stack

- **Vite** + **React 18** — fast SPA tooling
- **Scroll-scrubbed video** — canvas frame extraction with a live-seek fallback
  (`Landing`), shared as a looping background (`VideoBackground`)
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
| Live background + Glassmorphism        | `VideoBackground.jsx` + `.glass` design system in `index.css` |

### Routes

- `/` — Immersive scroll landing: the exact Veldara design with the
  scroll-scrubbed flower video, a drifting particle field, scroll-revealed
  cards, and a final reveal — its own full-bleed layout
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

- **Scroll-scrubbed flower video** — the exact reference clip, decoded into
  frames (`createImageBitmap`) and drawn to a canvas at the frame matching scroll
  position, with a live `currentTime`-seek fallback while frames decode. The same
  clip loops gently behind the glass pages (`VideoBackground`), paused for
  `prefers-reduced-motion`.
- **Glassmorphism** — translucent, blurred `.glass` panels (navbar, cards,
  forms, footer) reveal the shared flower background behind every routed page.
- **Scroll choreography** — the landing reproduces the reference experience:
  particle field, hero fade, mask-wipe card reveal, and an `IntersectionObserver`
  reveal.
