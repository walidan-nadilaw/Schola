"""Pydantic schemas for the Verification feature."""

from datetime import datetime

from pydantic import BaseModel


# -- Requests --


class VerifyActionRequest(BaseModel):
    submission_id: str
    action: str  # "approved" | "rejected"
    comment: str | None = None
    rejection_reason: str | None = None


# -- Responses --


class PendingVerificationResponse(BaseModel):
    submission_id: str
    letter_type: str
    keperluan: str | None = "Keperluan Akademik"
    submitter_id: str
    created_at: datetime
    verifier_order: int | None = None
    verifier_role: str | None = "verifier"
    is_ordered_verification: bool


class VerifyActionResponse(BaseModel):
    message: str
    status: str
    signature_hash: str | None = None
