import { useCallback, useEffect, useState } from 'react';
import { listReviews } from '../services/reviewsApi.js';
import { reviews as fallbackReviews } from '../data/reviews.js';

/**
 * Loads reviews from the API and exposes them with a load status.
 *
 * Status is one of:
 *  - 'loading'  — initial fetch in flight
 *  - 'live'     — data came from the backend
 *  - 'offline'  — backend unreachable; showing the bundled sample reviews
 *
 * `addReview(review)` prepends a newly created review to the list.
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
        // Graceful degradation: the page still works without the backend.
        if (cancelled) return;
        setReviews(fallbackReviews);
        setStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addReview = useCallback((review) => {
    setReviews((current) => [review, ...current]);
  }, []);

  return { reviews, status, addReview };
}
