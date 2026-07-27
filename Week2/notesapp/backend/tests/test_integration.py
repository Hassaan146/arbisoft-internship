"""End-to-end integration test: the full happy path across note CRUD."""

from fastapi.testclient import TestClient


def test_happy_path_end_to_end(client: TestClient) -> None:
    # 1. No notes to begin with.
    assert client.get("/notes").json() == []

    # 2. Create a note, then read it back.
    created = client.post("/notes", json={"title": "Trip plan", "content": "book flights"})
    assert created.status_code == 201
    note_id = created.json()["id"]

    listed = client.get("/notes")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["id"] == note_id

    # 3. Update it.
    updated = client.put(f"/notes/{note_id}", json={"content": "flights booked"})
    assert updated.json()["content"] == "flights booked"

    # 4. Delete it and end clean.
    assert client.delete(f"/notes/{note_id}").status_code == 204
    assert client.get("/notes").json() == []
