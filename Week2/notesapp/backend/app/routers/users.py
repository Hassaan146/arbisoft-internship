"""User routes: public registration, self profile, and admin-only listing."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.dependencies import AdminUser, CurrentUser, get_user_service
from app.schemas import UserCreate, UserRead
from app.services import UserService

router = APIRouter(prefix="/users", tags=["users"])

ServiceDep = Annotated[UserService, Depends(get_user_service)]


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, service: ServiceDep) -> UserRead:
    """Register a new user (username + 4-digit PIN). Public."""
    return service.create(payload)


@router.get("/me", response_model=UserRead)
def read_me(user: CurrentUser) -> UserRead:
    """Return the currently authenticated user (from their token)."""
    return user


@router.get("", response_model=list[UserRead])
def list_users(_: AdminUser, service: ServiceDep) -> list[UserRead]:
    """List all users. Admin only — and it never includes note contents."""
    return service.list()
