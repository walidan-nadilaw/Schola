import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.infrastructure.db import Base
from src.core.time_now import now
from src.domain.entity.submission import (
    Attachment as DomainAttachment,
    Submission as DomainSubmission,
    SubmissionStatus,
    SubmissionVerifier as DomainSubmissionVerifier,
    VerifierRole,
    VerifierStatus,
)

if TYPE_CHECKING:
    from .template import FormTemplate
    from .user import User


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)          # e.g. SKA/2026/0001
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("form_templates.id", ondelete="RESTRICT"), nullable=False, index=True)
    submitter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    letter_type: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    form_data: Mapped[dict | list] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft", index=True)
    is_ordered_verification: Mapped[bool] = mapped_column(Boolean, default=False)

    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    rejected_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)

    template: Mapped["FormTemplate"] = relationship("FormTemplate", back_populates="submissions")
    submitter: Mapped["User"] = relationship("User", back_populates="submissions", foreign_keys=[submitter_id])
    verifiers: Mapped[List["SubmissionVerifier"]] = relationship("SubmissionVerifier", back_populates="submission", cascade="all, delete-orphan")
    attachments: Mapped[List["Attachment"]] = relationship("Attachment", back_populates="submission", cascade="all, delete-orphan")

    def to_domain(self) -> DomainSubmission:
        """Convert to domain entity."""
        return DomainSubmission(
            id=self.id,
            template_id=self.template_id,
            submitter_id=self.submitter_id,
            letter_type=self.letter_type,
            form_data=self.form_data,
            status=SubmissionStatus(self.status),
            is_ordered_verification=self.is_ordered_verification,
            submitted_at=self.submitted_at,
            verified_at=self.verified_at,
            rejection_reason=self.rejection_reason,
            rejected_by=self.rejected_by,
            rejected_at=self.rejected_at,
            verifiers=[v.to_domain() for v in self.verifiers],
            attachments=[a.to_domain() for a in self.attachments],
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_domain(cls, entity: DomainSubmission) -> "Submission":
        """Convert domain entity to table model."""
        return cls(
            id=entity.id,
            template_id=entity.template_id,
            submitter_id=entity.submitter_id,
            letter_type=entity.letter_type,
            form_data=entity.form_data,
            status=entity.status.value,
            is_ordered_verification=entity.is_ordered_verification,
            submitted_at=entity.submitted_at,
            verified_at=entity.verified_at,
            rejection_reason=entity.rejection_reason,
            rejected_by=entity.rejected_by,
            rejected_at=entity.rejected_at,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )


class SubmissionVerifier(Base):
    __tablename__ = "submission_verifiers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[str] = mapped_column(String(50), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    verifier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    verifier_order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verifier_role: Mapped[str | None] = mapped_column(String(50), nullable=True)   # "verifier" | "signer"

    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False, index=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    signature_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    signature_timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)

    submission: Mapped["Submission"] = relationship("Submission", back_populates="verifiers")
    verifier: Mapped["User"] = relationship("User", back_populates="verifications")

    @property
    def verifier_name(self) -> str:
        return self.verifier.nama if self.verifier else ""

    def to_domain(self) -> DomainSubmissionVerifier:
        """Convert to domain entity."""
        return DomainSubmissionVerifier(
            id=self.id,
            submission_id=self.submission_id,
            verifier_id=self.verifier_id,
            status=VerifierStatus(self.status),
            verifier_order=self.verifier_order,
            verifier_role=VerifierRole(self.verifier_role) if self.verifier_role else None,
            comment=self.comment,
            verified_at=self.verified_at,
            signature_hash=self.signature_hash,
            signature_timestamp=self.signature_timestamp,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_domain(cls, entity: DomainSubmissionVerifier) -> "SubmissionVerifier":
        """Convert domain entity to table model."""
        return cls(
            id=entity.id,
            submission_id=entity.submission_id,
            verifier_id=entity.verifier_id,
            verifier_order=entity.verifier_order,
            verifier_role=entity.verifier_role.value if entity.verifier_role else None,
            status=entity.status.value,
            comment=entity.comment,
            verified_at=entity.verified_at,
            signature_hash=entity.signature_hash,
            signature_timestamp=entity.signature_timestamp,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[str | None] = mapped_column(String(50), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=True, index=True)

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    submission: Mapped["Submission"] = relationship("Submission", back_populates="attachments")

    def to_domain(self) -> DomainAttachment:
        """Convert to domain entity."""
        return DomainAttachment(
            id=self.id,
            file_name=self.file_name,
            file_size=self.file_size,
            file_type=self.file_type,
            file_path=self.file_path,
            submission_id=self.submission_id,
            file_hash=self.file_hash,
            uploaded_by=self.uploaded_by,
            uploaded_at=self.uploaded_at,
        )

    @classmethod
    def from_domain(cls, entity: DomainAttachment) -> "Attachment":
        """Convert domain entity to table model."""
        return cls(
            id=entity.id,
            submission_id=entity.submission_id,
            file_name=entity.file_name,
            file_size=entity.file_size,
            file_type=entity.file_type,
            file_path=entity.file_path,
            file_hash=entity.file_hash,
            uploaded_by=entity.uploaded_by,
            uploaded_at=entity.uploaded_at,
        )
