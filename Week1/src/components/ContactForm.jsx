import { useState } from 'react';
import { validate, initialContact } from '../utils/contactValidation.js';

export default function ContactForm({ onSubmitted }) {
  const [values, setValues] = useState(initialContact);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    // Clear the error on edit (not on submit) so fixing a field gives instant
    // positive feedback.
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);

    if (Object.keys(found).length === 0) {
      setSubmitted(true);
      if (onSubmitted) onSubmitted(values);
    }
  }

  const fieldClass = (name) => `field${errors[name] ? ' has-error' : ''}`;

  return (
    <form className="form-card glass" onSubmit={handleSubmit} noValidate>
      {submitted && (
        <div className="form-success" role="status">
          ✓ Thanks, {values.name.trim()}! Our team will reach out within one
          business day.
        </div>
      )}

      <div className={fieldClass('name')}>
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Ada Lovelace"
          value={values.name}
          onChange={handleChange}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <span className="error-text">{errors.name}</span>}
      </div>

      <div className={fieldClass('email')}>
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="ada@company.com"
          value={values.email}
          onChange={handleChange}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      <div className="field">
        <label htmlFor="company">Company (optional)</label>
        <input
          id="company"
          name="company"
          type="text"
          placeholder="Analytical Engines Ltd."
          value={values.company}
          onChange={handleChange}
        />
      </div>

      <div className="field">
        <label htmlFor="plan">Interested plan</label>
        <select
          id="plan"
          name="plan"
          value={values.plan}
          onChange={handleChange}
        >
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <div className={fieldClass('message')}>
        <label htmlFor="message">How can we help?</label>
        <textarea
          id="message"
          name="message"
          placeholder="Tell us about your data stack and goals…"
          value={values.message}
          onChange={handleChange}
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message && <span className="error-text">{errors.message}</span>}
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%' }}
      >
        Send message
      </button>
    </form>
  );
}
