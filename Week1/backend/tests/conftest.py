"""Shared test fixtures.

Each test gets a fresh app wired to a repository in a pytest temp directory,
seeded with two known reviews — so tests never touch the real data file and
never depend on each other's writes. Rate limiting is disabled for tests.
"""

import json

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_repository
from app.core.config import Settings
from app.main import create_app
from app.repositories.review_repository import JsonReviewRepository

SEED = [
    {
        "id": "seed-1",
        "created_at": "2026-07-01T10:00:00+00:00",
        "name": "Maya Okonkwo",
        "role": "Frontend Lead, Northwind",
        "quote": "The scroll-driven bloom is the first thing every visitor mentions.",
        "stars": 5,
    },
    {
        "id": "seed-2",
        "created_at": "2026-07-01T11:00:00+00:00",
        "name": "Daniel Roth",
        "role": "Creative Engineer, Studio Kite",
        "quote": "We shipped an interactive product hero in a single afternoon.",
        "stars": 4,
    },
]


@pytest.fixture
def data_file(tmp_path):
    path = tmp_path / "reviews.json"
    path.write_text(json.dumps(SEED), encoding="utf-8")
    return path


@pytest.fixture
def client(data_file):
    settings = Settings(data_file=data_file, rate_limit_enabled=False)
    app = create_app(settings)
    app.dependency_overrides[get_repository] = lambda: JsonReviewRepository(data_file)
    with TestClient(app) as test_client:
        yield test_client


VALID_PAYLOAD = {
    "name": "Ada Lovelace",
    "role": "Analyst, Analytical Engines",
    "quote": "A wonderful library — the demo scene ran on the first try.",
    "stars": 5,
}
