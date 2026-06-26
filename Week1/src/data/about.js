// Content for the About page — kept separate from presentation.

export const stack = [
  {
    icon: '⚛️',
    title: 'React + Vite',
    body: 'A single-page app scaffolded with Vite for instant HMR, built as a React 18 SPA with client-side routing via React Router.',
  },
  {
    icon: '🌸',
    title: 'Cinematic flower video',
    body: 'The live background is the exact flower clip from the reference design, autoplaying on a seamless loop and shared across every page for one continuous backdrop.',
  },
  {
    icon: '🎞️',
    title: 'Scroll choreography',
    body: 'The landing reproduces the Veldara experience: a drifting particle field, a hero that fades on scroll, cards that wipe in with a mask, and a final reveal driven by IntersectionObserver.',
  },
  {
    icon: '🧊',
    title: 'Glassmorphism',
    body: 'About, Reviews and Contact float translucent glass panels over the same live background, so the whole app shares one continuous scene.',
  },
  {
    icon: '✅',
    title: 'Quality gates',
    body: 'ESLint (flat config) + Prettier keep the codebase clean, and the SPA ships with Vitest + Testing Library unit tests.',
  },
  {
    icon: '🧩',
    title: 'Forms + validation',
    body: 'The contact form validates name, email and message entirely on the client, clearing each error the moment you start fixing it.',
  },
];

export const steps = [
  'Scaffolded an isolated Vite + React project and wired up React Router with a shared layout.',
  'Reproduced the Veldara landing markup and CSS one-to-one, keeping the exact cinematic flower clip as the background.',
  'Wired the flower video to autoplay on a loop and reused it as the shared background behind the glass pages.',
  'Added the routed glass pages (About, Reviews, Contact) over the same persistent video background.',
  'Refactored into reusable UI primitives and custom hooks, then locked it down with ESLint + Prettier and unit tests.',
];
