// Client-side checks shared by the create and edit review forms. They
// mirror the backend's Pydantic constraints for instant feedback only —
// the server re-validates every request.

export function validateReview(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Please enter your name.';
  if (values.role.trim().length < 2)
    errors.role = 'Please add your role or company.';
  if (values.quote.trim().length < 10)
    errors.quote = 'Reviews need at least 10 characters.';
  return errors;
}

/** Normalizes form values into the API's review payload shape. */
export function toReviewPayload(values) {
  return {
    name: values.name.trim(),
    role: values.role.trim(),
    quote: values.quote.trim(),
    stars: Number(values.stars),
  };
}
