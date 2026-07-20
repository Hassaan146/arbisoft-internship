// Client-side validation constants.
//
// These MIRROR the backend rules in `app/schemas/user.py` and exist only to
// give fast UX feedback. The backend re-validates every request and is the
// single source of truth — if these ever drift, the server still rejects bad
// input, so the worst case is a slightly late error message, never bad data.

export const PIN_LENGTH = 4;
export const PIN_REGEX = /^\d{4}$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 50;
export const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;
