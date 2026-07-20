"""Application entry point / composition root.

Wires transport concerns (CORS, error mapping, security headers, rate limiting,
logging, routers) around the framework-agnostic core.
Run with: `uvicorn app.main:app --reload`.
"""

import logging
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.exceptions import (
    AuthError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
)
from app.logging_config import configure_logging
from app.rate_limit import limiter
from app.routers import admin, auth, notes, users
from app.services import UserService

settings = get_settings()
logger = logging.getLogger(__name__)


def _seed_admin() -> None:
    """Ensure the configured admin account exists (idempotent)."""
    db = SessionLocal()
    try:
        UserService(db).ensure_admin(settings.admin_username, settings.admin_pin)
    finally:
        db.close()


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title=settings.app_name, version="1.0.0")

    # Rate limiting wiring.
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # CORS: explicit allowlist, never a wildcard in production.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    _register_exception_handlers(app)
    _register_security_headers(app)

    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(notes.router)
    app.include_router(admin.router)

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    # Dev convenience: create tables on startup. Use migrations in production.
    Base.metadata.create_all(bind=engine)
    _seed_admin()
    return app


def _register_exception_handlers(app: FastAPI) -> None:
    """Map domain errors to HTTP responses; never leak internals to clients."""

    @app.exception_handler(NotFoundError)
    async def _not_found(_: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)})

    @app.exception_handler(ConflictError)
    async def _conflict(_: Request, exc: ConflictError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})

    @app.exception_handler(AuthError)
    async def _auth(_: Request, exc: AuthError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": str(exc)})

    @app.exception_handler(ForbiddenError)
    async def _forbidden(_: Request, exc: ForbiddenError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": str(exc)})

    @app.exception_handler(ValidationError)
    async def _validation(_: Request, exc: ValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": str(exc)}
        )

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception) -> JSONResponse:
        # Full context to the logs, a generic message to the client (area 9).
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )


def _register_security_headers(app: FastAPI) -> None:
    """Add baseline hardening headers (area 7 of the checklist)."""

    @app.middleware("http")
    async def security_headers(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        # Allow only what the app actually loads: Google Fonts (CSS + font
        # files), the CloudFront background video over https, and the inline
        # styles Tailwind/React emit. Everything else defaults to same-origin.
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data:; "
            "media-src https:; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src https: data:; "
            "connect-src 'self'"
        )
        return response


app = create_app()
