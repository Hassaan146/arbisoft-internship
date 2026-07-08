"""Data-access layer: all SQLAlchemy queries live behind repository interfaces."""

from app.repositories.note_repository import NoteRepository
from app.repositories.user_repository import UserRepository

__all__ = ["NoteRepository", "UserRepository"]
