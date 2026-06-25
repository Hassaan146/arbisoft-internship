const stack = [
  {
    icon: '⚛️',
    title: 'React + Vite',
    body: 'A single-page app scaffolded with Vite for instant HMR, built as a React 18 SPA with client-side routing via React Router.',
  },
  {
    icon: '🌸',
    title: 'Three.js via R3F',
    body: 'The live background is a procedural 3D flower built with React Three Fiber (@react-three/fiber) and Three.js — petals laid out in rings that bloom open and closed.',
  },
  {
    icon: '🎞️',
    title: 'Scroll choreography',
    body: 'The landing reproduces the Veldara experience: a drifting particle field, a hero that fades on scroll, cards that wipe in with a mask, and a final reveal driven by IntersectionObserver.',
  },
  {
    icon: '🧊',
    title: 'Glassmorphism',
    body: 'About, Reviews and Contact float translucent glass panels over the same live 3D scene, so the whole app shares one continuous background.',
  },
  {
    icon: '✅',
    title: 'Quality gates',
    body: 'ESLint (flat config) + Prettier keep the codebase clean, and the contact form ships with Vitest + Testing Library unit tests.',
  },
  {
    icon: '🧩',
    title: 'Forms + validation',
    body: 'The contact form validates name, email and message entirely on the client, clearing each error the moment you start fixing it.',
  },
];

const steps = [
  'Scaffolded an isolated Vite + React project and wired up React Router with a shared layout.',
  'Reproduced the Veldara landing markup and CSS one-to-one, then swapped the cinematic video for a real Three.js flower.',
  'Built the flower in React Three Fiber — a petal shape extruded and arranged in three rings that lerp between a bud and a full bloom.',
  'Added the routed glass pages (About, Reviews, Contact) over the same persistent 3D background.',
  'Locked it down with ESLint + Prettier and a suite of unit tests for the form validation.',
];

export default function About() {
  return (
    <div className="container section">
      <div className="page-head">
        <span className="eyebrow">About this build</span>
        <h1>How I made this project</h1>
        <p className="muted">
          Veldara is a live, 3D single-page application. The landing page is a
          faithful recreation of the reference design, re-backed by a real
          Three.js scene, and the rest of the app is built around it.
        </p>
      </div>

      <div className="feature-grid">
        {stack.map((s) => (
          <article key={s.title} className="feature glass">
            <div className="icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p className="muted">{s.body}</p>
          </article>
        ))}
      </div>

      <div className="glass" style={{ marginTop: 28, padding: 32 }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: 18 }}>
          The build, step by step
        </h2>
        <ol className="build-steps">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
