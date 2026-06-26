const stack = [
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
  'Reproduced the Veldara landing markup and CSS one-to-one, keeping the exact cinematic flower clip as the background.',
  'Wired the flower video to autoplay on a loop and reused it as the shared background behind the glass pages.',
  'Added the routed glass pages (About, Reviews, Contact) over the same persistent video background.',
  'Locked it down with ESLint + Prettier and a suite of unit tests for the form validation.',
];

export default function About() {
  return (
    <div className="container section">
      <div className="page-head">
        <span className="eyebrow">About this build</span>
        <h1>How I made this project</h1>
        <p className="muted">
          Veldara is a live single-page application. The landing page is a
          faithful recreation of the reference design, backed by the exact
          cinematic flower video, and the rest of the app is built around it.
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
