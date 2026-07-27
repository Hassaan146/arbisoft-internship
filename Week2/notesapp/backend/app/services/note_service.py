"""Note business logic.

Coordinates note operations: validates that a note exists, then delegates to
the repository and owns the transaction (commit) boundary.
"""

from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models import Note
from app.repositories import NoteRepository
from app.schemas import NoteCreate, NoteUpdate


class NoteService:
    """Business rules for notes, kept free of any HTTP concerns."""

    def __init__(self, db: Session) -> None:
        self._db = db
        self._notes = NoteRepository(db)

    def _require_note(self, note_id: int) -> Note:
        """Return the note, or raise NotFoundError."""
        note = self._notes.get(note_id)
        if note is None:
            raise NotFoundError(f"note {note_id} not found")
        return note

    def list(self, limit: int = 50, offset: int = 0) -> list[Note]:
        """Return a page of notes, newest-edited first."""
        return self._notes.list_all(limit=limit, offset=offset)

    def get(self, note_id: int) -> Note:
        """Return a single note (404 if it does not exist)."""
        return self._require_note(note_id)

    def create(self, payload: NoteCreate) -> Note:
        """Create a note and commit; refresh() reloads DB-set fields
        (id, timestamps) onto the returned object."""
        note = Note(title=payload.title, content=payload.content)
        self._notes.add(note)
        self._db.commit()
        self._db.refresh(note)
        return note

    def update(self, note_id: int, payload: NoteUpdate) -> Note:
        """Apply a partial update to a note and commit.

        exclude_unset=True means only fields the client actually sent are
        overwritten, so omitted fields keep their current values.
        """
        note = self._require_note(note_id)
        data = payload.model_dump(exclude_unset=True)

        for field, value in data.items():
            setattr(note, field, value)
        self._db.commit()
        self._db.refresh(note)
        return note

    def delete(self, note_id: int) -> None:
        """Delete a note (404 if it does not exist)."""
        note = self._require_note(note_id)
        self._notes.delete(note)
        self._db.commit()
