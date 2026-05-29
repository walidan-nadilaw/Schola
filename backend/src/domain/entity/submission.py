"""Domain model for submission entities."""

import datetime
import enum
from dataclasses import dataclass, field
from typing import Any, Self
from uuid import UUID, uuid4

from src.core.time_now import now as _utcnow


class SubmissionStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class VerifierRole(str, enum.Enum):
    VERIFIER = "verifier"
    SIGNER = "signer"


class VerifierStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


@dataclass
class Attachment:
    id: UUID
    file_name: str
    file_size: int
    file_type: str
    file_path: str
    submission_id: str | None = None
    file_hash: str | None = None
    uploaded_by: UUID | None = None
    uploaded_at: datetime.datetime | None = None

    def __post_init__(self) -> None:
        if self.uploaded_at is None:
            self.uploaded_at = _utcnow()

    @classmethod
    def New(
        cls,
        file_name: str,
        file_size: int,
        file_type: str,
        file_path: str,
        *,
        submission_id: str | None = None,
        file_hash: str | None = None,
        uploaded_by: UUID | None = None,
    ) -> Self:
        """Create a new attachment."""
        return cls(
            id=uuid4(),
            file_name=file_name,
            file_size=file_size,
            file_type=file_type,
            file_path=file_path,
            submission_id=submission_id,
            file_hash=file_hash,
            uploaded_by=uploaded_by,
            uploaded_at=_utcnow(),
        )


@dataclass
class SubmissionVerifier:
    id: UUID
    submission_id: str
    verifier_id: UUID
    status: VerifierStatus = VerifierStatus.PENDING
    verifier_order: int | None = None
    verifier_role: VerifierRole | None = None
    comment: str | None = None
    verified_at: datetime.datetime | None = None
    signature_hash: str | None = None
    signature_timestamp: datetime.datetime | None = None
    created_at: datetime.datetime | None = None
    updated_at: datetime.datetime | None = None
    verifier_name: str | None = None

    def __post_init__(self) -> None:
        if self.created_at is None:
            self.created_at = _utcnow()
        if self.updated_at is None:
            self.updated_at = self.created_at

    @classmethod
    def New(
        cls,
        submission_id: str,
        verifier_id: UUID,
        *,
        verifier_order: int | None = None,
        verifier_role: VerifierRole | None = None,
    ) -> Self:
        """Assign a new verifier to a submission."""
        now = _utcnow()
        return cls(
            id=uuid4(),
            submission_id=submission_id,
            verifier_id=verifier_id,
            verifier_order=verifier_order,
            verifier_role=verifier_role,
            created_at=now,
            updated_at=now,
        )

    def approve(self, *, comment: str | None = None) -> None:
        """Mark this verification step as approved."""
        now = _utcnow()
        self.status = VerifierStatus.APPROVED
        self.comment = comment
        self.verified_at = now
        self.updated_at = now

    def reject(self, *, comment: str | None = None) -> None:
        """Mark this verification step as rejected."""
        now = _utcnow()
        self.status = VerifierStatus.REJECTED
        self.comment = comment
        self.verified_at = now
        self.updated_at = now

    def sign(self, signature_hash: str) -> None:
        """Apply a digital signature."""
        now = _utcnow()
        self.signature_hash = signature_hash
        self.signature_timestamp = now
        self.updated_at = now

    def cancel(self) -> None:
        """Cancel this verification step (downstream of a rejection)."""
        now = _utcnow()
        self.status = VerifierStatus.CANCELLED
        self.updated_at = now


@dataclass
class Submission:
    id: str  # e.g. SKA/2026/0001
    template_id: UUID
    submitter_id: UUID
    letter_type: str
    form_data: dict[str, Any] | list[Any]
    status: SubmissionStatus = SubmissionStatus.DRAFT
    is_ordered_verification: bool = False
    submitted_at: datetime.datetime | None = None
    verified_at: datetime.datetime | None = None
    rejection_reason: str | None = None
    rejected_by: UUID | None = None
    rejected_at: datetime.datetime | None = None
    verifiers: list[SubmissionVerifier] = field(default_factory=list)
    attachments: list[Attachment] = field(default_factory=list)
    created_at: datetime.datetime | None = None
    updated_at: datetime.datetime | None = None
    submitter_name: str | None = None
    submitter_nim: str | None = None

    def __post_init__(self) -> None:
        if self.created_at is None:
            self.created_at = _utcnow()
        if self.updated_at is None:
            self.updated_at = self.created_at

    @classmethod
    def New(
        cls,
        submission_id: str,
        template_id: UUID,
        submitter_id: UUID,
        letter_type: str,
        form_data: dict[str, Any] | list[Any],
        *,
        is_ordered_verification: bool = False,
    ) -> Self:
        """Create a new draft submission."""
        now = _utcnow()
        return cls(
            id=submission_id,
            template_id=template_id,
            submitter_id=submitter_id,
            letter_type=letter_type,
            form_data=form_data,
            is_ordered_verification=is_ordered_verification,
            created_at=now,
            updated_at=now,
        )

    def submit(self) -> None:
        """Move submission from draft to submitted."""
        now = _utcnow()
        self.status = SubmissionStatus.SUBMITTED
        self.submitted_at = now
        self.updated_at = now

    def approve(self) -> None:
        """Mark the submission as fully approved."""
        now = _utcnow()
        self.status = SubmissionStatus.APPROVED
        self.verified_at = now
        self.updated_at = now

    def reject(self, rejected_by: UUID, reason: str) -> None:
        """Reject the submission with a reason."""
        now = _utcnow()
        self.status = SubmissionStatus.REJECTED
        self.rejection_reason = reason
        self.rejected_by = rejected_by
        self.rejected_at = now
        self.updated_at = now

    @property
    def is_draft(self) -> bool:
        return self.status == SubmissionStatus.DRAFT

    @property
    def is_submitted(self) -> bool:
        return self.status == SubmissionStatus.SUBMITTED
