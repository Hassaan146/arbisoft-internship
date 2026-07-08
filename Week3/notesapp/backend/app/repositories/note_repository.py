"""Repository encapsulating all persistence for Note entities."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Note


class NoteRepository:
    """Query/persist Notes. Ownership filtering is expressed here."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def get(self, note_id: int) -> Note | None:
        """Fetch a note by primary key, or None. Ownership is checked in the
        service layer, not here."""
        return self._db.get(Note, note_id)

    def list_for_user(self, owner_id: int, limit: int, offset: int) -> list[Note]:
        """Return one page of a user's notes, newest-edited first.

        limit/offset are applied in SQL so the database does the paging rather
        than loading every row into memory.
        """
        stmt = (
            select(Note)
            .where(Note.owner_id == owner_id)
            .order_by(Note.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self._db.scalars(stmt))

    def add(self, note: Note) -> Note:
        """Stage a new note and flush to populate its id (caller commits)."""
        self._db.add(note)
        self._db.flush()
        return note

    def delete(self, note: Note) -> None:
        """Stage a note for deletion (caller commits)."""
        self._db.delete(note)

    def count_all(self) -> int:
        """Total number of notes across all users (admin stat, no contents)."""
        return self._db.scalar(select(func.count()).select_from(Note)) or 0
