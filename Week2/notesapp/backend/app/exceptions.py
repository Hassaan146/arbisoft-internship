"""Domain-level exceptions, decoupled from the HTTP transport.

Services raise these; the router layer maps them to HTTP responses. This keeps
business logic framework-agnostic and testable without a web server. Each
exception carries a sensible default message, so callers can raise it bare
(e.g. `raise NotFoundError()`) or pass a more specific one.
"""


class DomainError(Exception):
    """Base class for expected, handleable domain errors."""

    default_message = "A domain error occurred."

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.default_message)


class NotFoundError(DomainError):
    """A requested entity does not exist."""

    default_message = "The requested resource was not found."


class ConflictError(DomainError):
    """The operation conflicts with current state (e.g. duplicate username)."""

    default_message = "The request conflicts with the current state."


class ValidationError(DomainError):
    """A business rule was violated that Pydantic cannot express alone."""

    default_message = "The request is not valid."
