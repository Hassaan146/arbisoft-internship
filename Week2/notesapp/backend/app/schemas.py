"""Pydantic schemas — the validated boundary contract for the API.

Input is validated server-side (allowlist of fields, length/whitespace rules).
Output models control exactly what is serialized back to clients.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


# --- Notes ---------------------------------------------------------------
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
    """Request body for creating a note (the owner comes from the URL path)."""


class NoteUpdate(BaseModel):
    """Request body for editing a note. Fields are optional so callers can send
    only what changes; omitted fields are left untouched."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, max_length=10_000)

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value: str | None) -> str | None:
        """Allow an absent title, but reject a present-but-blank one."""
        if value is not None and not value.strip():
            raise ValueError("title must not be blank")
        return value.strip() if value is not None else value


class NoteRead(NoteBase):
    """Response shape for a note. from_attributes lets Pydantic read straight
    from the SQLAlchemy model instance."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime


# --- Users & auth --------------------------------------------------------
class UserCredentials(BaseModel):
    """Username + 4-digit PIN, shared by registration and login."""

    # pattern restricts usernames to a safe allowlist of characters.
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_]+$")
    # Exactly four digits — validated here so a bad PIN is rejected as 422.
    password: str = Field(pattern=r"^\d{4}$")


class UserCreate(UserCredentials):
    """Request body for registering a new user."""


class UserLogin(UserCredentials):
    """Request body for logging in an existing user."""


class PasswordReset(UserCredentials):
    """Request body for resetting a PIN: the username + the new 4-digit PIN."""


class UserRead(BaseModel):
    """Response shape for a user. Never includes the password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    created_at: datetime


class Token(BaseModel):
    """The JWT returned on a successful login."""

    access_token: str
    token_type: str = "bearer"
    role: str


class AdminStats(BaseModel):
    """Aggregate counts for the admin panel — never any note contents."""

    total_users: int
    users_logged_in: int
    total_logins: int
    total_notes: int
