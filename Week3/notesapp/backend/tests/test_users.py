"""API tests for registration, JWT login, reset, and auth error paths."""

from fastapi.testclient import TestClient

from tests.conftest import bearer, login, register


def test_register_user(client: TestClient) -> None:
    body = register(client, "bob", "0000")
    assert body["username"] == "bob"
    assert body["role"] == "user"
    assert "password" not in body


def test_duplicate_username_conflicts(client: TestClient, user: dict) -> None:
    resp = client.post("/users", json={"username": "alice", "password": "5678"})
    assert resp.status_code == 409


def test_non_four_digit_pin_is_422(client: TestClient) -> None:
    assert client.post("/users", json={"username": "carol", "password": "12"}).status_code == 422


def test_login_returns_a_bearer_token(client: TestClient, user: dict) -> None:
    resp = client.post("/auth/login", json={"username": "alice", "password": "1234"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["token_type"] == "bearer"
    assert data["role"] == "user"
    assert data["access_token"]


def test_login_wrong_pin_is_401(client: TestClient, user: dict) -> None:
    resp = client.post("/auth/login", json={"username": "alice", "password": "9999"})
    assert resp.status_code == 401


def test_me_requires_a_token(client: TestClient) -> None:
    assert client.get("/users/me").status_code == 401


def test_me_returns_current_user(client: TestClient, auth_headers: dict) -> None:
    resp = client.get("/users/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["username"] == "alice"


def test_invalid_token_is_401(client: TestClient) -> None:
    resp = client.get("/users/me", headers=bearer("not-a-real-token"))
    assert resp.status_code == 401


def test_reset_password_then_login(client: TestClient, user: dict) -> None:
    reset = client.post("/auth/reset-password", json={"username": "alice", "password": "4321"})
    assert reset.status_code == 200
    assert (
        client.post("/auth/login", json={"username": "alice", "password": "1234"}).status_code
        == 401
    )
    assert login(client, "alice", "4321")  # new PIN works
