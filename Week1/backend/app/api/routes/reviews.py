"""HTTP layer for /api/reviews — thin controllers that delegate to the service.

No business logic lives here: each handler validates input (via Pydantic and
Query constraints), calls one service method, and picks the status code.
Write endpoints carry a stricter per-IP rate limit than reads.
"""

from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import get_service
from app.core.config import get_settings
from app.core.ratelimit import limiter
from app.schemas.review import ReviewCreate, ReviewOut, ReviewPage
from app.services.review_service import ReviewService

router = APIRouter(prefix="/reviews", tags=["reviews"])

WRITE_LIMIT = get_settings().rate_limit_write


@router.get("", response_model=ReviewPage)
def list_reviews(
    limit: int = Query(50, ge=1, le=100, description="Page size"),
    offset: int = Query(0, ge=0, description="Items to skip"),
    service: ReviewService = Depends(get_service),
) -> ReviewPage:
    items, total = service.list_reviews(limit=limit, offset=offset)
    return ReviewPage(items=items, total=total, limit=limit, offset=offset)


@router.get("/{review_id}", response_model=ReviewOut)
def get_review(review_id: str, service: ReviewService = Depends(get_service)) -> dict:
    return service.get_review(review_id)


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
@limiter.limit(WRITE_LIMIT)
def create_review(
    request: Request,
    payload: ReviewCreate,
    service: ReviewService = Depends(get_service),
) -> dict:
    return service.create_review(payload)


@router.put("/{review_id}", response_model=ReviewOut)
@limiter.limit(WRITE_LIMIT)
def replace_review(
    request: Request,
    review_id: str,
    payload: ReviewCreate,
    service: ReviewService = Depends(get_service),
) -> dict:
    return service.replace_review(review_id, payload)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(WRITE_LIMIT)
def delete_review(
    request: Request,
    review_id: str,
    service: ReviewService = Depends(get_service),
) -> None:
    service.delete_review(review_id)
