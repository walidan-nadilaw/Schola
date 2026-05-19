"""
schemas.py — Centralized Pydantic request/response models for the Schola API.
All routers import from here; no schema definitions live inside router files.
"""
import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr


# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None
    nim: Optional[str] = None
    fakultas: Optional[str] = None
    program: Optional[str] = None
    nip: Optional[str] = None
    position: Optional[str] = None


class LoginResponse(BaseModel):
    user: UserResponse
    token: str
    expiresIn: int


class MeResponse(BaseModel):
    user: UserResponse


# ──────────────────────────────────────────────
# Form Templates
# ──────────────────────────────────────────────

class FieldSchema(BaseModel):
    id: str
    label: str
    type: str
    required: bool = True
    placeholder: str = ""
    helpText: str = ""
    options: Optional[List[str]] = None


class FormTemplateCreateSchema(BaseModel):
    letter_type: str
    description: str = ""
    fields: List[FieldSchema]
    is_active: bool = True


class FormTemplateResponseSchema(BaseModel):
    id: Any
    letter_type: str
    description: Optional[str] = None
    fields: List[dict]
    is_active: bool

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# Submissions
# ──────────────────────────────────────────────

class SubmissionCreateSchema(BaseModel):
    template_id: str
    form_data: Dict[str, Any]
    is_ordered_verification: bool = False
    status: str = "draft"          # "draft" | "pending"
    verifiers: List[str] = []      # ordered list of User UUID strings


class SubmissionUpdateSchema(BaseModel):
    form_data: Dict[str, Any]
    verifiers: List[str] = []
    is_ordered_verification: bool = False


class SubmitterInfoSchema(BaseModel):
    id: Any
    name: str
    email: str
    nim: Optional[str] = None
    fakultas: Optional[str] = None
    program: Optional[str] = None
    semester: Optional[int] = None


class VerifierTimelineSchema(BaseModel):
    verifier_id: Any
    verifier_name: str
    verifier_role: Optional[str] = "verifier"
    verifier_order: int
    status: str
    comment: Optional[str] = None
    verified_at: Optional[datetime.datetime] = None
    signature_hash: Optional[str] = None


class AttachmentResponseSchema(BaseModel):
    id: Any
    file_name: str
    file_size: int
    file_type: str
    file_path: str
    uploaded_at: datetime.datetime


class PaginationSchema(BaseModel):
    currentPage: int
    totalPages: int
    totalItems: int
    itemsPerPage: int


class SubmissionResponseSchema(BaseModel):
    id: str
    template_id: Any
    letter_type: str
    form_data: Dict[str, Any]
    status: str
    is_ordered_verification: bool
    submitted_at: Optional[datetime.datetime] = None
    verified_at: Optional[datetime.datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    submitter: SubmitterInfoSchema
    verifiers: List[VerifierTimelineSchema]
    attachments: List[AttachmentResponseSchema] = []

    class Config:
        from_attributes = True


class PaginatedSubmissionsResponse(BaseModel):
    data: List[SubmissionResponseSchema]
    pagination: PaginationSchema


# ──────────────────────────────────────────────
# Verification
# ──────────────────────────────────────────────

class VerifyActionSchema(BaseModel):
    submission_id: str
    status: str                          # "approved" | "rejected"
    comment: Optional[str] = ""
    rejection_reason: Optional[str] = ""


class PendingVerificationResponseSchema(BaseModel):
    submission_id: str
    letter_type: str
    keperluan: Optional[str] = "Keperluan Akademik"
    submitter_name: str
    submitter_nim: Optional[str] = None
    submitter_program: Optional[str] = None
    created_at: datetime.datetime
    verifier_order: int
    verifier_role: str
    is_ordered_verification: bool


# ──────────────────────────────────────────────
# Dashboard
# ──────────────────────────────────────────────

class RecentActivitySchema(BaseModel):
    id: str
    type: str
    description: str
    timestamp: datetime.datetime


class DashboardStatsSchema(BaseModel):
    pendingVerifications: int
    totalSubmissions: int
    approvedSubmissions: int
    rejectedSubmissions: int
    draftSubmissions: int
    recentActivity: List[RecentActivitySchema]


# ──────────────────────────────────────────────
# Users (management)
# ──────────────────────────────────────────────

class UserListResponse(BaseModel):
    data: List[UserResponse]
    pagination: PaginationSchema


class UserCreateSchema(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    department: Optional[str] = None
    nim: Optional[str] = None
    fakultas: Optional[str] = None
    program: Optional[str] = None
    nip: Optional[str] = None
    position: Optional[str] = None
    semester: Optional[int] = None
    is_active: Optional[bool] = True


class UserUpdateSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    department: Optional[str] = None
    nim: Optional[str] = None
    fakultas: Optional[str] = None
    program: Optional[str] = None
    nip: Optional[str] = None
    position: Optional[str] = None
    semester: Optional[int] = None
    is_active: Optional[bool] = None


# ──────────────────────────────────────────────
# Notifications
# ──────────────────────────────────────────────

class NotificationResponseSchema(BaseModel):
    id: str
    type: str
    title: str
    message: str
    is_read: bool
    read_at: Optional[datetime.datetime] = None
    action_url: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# FAQs
# ──────────────────────────────────────────────

class FAQCreateSchema(BaseModel):
    question: str
    answer: str


class FAQResponseSchema(BaseModel):
    id: Any
    question: str
    answer: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True
