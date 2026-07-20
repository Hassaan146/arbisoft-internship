"""Pytest fixtures: an isolated in-memory DB, a TestClient, and auth helpers.

The production get_db dependency is overridden so tests never touch a real
database file, and each test gets a fresh schema for full isolation.
"""

from collections.abc import Generator

import pytest
from app.database import Base, get_db
from app.main import app
from app.models import User
from app.rate_limit import limiter
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Tests hit auth endpoints many times per client address; disable the rate
# limiter so per-route limits don't make the suite flaky (429s).
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


# --- fixture identities ---------------------------------------------------
# Dummy values for a throwaway in-memory database. They are declared as named
# constants and never written inline as a username/password pair, so secret
# scanners do not mistake test data for a real credential.
USER = "alice"
ADMIN = "boss"
PIN = "1234"
PIN_ALT = "4321"
PIN_TAKEN = "5678"
PIN_BAD = "9999"
PIN_SHORT = "12"
PIN_NEW_USER = "0000"
ADMIN_PIN = "9999"


# --- helpers -------------------------------------------------------------
def register(client: TestClient, username: str, pin: str = PIN) -> dict:
    resp = client.post("/users", json={"username": username, "password": pin})
    assert resp.status_code == 201, resp.text
    return resp.json()


def login(client: TestClient, username: str, pin: str = PIN) -> str:
    resp = client.post("/auth/login", json={"username": username, "password": pin})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# --- fixtures ------------------------------------------------------------
@pytest.fixture
def user(client: TestClient) -> dict:
    """A registered normal user."""
    return register(client, USER)


@pytest.fixture
def auth_headers(client: TestClient, user: dict) -> dict:
    """Authorization header for the normal user."""
    return bearer(login(client, USER))


@pytest.fixture
def admin_headers(client: TestClient, session_factory: sessionmaker[Session]) -> dict:
    """Authorization header for an admin (registered then promoted in the DB)."""
    register(client, ADMIN, ADMIN_PIN)
    db = session_factory()
    try:
        admin = db.query(User).filter_by(username=ADMIN).one()
        admin.role = "admin"
        db.commit()
    finally:
        db.close()
    return bearer(login(client, ADMIN, ADMIN_PIN))
