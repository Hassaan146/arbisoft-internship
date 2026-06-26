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

## Requirements covered

| Requirement                            | Where                                                       |
| -------------------------------------- | ----------------------------------------------------------- |
| SPA with 3+ routes and a shared layout | `src/App.jsx`, `src/components/layout/Layout.jsx`           |
| A form with client-side validation     | `src/components/ContactForm.jsx`                            |
| ESLint + Prettier, clean lint pass     | `eslint.config.js`, `.prettierrc`                          |
| 3+ unit tests                          | 17 tests across `ContactForm`, `ui`, `pages`, `App` suites |
| Live background + Glassmorphism        | `VideoBackground.jsx` + `.glass` design system in `index.css` |

### Routes

- `/` — Immersive scroll landing: the exact Veldara design with the
  autoplaying flower video, a drifting particle field, scroll-revealed
  cards, and a final reveal — its own full-bleed layout
- `/about` — How the project was made (glassmorphism)
- `/reviews` — Website reviews (glassmorphism)
- `/contact` — Contact form with client-side validation (glassmorphism)
- `*` — 404 fallback

## Project structure

```
src/
  components/  layout/  (Layout, Navbar)
               ui/      (GlassCard, PageHead, FeatureCard, Stars, SocialLinks)
               VideoBackground.jsx  ContactForm.jsx  ErrorBoundary.jsx
  hooks/       useAutoplayVideo  useParticles  useHeroFade
               useCardScrollMask  useScrollReveal
  data/        about  reviews  contactPoints  landingCards
  pages/       Landing (+ Landing.css)  About  Reviews  Contact  NotFound
  utils/       contactValidation.js
  videoSource.js   index.css   App.jsx   main.jsx
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for a full conceptual walkthrough.

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
