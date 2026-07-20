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

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
