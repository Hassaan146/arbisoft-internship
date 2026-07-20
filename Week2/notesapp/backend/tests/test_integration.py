"""End-to-end integration test: the full happy path across auth + CRUD + admin."""

from fastapi.testclient import TestClient

from tests.conftest import bearer, login, register


def test_happy_path_end_to_end(client: TestClient, session_factory) -> None:
    # 1. A new user registers.
    register(client, "diana", "1357")

    # 2. They log in and receive a JWT.
    token = login(client, "diana", "1357")
    headers = bearer(token)

    # 3. Authenticated, they see no notes yet.
    assert client.get("/notes", headers=headers).json() == []

    # 4. They create a note, then read it back.
    created = client.post(
        "/notes", json={"title": "Trip plan", "content": "book flights"}, headers=headers
    )
    assert created.status_code == 201
    note_id = created.json()["id"]

    listed = client.get("/notes", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["id"] == note_id

    # 5. They update it.
    updated = client.put(f"/notes/{note_id}", json={"content": "flights booked"}, headers=headers)
    assert updated.json()["content"] == "flights booked"

    # 6. An admin (promoted directly) logs in and sees the aggregate stats —
    #    counts only, never the note's contents.
    from app.models import User

    register(client, "root", "2468")
    db = session_factory()
    try:
        db.query(User).filter_by(username="root").one().role = "admin"
        db.commit()
    finally:
        db.close()
    admin = bearer(login(client, "root", "2468"))

    stats = client.get("/admin/stats", headers=admin)
    assert stats.status_code == 200
    body = stats.json()
    assert body["total_users"] == 2
    assert body["total_notes"] == 1
    assert "content" not in body and "Trip plan" not in str(body)

    # 7. The user deletes their note and ends clean.
    assert client.delete(f"/notes/{note_id}", headers=headers).status_code == 204
    assert client.get("/notes", headers=headers).json() == []
