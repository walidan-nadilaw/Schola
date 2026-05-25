"""Domain model for activity log entity."""

import datetime
from dataclasses import dataclass
from typing import Any, Self
from uuid import UUID, uuid4

from src.core.time_now import now as _utcnow


@dataclass
class ActivityLog:
    id: UUID
    action_type: str
    user_id: UUID | None = None
    submission_id: str | None = None
    description: str | None = None
    action_metadata: dict[str, Any] | list[Any] | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime.datetime | None = None

    def __post_init__(self) -> None:
        if self.created_at is None:
            self.created_at = _utcnow()

    @classmethod
    def New(
        cls,
        action_type: str,
        *,
        user_id: UUID | None = None,
        submission_id: str | None = None,
        description: str | None = None,
        action_metadata: dict[str, Any] | list[Any] | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Self:
        """Record a new activity log entry."""
        return cls(
            id=uuid4(),
            action_type=action_type,
            user_id=user_id,
            submission_id=submission_id,
            description=description,
            action_metadata=action_metadata,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=_utcnow(),
        )
