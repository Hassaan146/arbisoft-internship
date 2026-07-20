"""Reusable JWT access-token module.

This file is deliberately self-contained so it can be dropped into another
project with minimal changes: it depends only on PyJWT and three settings
(`jwt_secret`, `jwt_algorithm`, `access_token_expire_minutes`). To reuse it
elsewhere, copy this file and provide those three config values.

The token payload carries:
  - `sub`  : the subject (here, the user id as a string)
  - `role` : the caller's role, so authorization needs no extra DB lookup
  - `exp`  : expiry timestamp (enforced by PyJWT on decode)
"""

from datetime import UTC, datetime, timedelta

import jwt

from app.config import get_settings


class InvalidTokenError(Exception):
    """Raised when a token is missing, malformed, tampered with, or expired."""


def create_access_token(subject: str | int, role: str, expires_minutes: int | None = None) -> str:
    """Sign and return a JWT for the given subject and role."""
    settings = get_settings()
    minutes = expires_minutes or settings.access_token_expire_minutes
    payload = {
        "sub": str(subject),
        "role": role,
        "exp": datetime.now(UTC) + timedelta(minutes=minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Verify a token's signature + expiry and return its claims.

    Raises InvalidTokenError on any problem (bad signature, expired, malformed).
    """
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc
