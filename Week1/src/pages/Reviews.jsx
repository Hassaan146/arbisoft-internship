import { PageHead } from '../components/ui/index.js';
import ReviewCard from '../components/ReviewCard.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import { useReviews } from '../hooks/index.js';

export default function Reviews() {
  const { reviews, status, addReview, replaceReview } = useReviews();

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
      {status === 'error' && (
        <p className="muted" role="status">
          Reviews are unavailable right now — please try again later.
        </p>
      )}
      {status === 'live' && reviews.length === 0 && (
        <p className="muted" role="status">
          No reviews yet — be the first to share your experience below.
        </p>
      )}

      <div className="feature-grid">
        {reviews.map((r) => (
          <ReviewCard
            key={r.id ?? r.name}
            review={r}
            editable={status === 'live'}
            onUpdated={replaceReview}
          />
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
