"""Pydantic schemas for the Dashboard feature."""

from datetime import datetime

from pydantic import BaseModel


class RecentActivityItem(BaseModel):
    id: str
    type: str
    description: str
    timestamp: datetime | None = None


class DashboardStatsResponse(BaseModel):
    total_submissions: int
    draft_submissions: int
    submitted_submissions: int
    approved_submissions: int
    rejected_submissions: int
    pending_verifications: int
    recent_activity: list[RecentActivityItem]
