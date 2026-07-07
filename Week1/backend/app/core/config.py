"""Application settings, loaded from the environment (12-factor).

Every value can be overridden with a ``VELDARA_``-prefixed environment
variable (e.g. ``VELDARA_DATA_FILE=/somewhere/reviews.json``), so nothing
environment-specific is hardcoded.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Runtime configuration for the API."""

    model_config = SettingsConfigDict(
        env_prefix="VELDARA_",
        env_file=BACKEND_DIR / ".env",
        extra="ignore",
    )

    data_file: Path = BACKEND_DIR / "data" / "reviews.json"
    seed_file: Path = BACKEND_DIR / "data" / "reviews.seed.json"

    # Explicit origin allowlist — never a wildcard.
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    rate_limit_enabled: bool = True
    rate_limit_default: str = "60/minute"
    rate_limit_write: str = "10/minute"


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings instance."""
    return Settings()
