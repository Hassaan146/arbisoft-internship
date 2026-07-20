"""Pydantic schemas for the Note resource — the validated note contract."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class NoteBase(BaseModel):
    """Fields common to note input and output, with their validation rules."""

    title: str = Field(min_length=1, max_length=200)
    content: str = Field(default="", max_length=10_000)

    @field_validator("title", "content")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        """Trim surrounding whitespace before any other check runs."""
        return value.strip()

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value: str) -> str:
        """Reject titles that are empty once trimmed (e.g. '   ')."""
        if not value.strip():
            raise ValueError("title must not be blank")
        return value


class NoteCreate(NoteBase):
    """Request body for creating a note (the owner comes from the JWT)."""


class NoteUpdate(BaseModel):
    """Request body for editing a note.

    Deliberately does NOT extend NoteBase: NoteBase's fields are required,
    whereas a partial update makes every field optional. The validators below
    mirror NoteBase's behaviour (trim whitespace, reject a present-but-blank
    title) so create and update stay consistent.
    """

    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, max_length=10_000)

    @field_validator("title", "content")
    @classmethod
    def strip_whitespace(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else value

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("title must not be blank")
        return value


class NoteRead(NoteBase):
    """Response shape for a note. from_attributes lets Pydantic read straight
    from the SQLAlchemy model instance."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
