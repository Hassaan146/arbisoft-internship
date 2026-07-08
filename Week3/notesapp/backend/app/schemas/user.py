"""Pydantic schemas for users and authentication."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# Validation rules live in one place. The frontend mirrors these for UX only —
# the backend is the single source of truth and always re-validates.
USERNAME_PATTERN = r"^[A-Za-z0-9_]+$"
USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 50
PIN_PATTERN = r"^\d{4}$"


class UserCredentials(BaseModel):
    """Username + 4-digit PIN, shared by registration, login, and reset."""

    username: str = Field(
        min_length=USERNAME_MIN_LENGTH, max_length=USERNAME_MAX_LENGTH, pattern=USERNAME_PATTERN
    )
    # Exactly four digits — validated here so a bad PIN is rejected as 422.
    password: str = Field(pattern=PIN_PATTERN)


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
