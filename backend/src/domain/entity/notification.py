"""Domain model for notification entity."""

import datetime
from dataclasses import dataclass
from typing import Self
from uuid import UUID, uuid4

from src.core.time_now import now as _utcnow


@dataclass
class Notification:
    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    submission_id: str | None = None
    is_read: bool = False
    read_at: datetime.datetime | None = None
    action_url: str | None = None
    created_at: datetime.datetime | None = None

    def __post_init__(self) -> None:
        if self.created_at is None:
            self.created_at = _utcnow()

    @classmethod
    def New(
        cls,
        user_id: UUID,
        type: str,
        title: str,
        message: str,
        *,
        submission_id: str | None = None,
        action_url: str | None = None,
    ) -> Self:
        """Create a new notification for a user."""
        return cls(
            id=uuid4(),
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            submission_id=submission_id,
            action_url=action_url,
            created_at=_utcnow(),
        )

    def mark_as_read(self) -> None:
        """Mark notification as read."""
        self.is_read = True
        self.read_at = _utcnow()

    @property
    def is_unread(self) -> bool:
        return not self.is_read
