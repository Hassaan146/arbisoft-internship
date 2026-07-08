"""FastAPI dependency providers: DB sessions, services, and auth guards.

The auth guards here are the reusable half of JWT authorization:
  - `CurrentUser`  → any authenticated user (valid Bearer token)
  - `AdminUser`    → an authenticated user whose role is "admin"
Drop these onto any route to protect it.
"""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.exceptions import AuthError, ForbiddenError
from app.models import User
from app.repositories import UserRepository
from app.services import AdminService, NoteService, UserService
from app.tokens import InvalidTokenError, decode_access_token

# Reusable "give me a request-scoped DB session" dependency.
DbSession = Annotated[Session, Depends(get_db)]

# auto_error=False so a missing token yields our own 401 (via AuthError),
# not FastAPI's default 403.
_bearer = HTTPBearer(auto_error=False)
BearerCreds = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]


def get_user_service(db: DbSession) -> UserService:
    """Provide a UserService bound to the current request's DB session."""
    return UserService(db)


def get_note_service(db: DbSession) -> NoteService:
    """Provide a NoteService bound to the current request's DB session."""
    return NoteService(db)


def get_admin_service(db: DbSession) -> AdminService:
    """Provide an AdminService bound to the current request's DB session."""
    return AdminService(db)


def get_current_user(credentials: BearerCreds, db: DbSession) -> User:
    """Resolve the authenticated user from the Bearer token, or raise 401."""
    if credentials is None:
        raise AuthError("not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
    except InvalidTokenError as exc:
        raise AuthError("invalid or expired token") from exc

    user_id = payload.get("sub")
    try:
        user = UserRepository(db).get(int(user_id)) if user_id is not None else None
    except (ValueError, TypeError) as exc:
        raise AuthError("invalid token claims") from exc
    if user is None:
        raise AuthError("user no longer exists")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    """Allow only admins through; any other role gets a 403."""
    if user.role != "admin":
        raise ForbiddenError("admin privileges required")
    return user


AdminUser = Annotated[User, Depends(require_admin)]
