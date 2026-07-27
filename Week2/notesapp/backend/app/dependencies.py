"""FastAPI dependency providers: DB sessions and services.

Keeping these in one place means routers declare what they need without
knowing how it is constructed.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import NoteService

# Reusable "give me a request-scoped DB session" dependency.
DbSession = Annotated[Session, Depends(get_db)]


def get_note_service(db: DbSession) -> NoteService:
    """Provide a NoteService bound to the current request's DB session."""
    return NoteService(db)
