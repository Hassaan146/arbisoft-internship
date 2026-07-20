"""SQLAlchemy ORM models.

The Notes API stores a single collection of notes. There is no user model yet:
notes are global, and every caller sees the same collection.
"""

from datetime import UTC, datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    """Timezone-aware 'now', used as the default for timestamp columns."""
    return datetime.now(UTC)


class Note(Base):
    """A single note: a title, some content, and its timestamps."""

    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    # onupdate keeps updated_at fresh automatically on every edit.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )
