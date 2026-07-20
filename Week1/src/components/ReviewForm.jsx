import { useState } from 'react';
import { createReview } from '../services/reviewsApi.js';
import { validateReview, toReviewPayload } from '../utils/reviewValidation.js';

const initialValues = { name: '', role: '', quote: '', stars: '5' };

/**
 * "Share your experience" form. POSTs to the reviews API and passes the
 * stored review to `onCreated` so the page can show it immediately.
 */
export default function ReviewForm({ onCreated }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateReview(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const created = await createReview(toReviewPayload(values));
      setSubmitted(true);
      setValues(initialValues);
      if (onCreated) onCreated(created);
    } catch (err) {
      setSubmitError(err.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = (name) => `field${errors[name] ? ' has-error' : ''}`;

  return (
    <form className="form-card glass" onSubmit={handleSubmit} noValidate>
      {submitted && (
        <div className="form-success" role="status">
          ✓ Thanks! Your review is live.
        </div>
      )}
      {submitError && (
        <div className="error-text" role="alert">
          {submitError}
        </div>
      )}

      <div className={fieldClass('name')}>
        <label htmlFor="review-name">Your name</label>
        <input
          id="review-name"
          name="name"
          type="text"
          placeholder="Ada Lovelace"
          value={values.name}
          onChange={handleChange}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <span className="error-text">{errors.name}</span>}
      </div>

      <div className={fieldClass('role')}>
        <label htmlFor="review-role">Role / company</label>
        <input
          id="review-role"
          name="role"
          type="text"
          placeholder="Engineer, Analytical Engines"
          value={values.role}
          onChange={handleChange}
          aria-invalid={Boolean(errors.role)}
        />
        {errors.role && <span className="error-text">{errors.role}</span>}
      </div>

      <div className="field">
        <label htmlFor="review-stars">Rating</label>
        <select
          id="review-stars"
          name="stars"
          value={values.stars}
          onChange={handleChange}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {'★'.repeat(n)} ({n}/5)
            </option>
          ))}
        </select>
      </div>

      <div className={fieldClass('quote')}>
        <label htmlFor="review-quote">Your review</label>
        <textarea
          id="review-quote"
          name="quote"
          placeholder="What did you build with Veldara?"
          value={values.quote}
          onChange={handleChange}
          aria-invalid={Boolean(errors.quote)}
        />
        {errors.quote && <span className="error-text">{errors.quote}</span>}
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%' }}
        disabled={submitting}
      >
        {submitting ? 'Publishing…' : 'Publish review'}
      </button>
    </form>
  );
}
