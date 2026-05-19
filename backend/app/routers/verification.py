"""
routers/verification.py — Thin HTTP controller for verification pipeline.
Path prefix fixed to /verifications to match the API contract.
Allows any user to verify EXCEPT admin.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import PendingVerificationResponseSchema, VerifyActionSchema
from ..services.verification_service import VerificationService

router = APIRouter(prefix="/verifications", tags=["Verification Pipeline"])


def _svc(db: Session = Depends(get_db)) -> VerificationService:
    return VerificationService(db, settings.JWT_SECRET)


@router.get("/", response_model=List[PendingVerificationResponseSchema])
def get_pending_verifications(
    svc: VerificationService = Depends(_svc),
    current_user: User = Depends(get_current_user),
):
    """
    Get all letters pending verification for the current user.
    Respects sequential order constraints.
    Allows all users except admin.
    """
    if current_user.role.lower() == "admin":
        raise HTTPException(status_code=403, detail="Admin tidak diizinkan mengakses menu verifikasi")
    return svc.get_pending(current_user)


@router.post("/verify")
def verify_submission(
    payload: VerifyActionSchema,
    svc: VerificationService = Depends(_svc),
    current_user: User = Depends(get_current_user),
):
    """
    Approve or reject a submission. Generates HMAC e-signature on approval.
    Notifies submitter and next verifier automatically.
    Allows all users except admin.
    """
    if current_user.role.lower() == "admin":
        raise HTTPException(status_code=403, detail="Admin tidak diizinkan melakukan verifikasi pengajuan")
    return svc.verify(payload, current_user)
