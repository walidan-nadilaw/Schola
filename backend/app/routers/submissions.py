"""
routers/submissions.py — Thin HTTP controller for submission endpoints.
All business logic delegated to SubmissionService.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User
from ..schemas import (
    PaginatedSubmissionsResponse,
    SubmissionCreateSchema,
    SubmissionResponseSchema,
    SubmissionUpdateSchema,
)
from ..services.submission_service import SubmissionService

router = APIRouter(prefix="/submissions", tags=["Submissions"])


def _svc(db: Session = Depends(get_db)) -> SubmissionService:
    return SubmissionService(db)


@router.post("/", response_model=SubmissionResponseSchema, status_code=status.HTTP_201_CREATED)
def create_submission(
    payload: SubmissionCreateSchema,
    svc: SubmissionService = Depends(_svc),
    current_user: User = Depends(get_current_user),
):
    """Create a new letter request (draft or immediate pending)."""
    return svc.create(payload, current_user)


@router.get("/", response_model=PaginatedSubmissionsResponse)
def list_submissions(
    status_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    svc: SubmissionService = Depends(_svc),
    current_user: User = Depends(get_current_user),
):
    """
    List submissions with pagination.
    - Mahasiswa: own submissions only
    - Dosen/Staff: submissions where assigned as verifier
    - Admin: all submissions
    """
    return svc.list_paginated(current_user, status_filter, page, limit)


@router.get("/{id:path}", response_model=SubmissionResponseSchema)
def get_submission(
    id: str,
    svc: SubmissionService = Depends(_svc),
    current_user: User = Depends(get_current_user),
):
    """Get full detail of a single submission."""
    return svc.get_by_id(id, current_user)


@router.put("/{id:path}", response_model=SubmissionResponseSchema)
def update_submission(
    id: str,
    payload: SubmissionUpdateSchema,
    svc: SubmissionService = Depends(_svc),
    current_user: User = Depends(get_current_user),
):
    """Update a draft or previously rejected submission."""
    return svc.update(id, payload, current_user)


@router.delete("/{id:path}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(
    id: str,
    svc: SubmissionService = Depends(_svc),
    current_user: User = Depends(get_current_user),
):
    """Delete a draft submission."""
    svc.delete(id, current_user)


@router.post("/{id:path}/finalize", response_model=SubmissionResponseSchema)
def finalize_submission(
    id: str,
    verifiers: List[str],        # JSON array of verifier UUIDs in order
    svc: SubmissionService = Depends(_svc),
    current_user: User = Depends(get_current_user),
):
    """Finalize a draft and send it into the verifier pipeline."""
    return svc.finalize(id, verifiers, current_user)
