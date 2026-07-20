"""API tests for note CRUD, validation, ownership, and auth on /notes."""

from fastapi.testclient import TestClient

from tests.conftest import bearer, login, register


def _add(client: TestClient, headers: dict, title: str = "Note", content: str = "") -> dict:
    resp = client.post("/notes", json={"title": title, "content": content}, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_notes_require_authentication(client: TestClient) -> None:
    assert client.get("/notes").status_code == 401
    assert client.post("/notes", json={"title": "x", "content": ""}).status_code == 401


def test_new_user_has_no_notes(client: TestClient, auth_headers: dict) -> None:
    resp = client.get("/notes", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_read_update_delete(client: TestClient, auth_headers: dict) -> None:
    note = _add(client, auth_headers, "Shopping", "milk")
    nid = note["id"]

    assert client.get(f"/notes/{nid}", headers=auth_headers).json()["title"] == "Shopping"

    updated = client.put(f"/notes/{nid}", json={"title": "Groceries"}, headers=auth_headers)
    assert updated.status_code == 200
    assert updated.json()["title"] == "Groceries"

    assert client.delete(f"/notes/{nid}", headers=auth_headers).status_code == 204
    assert client.get("/notes", headers=auth_headers).json() == []


def test_blank_title_is_422(client: TestClient, auth_headers: dict) -> None:
    resp = client.post("/notes", json={"title": "   ", "content": "x"}, headers=auth_headers)
    assert resp.status_code == 422


def test_user_cannot_access_another_users_note(client: TestClient, auth_headers: dict) -> None:
    # alice creates a note
    note = _add(client, auth_headers, "secret")
    # mallory logs in and tries to read it by id -> 404, not leaked
    register(client, "mallory", "2222")
    mallory = bearer(login(client, "mallory", "2222"))
    assert client.get(f"/notes/{note['id']}", headers=mallory).status_code == 404
    assert client.delete(f"/notes/{note['id']}", headers=mallory).status_code == 404


def test_pagination_rejects_bad_limit(client: TestClient, auth_headers: dict) -> None:
    assert client.get("/notes?limit=0", headers=auth_headers).status_code == 422
    assert client.get("/notes?limit=101", headers=auth_headers).status_code == 422
