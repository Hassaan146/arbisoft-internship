"""Unit tests for the reusable JWT token module (no HTTP involved)."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from app.config import get_settings
from app.tokens import InvalidTokenError, create_access_token, decode_access_token


def test_roundtrip_encodes_subject_and_role() -> None:
    token = create_access_token(subject=42, role="admin")
    claims = decode_access_token(token)
    assert claims["sub"] == "42"
    assert claims["role"] == "admin"


def test_expired_token_is_rejected() -> None:
    settings = get_settings()
    expired = jwt.encode(
        {"sub": "1", "role": "user", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(InvalidTokenError):
        decode_access_token(expired)


def test_tampered_token_is_rejected() -> None:
    token = create_access_token(subject=1, role="user")
    with pytest.raises(InvalidTokenError):
        decode_access_token(token + "tampered")


def test_wrong_secret_is_rejected() -> None:
    forged = jwt.encode({"sub": "1", "role": "admin"}, "some-other-secret", algorithm="HS256")
    with pytest.raises(InvalidTokenError):
        decode_access_token(forged)
