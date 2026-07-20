"""Note business logic.

Enforces ownership: every operation checks that a note's owner_id matches the
owner_id it is given. That owner_id is the *authenticated* user's id — the
routers derive it from the verified JWT (see `dependencies.get_current_user`),
never from client-supplied input — so this is genuine authorization: a user can
only ever reach their own notes.
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

        owner_id is the authenticated user's id (from the JWT), so this enforces
        that a user can only reach their own notes. A note owned by someone else
        is reported as "not found" (not "forbidden") so we never leak whether
        another user's note id exists.
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
