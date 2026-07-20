"""API tests for note CRUD and validation on /notes."""

from fastapi.testclient import TestClient


def _add(client: TestClient, title: str = "Note", content: str = "") -> dict:
    resp = client.post("/notes", json={"title": title, "content": content})
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_starts_with_no_notes(client: TestClient) -> None:
    resp = client.get("/notes")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_read_update_delete(client: TestClient) -> None:
    note = _add(client, "Shopping", "milk")
    nid = note["id"]

    assert client.get(f"/notes/{nid}").json()["title"] == "Shopping"

    updated = client.put(f"/notes/{nid}", json={"title": "Groceries"})
    assert updated.status_code == 200
    assert updated.json()["title"] == "Groceries"

    assert client.delete(f"/notes/{nid}").status_code == 204
    assert client.get("/notes").json() == []


def test_blank_title_is_422(client: TestClient) -> None:
    resp = client.post("/notes", json={"title": "   ", "content": "x"})
    assert resp.status_code == 422


def test_missing_note_is_404(client: TestClient) -> None:
    assert client.get("/notes/999").status_code == 404
    assert client.delete("/notes/999").status_code == 404


def test_partial_update_keeps_other_fields(client: TestClient) -> None:
    note = _add(client, "Title", "body")
    updated = client.put(f"/notes/{note['id']}", json={"content": "new body"})
    assert updated.status_code == 200
    assert updated.json()["title"] == "Title"
    assert updated.json()["content"] == "new body"


def test_pagination_rejects_bad_limit(client: TestClient) -> None:
    assert client.get("/notes?limit=0").status_code == 422
    assert client.get("/notes?limit=101").status_code == 422
