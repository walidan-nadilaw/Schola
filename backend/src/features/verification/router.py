"""FastAPI router for the Verification feature."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user
from src.api.http import HTTPDataResponse, HTTPErrorResponse
from src.domain.entity.user import User, UserRole
from src.api.exceptions import AuthorizationException
from src.infrastructure.db import get_async_db_session
from src.infrastructure.repositories.submission_repository import SubmissionRepository
from src.infrastructure.repositories.notification_repository import NotificationRepository
from src.infrastructure.repositories.activity_log_repository import ActivityLogRepository

from .schemas import (
    PendingVerificationResponse,
    VerifyActionRequest,
    VerifyActionResponse,
)
from .use_case import GetPendingVerificationsUseCase, VerifySubmissionUseCase

router = APIRouter(prefix="/verifications", tags=["Verification Pipeline"])


def _block_operator(user: User) -> None:
    """Operators manage templates/users, not verify submissions."""
    if user.role == UserRole.OPERATOR_LEMBAGA:
        raise AuthorizationException("Operator tidak diizinkan mengakses menu verifikasi")


@router.get(
    "/",
    response_model=HTTPDataResponse[list[PendingVerificationResponse]],
    responses={401: {"model": HTTPErrorResponse}, 403: {"model": HTTPErrorResponse}},
)
async def get_pending_verifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """List all submissions pending verification for the current user."""
    _block_operator(current_user)

    uc = GetPendingVerificationsUseCase(SubmissionRepository(db))
    items = await uc.execute(current_user.id)
    return HTTPDataResponse(
        status="success",
        data=items,
        message="Daftar verifikasi berhasil diambil",
    )


@router.post(
    "/verify",
    response_model=HTTPDataResponse[VerifyActionResponse],
    responses={
        400: {"model": HTTPErrorResponse},
        403: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def verify_submission(
    body: VerifyActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Approve or reject a submission. Generates HMAC e-signature on approval."""
    _block_operator(current_user)

    uc = VerifySubmissionUseCase(
        SubmissionRepository(db),
        NotificationRepository(db),
        ActivityLogRepository(db),
    )
    result = await uc.execute(
        submission_id=body.submission_id,
        verifier_id=current_user.id,
        action=body.action,
        comment=body.comment,
        rejection_reason=body.rejection_reason,
    )
    return HTTPDataResponse(
        status="success",
        data=VerifyActionResponse(**result),
        message=result["message"],
    )
