import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..database import Base


def _now():
    """Timezone-aware UTC timestamp (replaces deprecated datetime.utcnow)."""
    return datetime.now(timezone.utc)


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(50), primary_key=True)          # e.g. SKA/2026/0001
    template_id = Column(UUID(as_uuid=True), ForeignKey("form_templates.id", ondelete="RESTRICT"), nullable=False, index=True)
    submitter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    letter_type = Column(String(255), nullable=False, index=True)
    form_data = Column(JSONB, nullable=False)
    status = Column(String(50), nullable=False, default="draft", index=True)
    is_ordered_verification = Column(Boolean, default=False)

    submitted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    rejection_reason = Column(Text, nullable=True)
    rejected_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    template = relationship("FormTemplate", back_populates="submissions")
    submitter = relationship("User", back_populates="submissions", foreign_keys=[submitter_id])
    verifiers = relationship("SubmissionVerifier", back_populates="submission", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="submission", cascade="all, delete-orphan")


class SubmissionVerifier(Base):
    __tablename__ = "submission_verifiers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(String(50), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    verifier_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    verifier_order = Column(Integer, nullable=True)
    verifier_role = Column(String(50), nullable=True)   # "verifier" | "signer"

    status = Column(String(50), default="pending", nullable=False, index=True)
    comment = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    signature_hash = Column(String(255), nullable=True)
    signature_timestamp = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    submission = relationship("Submission", back_populates="verifiers")
    verifier = relationship("User", back_populates="verifications")

    @property
    def verifier_name(self) -> str:
        return self.verifier.name if self.verifier else ""


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(String(50), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=True, index=True)

    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    file_path = Column(Text, nullable=False)
    file_hash = Column(String(255), nullable=True)

    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=_now)

    submission = relationship("Submission", back_populates="attachments")
