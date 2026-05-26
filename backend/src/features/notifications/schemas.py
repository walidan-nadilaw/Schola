"""Pydantic schemas for the Notifications feature."""

from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    submission_id: str | None = None
    is_read: bool
    read_at: datetime | None = None
    action_url: str | None = None
    created_at: datetime | None = None
