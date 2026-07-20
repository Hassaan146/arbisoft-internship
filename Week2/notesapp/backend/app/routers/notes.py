"""Note routes — full CRUD for the authenticated user's own notes.

The owner is taken from the JWT (CurrentUser), never from the URL, so one user
can never reach another user's notes (no IDOR).
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.dependencies import CurrentUser, get_note_service
from app.schemas import NoteCreate, NoteRead, NoteUpdate
from app.services import NoteService

router = APIRouter(prefix="/notes", tags=["notes"])

ServiceDep = Annotated[NoteService, Depends(get_note_service)]


@router.get("", response_model=list[NoteRead])
def list_notes(
    user: CurrentUser,
    service: ServiceDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[NoteRead]:
    """Read: the caller's notes (paginated, newest first)."""
    return service.list(user.id, limit=limit, offset=offset)


@router.get("/{note_id}", response_model=NoteRead)
def get_note(note_id: int, user: CurrentUser, service: ServiceDep) -> NoteRead:
    """Read: one of the caller's notes."""
    return service.get(user.id, note_id)


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, user: CurrentUser, service: ServiceDep) -> NoteRead:
    """Create a note for the caller."""
    return service.create(user.id, payload)


@router.put("/{note_id}", response_model=NoteRead)
def update_note(
    note_id: int, payload: NoteUpdate, user: CurrentUser, service: ServiceDep
) -> NoteRead:
    """Update one of the caller's notes (partial update supported)."""
    return service.update(user.id, note_id, payload)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, user: CurrentUser, service: ServiceDep) -> None:
    """Delete one of the caller's notes."""
    service.delete(user.id, note_id)
