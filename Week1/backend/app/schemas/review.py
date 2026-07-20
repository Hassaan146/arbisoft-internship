"""Pydantic schemas for the review resource.

This is the validation boundary: every request body is parsed against these
models before it reaches business logic. Constraints are allowlist-style —
bounded lengths and a 1-5 star range — so oversized or malformed payloads
are rejected at the edge with a 422.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewBase(BaseModel):
    """Fields a client may supply."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=80, description="Reviewer's display name")
    role: str = Field(min_length=2, max_length=120, description="Role / company line")
    quote: str = Field(min_length=10, max_length=1000, description="The review text")
    stars: int = Field(ge=1, le=5, description="Star rating, 1-5")


class ReviewCreate(ReviewBase):
    """Request body for POST (create) and PUT (full replace)."""


class ReviewOut(ReviewBase):
    """A stored review, as returned to clients."""

    id: str
    created_at: datetime


class ReviewPage(BaseModel):
    """Paginated list envelope for GET /reviews."""

    items: list[ReviewOut]
    total: int
    limit: int
    offset: int
