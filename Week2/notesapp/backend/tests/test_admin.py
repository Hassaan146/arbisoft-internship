"""API tests for role-based access to the admin panel."""

from fastapi.testclient import TestClient


def test_admin_stats_requires_authentication(client: TestClient) -> None:
    assert client.get("/admin/stats").status_code == 401


def test_normal_user_is_forbidden(client: TestClient, auth_headers: dict) -> None:
    # authenticated, but role="user" -> 403
    assert client.get("/admin/stats", headers=auth_headers).status_code == 403


def test_normal_user_cannot_list_users(client: TestClient, auth_headers: dict) -> None:
    assert client.get("/users", headers=auth_headers).status_code == 403


def test_admin_can_read_stats(client: TestClient, admin_headers: dict) -> None:
    resp = client.get("/admin/stats", headers=admin_headers)
    assert resp.status_code == 200
    stats = resp.json()
    # counts only — no note contents anywhere in the payload
    assert set(stats) == {"total_users", "users_logged_in", "total_logins", "total_notes"}


def test_admin_stats_reflect_activity(
    client: TestClient, admin_headers: dict, auth_headers: dict
) -> None:
    # admin_headers created+logged in "boss"; auth_headers created+logged in "alice"
    client.post("/notes", json={"title": "a", "content": ""}, headers=auth_headers)
    stats = client.get("/admin/stats", headers=admin_headers).json()
    assert stats["total_users"] == 2  # alice + boss
    assert stats["users_logged_in"] == 2
    assert stats["total_notes"] == 1
