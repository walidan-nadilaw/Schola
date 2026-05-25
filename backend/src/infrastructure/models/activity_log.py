import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.db import Base
from src.core.time_now import now
from src.domain.entity.activity_log import ActivityLog as DomainActivityLog


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    submission_id: Mapped[str | None] = mapped_column(String(50), ForeignKey("submissions.id", ondelete="SET NULL"), nullable=True, index=True)

    action_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_metadata: Mapped[dict | list | None] = mapped_column("metadata", JSONB, nullable=True)

    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    def to_domain(self) -> DomainActivityLog:
        """Convert to domain entity."""
        return DomainActivityLog(
            id=self.id,
            action_type=self.action_type,
            user_id=self.user_id,
            submission_id=self.submission_id,
            description=self.description,
            action_metadata=self.action_metadata,
            ip_address=self.ip_address,
            user_agent=self.user_agent,
            created_at=self.created_at,
        )

    @classmethod
    def from_domain(cls, entity: DomainActivityLog) -> "ActivityLog":
        """Convert domain entity to table model."""
        return cls(
            id=entity.id,
            user_id=entity.user_id,
            submission_id=entity.submission_id,
            action_type=entity.action_type,
            description=entity.description,
            action_metadata=entity.action_metadata,
            ip_address=entity.ip_address,
            user_agent=entity.user_agent,
            created_at=entity.created_at,
        )

