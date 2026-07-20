"""SQLAlchemy ORM models.

Relationship: User 1 --- * Note (one user has many notes).
Each note must belong to a user (non-nullable FK), so a note can never be
orphaned. A user may have zero notes — there is no minimum-note rule.
"""

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    """Timezone-aware 'now', used as the default for timestamp columns."""
    return datetime.now(UTC)


class User(Base):
    """A person who owns notes. The 'one' side of the User→Notes relationship."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    # unique+index: usernames are looked up on every login and must not repeat.
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    # Bcrypt hash of the user's 4-digit PIN — the raw PIN is never stored.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    # Role for authorization: "user" (default) or "admin".
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Login tracking, used by the admin stats panel.
    login_count: Mapped[int] = mapped_column(default=0, nullable=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    # One-to-many link to notes. cascade="all, delete-orphan" means deleting a
    # user also deletes their notes; lazy="selectin" loads them in one extra
    # query (avoids the N+1 problem when serializing a user with its notes).
    notes: Mapped[list["Note"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Note(Base):
    """A single note. The 'many' side; every note belongs to exactly one user."""

    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    # onupdate keeps updated_at fresh automatically on every edit.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    # Non-nullable FK = a note can never be orphaned; indexed because we always
    # query notes by their owner. ondelete="CASCADE" mirrors the ORM cascade.
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    owner: Mapped["User"] = relationship(back_populates="notes")
