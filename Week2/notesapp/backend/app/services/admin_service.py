"""Admin business logic — aggregate stats only, never note contents."""

from sqlalchemy.orm import Session

from app.repositories import NoteRepository, UserRepository
from app.schemas import AdminStats


class AdminService:
    """Read-only aggregate metrics for the admin panel."""

    def __init__(self, db: Session) -> None:
        self._users = UserRepository(db)
        self._notes = NoteRepository(db)

    def stats(self) -> AdminStats:
        """Return counts only: users, how many have logged in, total logins, notes."""
        return AdminStats(
            total_users=self._users.count(),
            users_logged_in=self._users.count_logged_in(),
            total_logins=self._users.total_logins(),
            total_notes=self._notes.count_all(),
        )
