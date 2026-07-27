"""Note routes: full CRUD over the notes collection."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.dependencies import get_note_service
from app.schemas import NoteCreate, NoteRead, NoteUpdate
from app.services import NoteService

router = APIRouter(prefix="/notes", tags=["notes"])

ServiceDep = Annotated[NoteService, Depends(get_note_service)]


@router.get("", response_model=list[NoteRead])
def list_notes(
    service: ServiceDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[NoteRead]:
    """Read: all notes (paginated, newest first)."""
    return service.list(limit=limit, offset=offset)


@router.get("/{note_id}", response_model=NoteRead)
def get_note(note_id: int, service: ServiceDep) -> NoteRead:
    """Read: a single note."""
    return service.get(note_id)


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, service: ServiceDep) -> NoteRead:
    """Create a note."""
    return service.create(payload)


@router.put("/{note_id}", response_model=NoteRead)
def update_note(note_id: int, payload: NoteUpdate, service: ServiceDep) -> NoteRead:
    """Update a note (partial update supported)."""
    return service.update(note_id, payload)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, service: ServiceDep) -> None:
    """Delete a note."""
    service.delete(note_id)
