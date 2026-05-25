"""Domain model for form template entity."""

import datetime
from dataclasses import dataclass
from typing import Any, Self
from uuid import UUID, uuid4

from src.core.time_now import now as _utcnow


@dataclass
class FormTemplate:
    id: UUID
    letter_type: str
    fields: dict[str, Any] | list[Any]
    description: str | None = None
    is_active: bool = True
    created_by: UUID | None = None
    created_at: datetime.datetime | None = None
    updated_at: datetime.datetime | None = None

    def __post_init__(self) -> None:
        if self.created_at is None:
            self.created_at = _utcnow()
        if self.updated_at is None:
            self.updated_at = self.created_at

    @classmethod
    def New(
        cls,
        letter_type: str,
        fields: dict[str, Any] | list[Any],
        *,
        description: str | None = None,
        created_by: UUID | None = None,
    ) -> Self:
        """Create a new form template."""
        now = _utcnow()
        return cls(
            id=uuid4(),
            letter_type=letter_type,
            fields=fields,
            description=description,
            is_active=True,
            created_by=created_by,
            created_at=now,
            updated_at=now,
        )

    def deactivate(self) -> None:
        """Mark template as inactive."""
        self.is_active = False
        self.updated_at = _utcnow()

    def activate(self) -> None:
        """Mark template as active."""
        self.is_active = True
        self.updated_at = _utcnow()
