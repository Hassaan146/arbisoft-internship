"""Shared per-IP rate limiter.

Module-level so route decorators and the app factory reference the same
instance; ``create_app`` toggles ``limiter.enabled`` from settings (tests
turn it off).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[get_settings().rate_limit_default],
)
