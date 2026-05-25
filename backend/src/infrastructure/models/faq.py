import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.infrastructure.db import Base
from src.core.time_now import now
from src.domain.entity.faq import FAQ as DomainFAQ


class FAQ(Base):
    __tablename__ = "faqs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)

    def to_domain(self) -> DomainFAQ:
        """Convert to domain entity."""
        return DomainFAQ(
            id=self.id,
            question=self.question,
            answer=self.answer,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_domain(cls, entity: DomainFAQ) -> "FAQ":
        """Convert domain entity to table model."""
        return cls(
            id=entity.id,
            question=entity.question,
            answer=entity.answer,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

