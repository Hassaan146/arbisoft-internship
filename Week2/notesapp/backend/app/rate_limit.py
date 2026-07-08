"""Shared rate limiter instance.

Kept in its own module so both the app composition root (app.main) and the
individual routers can import the same Limiter without a circular import.
Keyed by remote address with a generous default; sensitive routes tighten
this with per-route @limiter.limit(...) decorators.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
