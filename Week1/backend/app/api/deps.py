"""Dependency providers: settings → repository → service.

Routes never construct their own collaborators; they receive a
``ReviewService`` via FastAPI's dependency injection. Tests override
``get_repository`` to point at a temp file.
"""

from functools import lru_cache

from fastapi import Depends

from app.core.config import get_settings
from app.repositories.review_repository import JsonReviewRepository, ReviewRepository
from app.services.review_service import ReviewService


@lru_cache
def get_repository() -> ReviewRepository:
    """One repository per process, built from settings."""
    settings = get_settings()
    return JsonReviewRepository(settings.data_file, settings.seed_file)


def get_service(
    repository: ReviewRepository = Depends(get_repository),
) -> ReviewService:
    return ReviewService(repository)
