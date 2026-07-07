import { PageHead, GlassCard, Stars } from '../components/ui/index.js';
import ReviewForm from '../components/ReviewForm.jsx';
import { useReviews } from '../hooks/index.js';

export default function Reviews() {
  const { reviews, status, addReview } = useReviews();

  return (
    <div className="container section">
      <PageHead
        eyebrow="Loved by builders"
        title="What people say about Veldara"
      >
        Teams shipping immersive, performant 3D on the web — here&apos;s how it
        went.
      </PageHead>

      {status === 'loading' && (
        <p className="muted" role="status">
          Loading reviews…
        </p>
      )}
      {status === 'offline' && (
        <p className="muted" role="status">
          Live reviews are unavailable right now — showing a sample instead.
        </p>
      )}

      <div className="feature-grid">
        {reviews.map((r) => (
          <GlassCard
            as="article"
            className="feature review"
            key={r.id ?? r.name}
          >
            <Stars count={r.stars} />
            <p className="review-quote">“{r.quote}”</p>
            <div className="review-who">
              <strong>{r.name}</strong>
              <span className="muted">{r.role}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {status === 'live' && (
        <section className="section" aria-label="Share your experience">
          <PageHead eyebrow="Join them" title="Share your experience" />
          <ReviewForm onCreated={addReview} />
        </section>
      )}
    </div>
  );
}
