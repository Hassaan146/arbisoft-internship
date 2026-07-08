"""Pydantic schemas for the admin panel."""

from pydantic import BaseModel


class AdminStats(BaseModel):
    """Aggregate counts for the admin panel — never any note contents."""

    total_users: int
    users_logged_in: int
    total_login_events: int
    total_notes: int
