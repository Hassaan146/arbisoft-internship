export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const initialContact = {
  name: '',
  email: '',
  company: '',
  plan: 'growth',
  message: '',
};

/**
 * Pure validation for the contact form — kept in its own module so it can be
 * unit-tested in isolation and reused without pulling in the component.
 * Returns an object keyed by field name with an error message;
 * an empty object means the form is valid.
 */
export function validate(values) {
  // Thresholds: 2-char name rejects single-letter typos; 10-char message forces
  // something substantive enough to act on.
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Please enter your name.';
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.message.trim()) {
    errors.message = 'Please tell us a little about your needs.';
  } else if (values.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  }

  return errors;
}
