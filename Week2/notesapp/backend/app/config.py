"""Application configuration loaded from environment (twelve-factor).

No client-specific values or secrets are hardcoded; everything overridable
via environment variables. See `.env.example` for the supported keys.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the Notes API."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Notes API"
    database_url: str = "sqlite:///./notes.db"
    # Comma-separated list of allowed CORS origins (no wildcard in prod).
    cors_origins: str = "http://localhost:5173"

    # --- JWT auth ---
    # jwt_secret has NO default: the app refuses to start unless it is provided
    # via the environment, so an insecure secret is never shipped in code.
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    # Per-route rate limit for the auth endpoints (login / reset-password).
    auth_rate_limit: str = "5/minute"

    # --- Admin seed: ensured on startup so there is always one admin ---
    # The PIN is a credential, so it must come from the environment (no default).
    admin_username: str = "admin"
    admin_pin: str

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
