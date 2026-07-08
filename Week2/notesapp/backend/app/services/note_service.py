"""Note business logic.

Enforces that a note is only reachable through its owner: every operation
checks that the note's owner_id matches the owner_id taken from the request
path. There is NO session authentication yet, so this does not authenticate
the caller — it only prevents reaching a note via the *wrong* path. A caller
who supplies another user's id in the path is still trusted to be that user.
"""

from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models import Note
from app.repositories import NoteRepository, UserRepository
from app.schemas import NoteCreate, NoteUpdate


class NoteService:
    """Coordinates note operations: validates access, then delegates to the
    repositories and owns the transaction (commit) boundary."""

    def __init__(self, db: Session) -> None:
        self._db = db
        self._notes = NoteRepository(db)
        self._users = UserRepository(db)

    def _require_user(self, owner_id: int) -> None:
        """Raise NotFoundError if the owner doesn't exist."""
        if self._users.get(owner_id) is None:
            raise NotFoundError(f"user {owner_id} not found")

    def _require_owned_note(self, owner_id: int, note_id: int) -> Note:
        """Return the note only if it exists AND belongs to owner_id.

        owner_id comes from the request path, not from an authenticated session,
        so this is an ownership/path check rather than true authorization: it
        ensures a note is only reachable under its owner's path, but does not
        verify the caller *is* that owner. Treating "not owned" identically to
        "not found" still avoids leaking whether another id's notes exist.
        """
        note = self._notes.get(note_id)
        if note is None or note.owner_id != owner_id:
            raise NotFoundError(f"note {note_id} not found for user {owner_id}")
        return note

    def list(self, owner_id: int, limit: int = 50, offset: int = 0) -> list[Note]:
        """Return a page of the user's notes (404 if the user is unknown)."""
        self._require_user(owner_id)
        return self._notes.list_for_user(owner_id, limit=limit, offset=offset)

    def get(self, owner_id: int, note_id: int) -> Note:
        """Return a single note the user owns (404 otherwise)."""
        return self._require_owned_note(owner_id, note_id)

    def create(self, owner_id: int, payload: NoteCreate) -> Note:
        """Create a note for the user and commit; refresh() reloads DB-set
        fields (id, timestamps) onto the returned object."""
        self._require_user(owner_id)
        note = Note(title=payload.title, content=payload.content, owner_id=owner_id)
        self._notes.add(note)
        self._db.commit()
        self._db.refresh(note)
        return note

    def update(self, owner_id: int, note_id: int, payload: NoteUpdate) -> Note:
        """Apply a partial update to an owned note and commit.

        exclude_unset=True means only fields the client actually sent are
        overwritten, so omitted fields keep their current values.
        """
        note = self._require_owned_note(owner_id, note_id)
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(note, field, value)
        self._db.commit()
        self._db.refresh(note)
        return note

    def delete(self, owner_id: int, note_id: int) -> None:
        """Delete a note the user owns (404 if it isn't theirs)."""
        note = self._require_owned_note(owner_id, note_id)
        self._notes.delete(note)
        self._db.commit()
