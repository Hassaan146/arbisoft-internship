// API client for the reviews backend. All data fetching goes through this
// module, so components never touch `fetch` or URLs directly.

const BASE = '/api/reviews';

/** Throws a descriptive error for non-2xx responses. */
async function parseOrThrow(response) {
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new Error(detail);
  }
  return response.status === 204 ? null : response.json();
}

/** GET /api/reviews — returns `{ items, total, limit, offset }`. */
export async function listReviews({ limit = 50, offset = 0 } = {}) {
  const res = await fetch(`${BASE}?limit=${limit}&offset=${offset}`);
  return parseOrThrow(res);
}

/** POST /api/reviews — creates a review, returns the stored record. */
export async function createReview(review) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  return parseOrThrow(res);
}

/** PUT /api/reviews/:id — full replace, returns the updated record. */
export async function updateReview(id, review) {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  return parseOrThrow(res);
}

/** DELETE /api/reviews/:id */
export async function deleteReview(id) {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return parseOrThrow(res);
}
