"""Data-access layer: all SQLAlchemy queries live behind repository interfaces."""

from app.repositories.note_repository import NoteRepository

__all__ = ["NoteRepository"]
