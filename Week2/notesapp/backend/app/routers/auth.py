"""Authentication routes: login (issues a JWT) and password reset."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.dependencies import get_user_service
from app.rate_limit import limiter
from app.schemas import PasswordReset, Token, UserLogin, UserRead
from app.services import UserService
from app.tokens import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

ServiceDep = Annotated[UserService, Depends(get_user_service)]


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, payload: UserLogin, service: ServiceDep) -> Token:
    """Verify credentials and return a signed JWT access token."""
    user = service.authenticate(payload.username, payload.password)
    token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=token, role=user.role)


@router.post("/reset-password", response_model=UserRead)
@limiter.limit("5/minute")
def reset_password(request: Request, payload: PasswordReset, service: ServiceDep) -> UserRead:
    """Set a new 4-digit PIN for an existing username (404 if unknown)."""
    return service.reset_password(payload.username, payload.password)
