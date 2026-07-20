"""Integration tests for the reviews CRUD API, via FastAPI's TestClient.

Covers the happy path of every verb, validation rejections (Pydantic),
pagination, and 404s for unknown ids.
"""

from tests.conftest import VALID_PAYLOAD


class TestListReviews:
    def test_returns_seeded_reviews_newest_first(self, client):
        res = client.get("/api/reviews")
        assert res.status_code == 200
        body = res.json()
        assert body["total"] == 2
        assert [r["id"] for r in body["items"]] == ["seed-1", "seed-2"]

    def test_pagination_limits_and_offsets(self, client):
        res = client.get("/api/reviews", params={"limit": 1, "offset": 1})
        body = res.json()
        assert body["total"] == 2
        assert len(body["items"]) == 1
        assert body["items"][0]["id"] == "seed-2"

    def test_rejects_out_of_range_pagination(self, client):
        assert client.get("/api/reviews", params={"limit": 0}).status_code == 422
        assert client.get("/api/reviews", params={"limit": 101}).status_code == 422
        assert client.get("/api/reviews", params={"offset": -1}).status_code == 422


class TestGetReview:
    def test_returns_one_review(self, client):
        res = client.get("/api/reviews/seed-1")
        assert res.status_code == 200
        assert res.json()["name"] == "Maya Okonkwo"

    def test_unknown_id_is_404_with_generic_detail(self, client):
        res = client.get("/api/reviews/nope")
        assert res.status_code == 404
        assert res.json() == {"detail": "Review not found"}


class TestCreateReview:
    def test_creates_and_returns_201(self, client):
        res = client.post("/api/reviews", json=VALID_PAYLOAD)
        assert res.status_code == 201
        body = res.json()
        assert body["name"] == VALID_PAYLOAD["name"]
        assert body["id"] and body["created_at"]

    def test_new_review_appears_first_in_the_list(self, client):
        created = client.post("/api/reviews", json=VALID_PAYLOAD).json()
        listed = client.get("/api/reviews").json()
        assert listed["total"] == 3
        assert listed["items"][0]["id"] == created["id"]

    def test_rejects_invalid_stars(self, client):
        for stars in (0, 6, "many"):
            res = client.post("/api/reviews", json={**VALID_PAYLOAD, "stars": stars})
            assert res.status_code == 422

    def test_rejects_missing_and_too_short_fields(self, client):
        assert client.post("/api/reviews", json={}).status_code == 422
        res = client.post("/api/reviews", json={**VALID_PAYLOAD, "quote": "short"})
        assert res.status_code == 422

    def test_rejects_oversized_fields(self, client):
        res = client.post("/api/reviews", json={**VALID_PAYLOAD, "quote": "x" * 1001})
        assert res.status_code == 422

    def test_strips_surrounding_whitespace(self, client):
        res = client.post("/api/reviews", json={**VALID_PAYLOAD, "name": "  Ada  "})
        assert res.json()["name"] == "Ada"

    def test_ignores_client_supplied_id(self, client):
        res = client.post("/api/reviews", json={**VALID_PAYLOAD, "id": "hacker-id"})
        assert res.status_code == 201
        assert res.json()["id"] != "hacker-id"


class TestReplaceReview:
    def test_replaces_fields_but_keeps_id_and_created_at(self, client):
        res = client.put("/api/reviews/seed-2", json=VALID_PAYLOAD)
        assert res.status_code == 200
        body = res.json()
        assert body["name"] == VALID_PAYLOAD["name"]
        assert body["id"] == "seed-2"
        assert body["created_at"] == "2026-07-01T11:00:00Z"

    def test_unknown_id_is_404(self, client):
        assert client.put("/api/reviews/nope", json=VALID_PAYLOAD).status_code == 404

    def test_rejects_invalid_payload(self, client):
        res = client.put("/api/reviews/seed-2", json={**VALID_PAYLOAD, "stars": 9})
        assert res.status_code == 422


class TestDeleteReview:
    def test_deletes_and_returns_204(self, client):
        assert client.delete("/api/reviews/seed-1").status_code == 204
        assert client.get("/api/reviews/seed-1").status_code == 404
        assert client.get("/api/reviews").json()["total"] == 1

    def test_unknown_id_is_404(self, client):
        assert client.delete("/api/reviews/nope").status_code == 404


class TestMeta:
    def test_health_endpoint(self, client):
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}

    def test_security_headers_present(self, client):
        res = client.get("/api/health")
        assert res.headers["X-Content-Type-Options"] == "nosniff"
        assert res.headers["X-Frame-Options"] == "DENY"
