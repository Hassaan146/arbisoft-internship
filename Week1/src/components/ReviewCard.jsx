import { useState } from 'react';
import { GlassCard, Stars } from './ui/index.js';
import { updateReview } from '../services/reviewsApi.js';
import { validateReview, toReviewPayload } from '../utils/reviewValidation.js';

/**
 * One review card. `editable` shows a pencil button (top-right) that flips
 * the card into an inline edit form; saving PUTs to the API and reports the
 * updated review through `onUpdated`.
 */
export default function ReviewCard({ review, editable, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setValues({
      name: review.name,
      role: review.role,
      quote: review.quote,
      stars: String(review.stars),
    });
    setErrors({});
    setSaveError('');
    setEditing(true);
  }

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

  async function handleSave(e) {
    e.preventDefault();
    const found = validateReview(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setSaveError('');
    try {
      const updated = await updateReview(review.id, toReviewPayload(values));
      setEditing(false);
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      setSaveError(err.message || 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = (name) => `field${errors[name] ? ' has-error' : ''}`;

  if (editing) {
    return (
      <GlassCard as="article" className="feature review is-editing">
        <form onSubmit={handleSave} noValidate>
          {saveError && (
            <div className="error-text" role="alert">
              {saveError}
            </div>
          )}

          <div className={fieldClass('name')}>
            <label htmlFor={`edit-name-${review.id}`}>Name</label>
            <input
              id={`edit-name-${review.id}`}
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className={fieldClass('role')}>
            <label htmlFor={`edit-role-${review.id}`}>Role / company</label>
            <input
              id={`edit-role-${review.id}`}
              name="role"
              type="text"
              value={values.role}
              onChange={handleChange}
              aria-invalid={Boolean(errors.role)}
            />
            {errors.role && <span className="error-text">{errors.role}</span>}
          </div>

          <div className="field">
            <label htmlFor={`edit-stars-${review.id}`}>Rating</label>
            <select
              id={`edit-stars-${review.id}`}
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
            <label htmlFor={`edit-quote-${review.id}`}>Review</label>
            <textarea
              id={`edit-quote-${review.id}`}
              name="quote"
              value={values.quote}
              onChange={handleChange}
              aria-invalid={Boolean(errors.quote)}
            />
            {errors.quote && <span className="error-text">{errors.quote}</span>}
          </div>

          <div className="review-edit-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </GlassCard>
    );
  }

  return (
    <GlassCard as="article" className="feature review">
      {editable && (
        <button
          type="button"
          className="review-edit-btn"
          aria-label={`Edit review by ${review.name}`}
          title="Edit review"
          onClick={startEditing}
        >
          ✏️
        </button>
      )}
      <Stars count={review.stars} />
      <p className="review-quote">“{review.quote}”</p>
      <div className="review-who">
        <strong>{review.name}</strong>
        <span className="muted">{review.role}</span>
      </div>
    </GlassCard>
  );
}
