const reviews = [
  {
    quote:
      'Veldara made it absurdly easy to drop a real 3D scene into our marketing site. The scroll-driven bloom is the first thing every visitor mentions.',
    name: 'Maya Okonkwo',
    role: 'Frontend Lead, Northwind',
    stars: 5,
  },
  {
    quote:
      'The declarative Three.js API is a joy. We shipped an interactive product hero in a single afternoon instead of a sprint.',
    name: 'Daniel Roth',
    role: 'Creative Engineer, Studio Kite',
    stars: 5,
  },
  {
    quote:
      'Performance was my worry with WebGL, but Veldara stays smooth even on mid-range laptops. The reduced-motion fallback is a thoughtful touch.',
    name: 'Priya Nair',
    role: 'Accessibility Consultant',
    stars: 4,
  },
  {
    quote:
      'Glassmorphic pages over a single living background gave our whole site a cohesive, premium feel with almost no extra work.',
    name: 'Lukas Berg',
    role: 'Design Director, Atlas',
    stars: 5,
  },
  {
    quote:
      'Clean codebase, sensible defaults, and the docs actually match the API. Onboarding two juniors took an hour.',
    name: 'Sofia Marchetti',
    role: 'Engineering Manager, Verve',
    stars: 5,
  },
  {
    quote:
      'From install to a deployed 3D landing page in a day. Veldara is now our default for anything that needs to feel dimensional.',
    name: 'Tom Whitaker',
    role: 'Founder, Pixelforge',
    stars: 5,
  },
];

function Stars({ count }) {
  return (
    <div className="stars" aria-label={`${count} out of 5 stars`}>
      {'★'.repeat(count)}
      <span className="stars-empty">{'★'.repeat(5 - count)}</span>
    </div>
  );
}

export default function Reviews() {
  return (
    <div className="container section">
      <div className="page-head">
        <span className="eyebrow">Loved by builders</span>
        <h1>What people say about Veldara</h1>
        <p className="muted">
          Teams shipping immersive, performant 3D on the web — here&apos;s how
          it went.
        </p>
      </div>

      <div className="feature-grid">
        {reviews.map((r) => (
          <article key={r.name} className="feature glass review">
            <Stars count={r.stars} />
            <p className="review-quote">“{r.quote}”</p>
            <div className="review-who">
              <strong>{r.name}</strong>
              <span className="muted">{r.role}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
