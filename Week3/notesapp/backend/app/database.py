"""Database engine, session factory, and the FastAPI DB dependency.

Data-access wiring lives here so the rest of the app depends on the session
abstraction, not on SQLAlchemy setup details.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

# check_same_thread is only needed for SQLite; harmless default otherwise.
_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """Yield a scoped DB session and guarantee it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
