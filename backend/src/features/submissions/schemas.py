"""Pydantic schemas for the Submissions feature."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel

# -- Requests --


class CreateSubmissionRequest(BaseModel):
    template_id: str
    form_data: dict[str, Any] | list[Any]


class UpdateSubmissionRequest(BaseModel):
    form_data: dict[str, Any] | list[Any] | None = None


# -- Responses --


class SubmissionResponse(BaseModel):
    id: str
    template_id: str
    submitter_id: str
    letter_type: str
    form_data: dict[str, Any] | list[Any]
    status: str
    is_ordered_verification: bool
    submitted_at: datetime | None = None
    verified_at: datetime | None = None
    rejection_reason: str | None = None
    rejected_by: str | None = None
    rejected_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
