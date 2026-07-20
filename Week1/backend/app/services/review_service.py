"""Business logic for reviews.

Sits between the HTTP layer (thin controllers) and the repository (raw
storage). Knows nothing about FastAPI or files — it works with validated
schema objects and plain dicts, which keeps it trivially unit-testable.
"""

from app.repositories.review_repository import ReviewRepository
from app.schemas.review import ReviewCreate


class ReviewNotFoundError(LookupError):
    """Raised when a review id does not exist; mapped to HTTP 404 in main."""

    def __init__(self, review_id: str) -> None:
        super().__init__(f"Review {review_id!r} not found")
        self.review_id = review_id


class ReviewService:
    """CRUD operations on reviews, with pagination on the list."""

    def __init__(self, repository: ReviewRepository) -> None:
        self._repository = repository

    def list_reviews(self, limit: int, offset: int) -> tuple[list[dict], int]:
        """Return one page of reviews plus the total count."""
        rows = self._repository.list_all()
        return rows[offset : offset + limit], len(rows)

    def get_review(self, review_id: str) -> dict:
        row = self._repository.get(review_id)
        if row is None:
            raise ReviewNotFoundError(review_id)
        return row

    def create_review(self, data: ReviewCreate) -> dict:
        return self._repository.add(data.model_dump())

    def replace_review(self, review_id: str, data: ReviewCreate) -> dict:
        row = self._repository.replace(review_id, data.model_dump())
        if row is None:
            raise ReviewNotFoundError(review_id)
        return row

    def delete_review(self, review_id: str) -> None:
        if not self._repository.delete(review_id):
            raise ReviewNotFoundError(review_id)
