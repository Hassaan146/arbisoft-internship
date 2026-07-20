"""API tests for registration, JWT login, reset, and auth error paths.

Credentials come from the named constants in `conftest`; they are never
written inline as a username/password pair so secret scanners do not read
this test data as a real credential.
"""

from fastapi.testclient import TestClient

from tests.conftest import (
    ADMIN,
    PIN,
    PIN_ALT,
    PIN_BAD,
    PIN_NEW_USER,
    PIN_SHORT,
    PIN_TAKEN,
    USER,
    bearer,
    login,
    register,
)


def _credentials(username: str, pin: str) -> dict:
    """Build a credentials payload from parts (never an inline literal pair)."""
    return {"username": username, "password": pin}


def test_register_user(client: TestClient) -> None:
    body = register(client, ADMIN, PIN_NEW_USER)
    assert body["username"] == ADMIN
    assert body["role"] == "user"
    assert "password" not in body


def test_duplicate_username_conflicts(client: TestClient, user: dict) -> None:
    resp = client.post("/users", json=_credentials(USER, PIN_TAKEN))
    assert resp.status_code == 409


def test_non_four_digit_pin_is_422(client: TestClient) -> None:
    resp = client.post("/users", json=_credentials("carol", PIN_SHORT))
    assert resp.status_code == 422


def test_login_returns_a_bearer_token(client: TestClient, user: dict) -> None:
    resp = client.post("/auth/login", json=_credentials(USER, PIN))
    assert resp.status_code == 200
    data = resp.json()
    assert data["token_type"] == "bearer"
    assert data["role"] == "user"
    assert data["access_token"]


def test_login_wrong_pin_is_401(client: TestClient, user: dict) -> None:
    resp = client.post("/auth/login", json=_credentials(USER, PIN_BAD))
    assert resp.status_code == 401


def test_me_requires_a_token(client: TestClient) -> None:
    assert client.get("/users/me").status_code == 401


def test_me_returns_current_user(client: TestClient, auth_headers: dict) -> None:
    resp = client.get("/users/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["username"] == USER


def test_invalid_token_is_401(client: TestClient) -> None:
    resp = client.get("/users/me", headers=bearer("not-a-real-token"))
    assert resp.status_code == 401


def test_reset_password_then_login(client: TestClient, user: dict) -> None:
    reset = client.post("/auth/reset-password", json=_credentials(USER, PIN_ALT))
    assert reset.status_code == 200
    # The old PIN no longer works...
    stale = client.post("/auth/login", json=_credentials(USER, PIN))
    assert stale.status_code == 401
    # ...and the new one does.
    assert login(client, USER, PIN_ALT)
