"""Unit tests for the JSON-file repository (no HTTP involved)."""

import json

from app.repositories.review_repository import JsonReviewRepository

FIELDS = {"name": "Ada", "role": "Analyst", "quote": "A wonderful library indeed.", "stars": 5}


def test_starts_empty_without_seed(tmp_path):
    repo = JsonReviewRepository(tmp_path / "reviews.json")
    assert repo.list_all() == []


def test_copies_seed_on_first_run(tmp_path):
    seed = tmp_path / "seed.json"
    seed.write_text(json.dumps([{"id": "s1", "created_at": "2026-07-01T00:00:00+00:00", **FIELDS}]))
    repo = JsonReviewRepository(tmp_path / "reviews.json", seed_file=seed)
    assert [r["id"] for r in repo.list_all()] == ["s1"]


def test_add_assigns_unique_id_and_timestamp(tmp_path):
    repo = JsonReviewRepository(tmp_path / "reviews.json")
    first = repo.add(dict(FIELDS))
    second = repo.add(dict(FIELDS))
    assert first["id"] != second["id"]
    assert first["created_at"]
    # newest first
    assert [r["id"] for r in repo.list_all()] == [second["id"], first["id"]]


def test_data_survives_a_new_repository_instance(tmp_path):
    path = tmp_path / "reviews.json"
    row = JsonReviewRepository(path).add(dict(FIELDS))
    assert JsonReviewRepository(path).get(row["id"]) == row


def test_replace_preserves_identity_fields(tmp_path):
    repo = JsonReviewRepository(tmp_path / "reviews.json")
    row = repo.add(dict(FIELDS))
    updated = repo.replace(row["id"], {**FIELDS, "name": "Grace"})
    assert updated["name"] == "Grace"
    assert updated["id"] == row["id"]
    assert updated["created_at"] == row["created_at"]


def test_replace_and_delete_unknown_ids(tmp_path):
    repo = JsonReviewRepository(tmp_path / "reviews.json")
    assert repo.replace("nope", dict(FIELDS)) is None
    assert repo.delete("nope") is False


def test_delete_removes_only_the_target(tmp_path):
    repo = JsonReviewRepository(tmp_path / "reviews.json")
    keep = repo.add(dict(FIELDS))
    drop = repo.add(dict(FIELDS))
    assert repo.delete(drop["id"]) is True
    assert [r["id"] for r in repo.list_all()] == [keep["id"]]
