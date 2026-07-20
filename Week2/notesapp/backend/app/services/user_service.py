"""User business logic: registration, login (with tracking), roles, reset."""

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.exceptions import AuthError, ConflictError, NotFoundError
from app.models import User
from app.repositories import UserRepository
from app.schemas import UserCreate
from app.security import hash_password, verify_password


class UserService:
    """User operations and the transaction boundary for user changes."""

    def __init__(self, db: Session) -> None:
        self._db = db
        self._users = UserRepository(db)

    def create(self, payload: UserCreate, role: str = "user") -> User:
        """Register a new user with a hashed PIN.

        Rejects a duplicate username with ConflictError (→ HTTP 409). New users
        start with no notes; they add their own once inside the app.
        """
        if self._users.get_by_username(payload.username):
            raise ConflictError(f"username '{payload.username}' is already taken")

        user = User(
            username=payload.username,
            password_hash=hash_password(payload.password),
            role=role,
        )
        self._users.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def authenticate(self, username: str, password: str) -> User:
        """Verify credentials, record the login, and return the user.

        The same AuthError (→ 401) is raised whether the username is unknown or
        the PIN is wrong, so an attacker cannot tell which usernames exist.
        """
        user = self._users.get_by_username(username)
        if user is None or not verify_password(password, user.password_hash):
            raise AuthError("invalid username or password")
        # Track the login for the admin stats panel.
        user.login_count += 1
        user.last_login = datetime.now(UTC)
        self._db.commit()
        self._db.refresh(user)
        return user

    def ensure_admin(self, username: str, pin: str) -> User:
        """Idempotently ensure an admin user exists (called at startup)."""
        existing = self._users.get_by_username(username)
        if existing is not None:
            return existing
        return self.create(UserCreate(username=username, password=pin), role="admin")

    def reset_password(self, username: str, new_password: str) -> User:
        """Set a new PIN for an existing username (→ 404 if unknown).

        Self-service reset keyed on the username alone — see the security note
        in the README; a production app would verify identity (email/OTP) first.
        """
        user = self._users.get_by_username(username)
        if user is None:
            raise NotFoundError(f"user '{username}' not found")
        user.password_hash = hash_password(new_password)
        self._db.commit()
        self._db.refresh(user)
        return user

    def get(self, user_id: int) -> User:
        """Return a user or raise NotFoundError (→ HTTP 404)."""
        user = self._users.get(user_id)
        if user is None:
            raise NotFoundError(f"user {user_id} not found")
        return user

    def list(self) -> list[User]:
        """Return all users."""
        return self._users.list()

    def delete(self, user_id: int) -> None:
        """Delete a user; their notes are removed too via the cascade."""
        user = self.get(user_id)
        self._users.delete(user)
        self._db.commit()
