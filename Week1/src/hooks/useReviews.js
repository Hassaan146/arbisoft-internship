import { useCallback, useEffect, useState } from 'react';
import { listReviews } from '../services/reviewsApi.js';

/**
 * Loads reviews from the API and exposes them with a load status.
 *
 * Status is one of:
 *  - 'loading' — initial fetch in flight
 *  - 'live'    — data came from the backend
 *  - 'error'   — backend unreachable; nothing to show
 *
 * `addReview(review)` prepends a newly created review;
 * `replaceReview(review)` swaps an edited review in place.
 */
export function useReviews() {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    listReviews()
      .then((page) => {
        if (cancelled) return;
        setReviews(page.items);
        setStatus('live');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addReview = useCallback((review) => {
    setReviews((current) => [review, ...current]);
  }, []);

  const replaceReview = useCallback((review) => {
    setReviews((current) =>
      current.map((r) => (r.id === review.id ? review : r))
    );
  }, []);

  return { reviews, status, addReview, replaceReview };
}
