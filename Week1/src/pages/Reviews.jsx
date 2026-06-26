import { PageHead, GlassCard, Stars } from '../components/ui/index.js';
import { reviews } from '../data/reviews.js';

export default function Reviews() {
  return (
    <div className="container section">
      <PageHead
        eyebrow="Loved by builders"
        title="What people say about Veldara"
      >
        Teams shipping immersive, performant 3D on the web — here&apos;s how it
        went.
      </PageHead>

      <div className="feature-grid">
        {reviews.map((r) => (
          <GlassCard as="article" className="feature review" key={r.name}>
            <Stars count={r.stars} />
            <p className="review-quote">“{r.quote}”</p>
            <div className="review-who">
              <strong>{r.name}</strong>
              <span className="muted">{r.role}</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
