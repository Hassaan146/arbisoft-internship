"""Pytest fixtures: an isolated in-memory DB and a TestClient.

The production get_db dependency is overridden so tests never touch a real
database file, and each test gets a fresh schema for full isolation.
"""

from collections.abc import Generator

import pytest
from app.database import Base, get_db
from app.main import app
from app.rate_limit import limiter
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Tests hit endpoints many times per client address; disable the rate limiter
# so per-route limits don't make the suite flaky (429s).
limiter.enabled = False


@pytest.fixture
def engine():
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # one shared in-memory connection for the test
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture
def session_factory(engine) -> sessionmaker[Session]:
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def client(session_factory) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
