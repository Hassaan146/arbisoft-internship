"""Pydantic schemas — the validated boundary contract for the API.

Grouped by resource in their own modules, and re-exported here so callers can
keep importing `from app.schemas import X`.
"""

from app.schemas.note import NoteBase, NoteCreate, NoteRead, NoteUpdate

__all__ = [
    "NoteBase",
    "NoteCreate",
    "NoteRead",
    "NoteUpdate",
]
