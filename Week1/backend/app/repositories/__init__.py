"""Data-access layer."""

from app.repositories.review_repository import JsonReviewRepository, ReviewRepository

__all__ = ["JsonReviewRepository", "ReviewRepository"]
