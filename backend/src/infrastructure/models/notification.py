import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.infrastructure.db import Base
from src.core.time_now import now
from src.domain.entity.notification import Notification as DomainNotification


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_id: Mapped[str | None] = mapped_column(String(50), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=True)

    type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    action_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    def to_domain(self) -> DomainNotification:
        """Convert to domain entity."""
        return DomainNotification(
            id=self.id,
            user_id=self.user_id,
            type=self.type,
            title=self.title,
            message=self.message,
            submission_id=self.submission_id,
            is_read=self.is_read,
            read_at=self.read_at,
            action_url=self.action_url,
            created_at=self.created_at,
        )

    @classmethod
    def from_domain(cls, entity: DomainNotification) -> "Notification":
        """Convert domain entity to table model."""
        return cls(
            id=entity.id,
            user_id=entity.user_id,
            submission_id=entity.submission_id,
            type=entity.type,
            title=entity.title,
            message=entity.message,
            is_read=entity.is_read,
            read_at=entity.read_at,
            action_url=entity.action_url,
            created_at=entity.created_at,
        )

