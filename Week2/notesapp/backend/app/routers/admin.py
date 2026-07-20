"""Admin routes — protected by the admin role, counts only."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies import AdminUser, get_admin_service
from app.schemas import AdminStats
from app.services import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])

ServiceDep = Annotated[AdminService, Depends(get_admin_service)]


@router.get("/stats", response_model=AdminStats)
def stats(_: AdminUser, service: ServiceDep) -> AdminStats:
    """Aggregate counts for the admin panel (never any note contents)."""
    return service.stats()
