import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.infrastructure.db import Base
from src.domain.entity.template import FormTemplate as DomainFormTemplate

if TYPE_CHECKING:
    from .user import User
    from .submission import Submission

from src.core.time_now import now


class FormTemplate(Base):
    __tablename__ = "form_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    letter_type: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    fields: Mapped[dict | list] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)

    creator: Mapped["User"] = relationship("User", back_populates="templates_created")
    submissions: Mapped[List["Submission"]] = relationship("Submission", back_populates="template")

    def to_domain(self) -> DomainFormTemplate:
        """Convert to domain entity."""
        return DomainFormTemplate(
            id=self.id,
            letter_type=self.letter_type,
            fields=self.fields,
            description=self.description,
            is_active=self.is_active,
            created_by=self.created_by,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_domain(cls, entity: DomainFormTemplate) -> "FormTemplate":
        """Convert domain entity to table model."""
        return cls(
            id=entity.id,
            letter_type=entity.letter_type,
            description=entity.description,
            fields=entity.fields,
            is_active=entity.is_active,
            created_by=entity.created_by,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

