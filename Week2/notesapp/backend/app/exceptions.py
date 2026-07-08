"""Domain-level exceptions, decoupled from the HTTP transport.

Services raise these; the router layer maps them to HTTP responses. This keeps
business logic framework-agnostic and testable without a web server.
"""


class DomainError(Exception):
    """Base class for expected, handleable domain errors."""


class NotFoundError(DomainError):
    """A requested entity does not exist."""


class ConflictError(DomainError):
    """The operation conflicts with current state (e.g. duplicate username)."""


class ValidationError(DomainError):
    """A business rule was violated that Pydantic cannot express alone."""


class AuthError(DomainError):
    """Authentication failed (missing/invalid credentials or token → 401)."""


class ForbiddenError(DomainError):
    """The caller is authenticated but lacks permission (→ 403)."""
