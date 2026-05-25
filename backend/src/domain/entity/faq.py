"""Domain model for FAQ entity."""

import datetime
from dataclasses import dataclass
from typing import Self
from uuid import UUID, uuid4

from src.core.time_now import now as _utcnow


@dataclass
class FAQ:
    id: UUID
    question: str
    answer: str
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
        question: str,
        answer: str,
    ) -> Self:
        """Create a new FAQ entry."""
        now = _utcnow()
        return cls(
            id=uuid4(),
            question=question,
            answer=answer,
            created_at=now,
            updated_at=now,
        )

    def update_answer(self, answer: str) -> None:
        """Update the FAQ answer."""
        self.answer = answer
        self.updated_at = _utcnow()

    def update_question(self, question: str) -> None:
        """Update the FAQ question."""
        self.question = question
        self.updated_at = _utcnow()
