import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .database import Base


def _now():
    """Timezone-aware UTC timestamp (replaces deprecated datetime.utcnow)."""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, index=True)
    department = Column(String(255), nullable=True, index=True)

    # Student-specific
    nim = Column(String(50), unique=True, nullable=True, index=True)
    fakultas = Column(String(255), nullable=True)
    program = Column(String(255), nullable=True)
    semester = Column(Integer, nullable=True)

    # Faculty/Staff-specific
    nip = Column(String(50), unique=True, nullable=True, index=True)
    position = Column(String(255), nullable=True)

    # Common
    phone = Column(String(20), nullable=True)
    profile_picture_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    submissions = relationship("Submission", back_populates="submitter", foreign_keys="[Submission.submitter_id]")
    verifications = relationship("SubmissionVerifier", back_populates="verifier")
    templates_created = relationship("FormTemplate", back_populates="creator")


class FormTemplate(Base):
    __tablename__ = "form_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    letter_type = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    fields = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True, index=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    creator = relationship("User", back_populates="templates_created")
    submissions = relationship("Submission", back_populates="template")


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


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    submission_id = Column(String(50), ForeignKey("submissions.id", ondelete="SET NULL"), nullable=True, index=True)

    action_type = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    action_metadata = Column("metadata", JSONB, nullable=True)

    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_id = Column(String(50), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=True)

    type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    action_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)
