"""Application factory: middleware, error handling, and route registration.

Run locally with:
    uvicorn app.main:app --reload --port 8001
Interactive docs: http://localhost:8001/api/docs
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.routes.reviews import router as reviews_router
from app.core.config import Settings, get_settings
from app.core.ratelimit import limiter
from app.services.review_service import ReviewNotFoundError

logger = logging.getLogger("veldara.api")


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the FastAPI app. Tests pass their own ``Settings``."""
    settings = settings or get_settings()

    app = FastAPI(
        title="Veldara Reviews API",
        version="1.0.0",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
    )

    # Rate limiting (per-IP): default limit app-wide, stricter on writes.
    limiter.enabled = settings.rate_limit_enabled
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # CORS: explicit allowlist only. In dev the Vite proxy makes requests
    # same-origin, but the API stays safe when called directly.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

    @app.exception_handler(ReviewNotFoundError)
    async def not_found_handler(request: Request, exc: ReviewNotFoundError):
        # Generic message: never echo internal detail back to the client.
        return JSONResponse(status_code=404, content={"detail": "Review not found"})

    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, exc: Exception):
        # Full context to the log, generic message to the client.
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    app.include_router(reviews_router, prefix="/api")

    @app.get("/api/health", tags=["meta"])
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()
