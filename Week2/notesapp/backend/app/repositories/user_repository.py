"""Repository encapsulating all persistence for User entities."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import User


class UserRepository:
    """Query/persist Users. No business logic here — just data access."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def get(self, user_id: int) -> User | None:
        """Fetch a user by primary key, or None if it doesn't exist."""
        return self._db.get(User, user_id)

    def get_by_username(self, username: str) -> User | None:
        """Fetch a user by username (used to enforce uniqueness on create)."""
        return self._db.scalar(select(User).where(User.username == username))

    def list(self) -> list[User]:
        """Return all users, ordered by id."""
        return list(self._db.scalars(select(User).order_by(User.id)))

    def add(self, user: User) -> User:
        """Stage a new user and flush so its generated id is available.

        flush() sends the INSERT but does NOT commit — the service decides when
        to commit, keeping the whole operation in one transaction.
        """
        self._db.add(user)
        self._db.flush()
        return user

    def delete(self, user: User) -> None:
        """Stage a user for deletion (committed by the caller)."""
        self._db.delete(user)

    def count(self) -> int:
        """Total number of registered users."""
        return self._db.scalar(select(func.count()).select_from(User)) or 0

    def count_logged_in(self) -> int:
        """How many distinct users have logged in at least once."""
        stmt = select(func.count()).select_from(User).where(User.login_count > 0)
        return self._db.scalar(stmt) or 0

    def total_logins(self) -> int:
        """Sum of every user's login count (total login events)."""
        return self._db.scalar(select(func.coalesce(func.sum(User.login_count), 0))) or 0
