"""Pydantic schemas — the validated boundary contract for the API.

Grouped by resource (note / user / admin) in their own modules, and re-exported
here so callers can keep importing `from app.schemas import X`.
"""

from app.schemas.admin import AdminStats
from app.schemas.note import NoteBase, NoteCreate, NoteRead, NoteUpdate
from app.schemas.user import (
    PasswordReset,
    Token,
    UserCreate,
    UserCredentials,
    UserLogin,
    UserRead,
)

__all__ = [
    "AdminStats",
    "NoteBase",
    "NoteCreate",
    "NoteRead",
    "NoteUpdate",
    "PasswordReset",
    "Token",
    "UserCreate",
    "UserCredentials",
    "UserLogin",
    "UserRead",
]
