"""FastAPI router for the Submissions feature."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, require_role
from src.api.http import HTTPDataResponse, HTTPErrorResponse
from src.domain.entity.user import User, UserRole
from src.infrastructure.db import get_async_db_session
from src.infrastructure.repositories.submission_repository import SubmissionRepository
from src.infrastructure.repositories.template_repository import FormTemplateRepository
from src.infrastructure.repositories.user_repository import UserRepository

from .schemas import (
    CreateSubmissionRequest,
    SubmissionResponse,
    SubmitRequest,
    UpdateSubmissionRequest,
)
from .use_case import (
    CreateSubmissionUseCase,
    DeleteSubmissionUseCase,
    GetSubmissionUseCase,
    ListSubmissionsUseCase,
    SubmitSubmissionUseCase,
    UpdateSubmissionUseCase,
)

router = APIRouter(prefix="/submissions", tags=["Submissions"])


def _to_response(s) -> SubmissionResponse:
    return SubmissionResponse(
        id=s.id,
        template_id=str(s.template_id),
        submitter_id=str(s.submitter_id),
        letter_type=s.letter_type,
        form_data=s.form_data,
        status=s.status.value if hasattr(s.status, "value") else s.status,
        is_ordered_verification=s.is_ordered_verification,
        submitted_at=s.submitted_at,
        verified_at=s.verified_at,
        rejection_reason=s.rejection_reason,
        rejected_by=str(s.rejected_by) if s.rejected_by else None,
        rejected_at=s.rejected_at,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.get(
    "/",
    response_model=HTTPDataResponse[list[SubmissionResponse]],
    responses={401: {"model": HTTPErrorResponse}},
)
async def list_submissions(
    mine: bool = Query(True, description="Only show my submissions"),
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """List submissions. Mahasiswa sees own, operator can see all."""
    uc = ListSubmissionsUseCase(SubmissionRepository(db))
    if mine or current_user.role == UserRole.MAHASISWA:
        subs = await uc.execute(submitter_id=current_user.id)
    else:
        subs = await uc.execute(status=status_filter)
    return HTTPDataResponse(
        status="success",
        data=[_to_response(s) for s in subs],
        message="Data pengajuan berhasil diambil",
    )


@router.get(
    "/{submission_id:path}",
    response_model=HTTPDataResponse[SubmissionResponse],
    responses={
        401: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def get_submission(
    submission_id: str,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Get a single submission."""
    s = await GetSubmissionUseCase(SubmissionRepository(db)).execute(submission_id)
    return HTTPDataResponse(
        status="success",
        data=_to_response(s),
        message="Data pengajuan berhasil diambil",
    )


@router.post(
    "/",
    response_model=HTTPDataResponse[SubmissionResponse],
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def create_submission(
    body: CreateSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Create a new draft submission."""
    uc = CreateSubmissionUseCase(SubmissionRepository(db), FormTemplateRepository(db))
    s = await uc.execute(
        template_id=UUID(body.template_id),
        submitter_id=current_user.id,
        form_data=body.form_data,
    )
    return HTTPDataResponse(
        status="success",
        data=_to_response(s),
        message="Pengajuan berhasil dibuat",
    )


@router.post(
    "/{submission_id}/submit",
    response_model=HTTPDataResponse[SubmissionResponse],
    responses={
        400: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def submit_submission(
    submission_id: str,
    body: SubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Finalize a draft: validate fields, assign verifiers, change status to submitted."""
    uc = SubmitSubmissionUseCase(
        SubmissionRepository(db),
        FormTemplateRepository(db),
        UserRepository(db),
    )
    s = await uc.execute(
        submission_id,
        current_user.id,
        [UUID(v) for v in body.verifiers],
        is_ordered=body.is_ordered_verification,
    )
    return HTTPDataResponse(
        status="success",
        data=_to_response(s),
        message="Pengajuan berhasil disubmit ke verifikator",
    )


@router.put(
    "/{submission_id:path}",
    response_model=HTTPDataResponse[SubmissionResponse],
    responses={
        400: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def update_submission(
    submission_id: str,
    body: UpdateSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Update form data on a draft submission."""
    s = await UpdateSubmissionUseCase(SubmissionRepository(db)).execute(
        submission_id=submission_id,
        submitter_id=current_user.id,
        form_data=body.form_data,
    )
    return HTTPDataResponse(
        status="success",
        data=_to_response(s),
        message="Pengajuan berhasil diupdate",
    )


@router.delete(
    "/{submission_id:path}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        400: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def delete_submission(
    submission_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Delete a draft submission (only the owner can delete)."""
    await DeleteSubmissionUseCase(SubmissionRepository(db)).execute(
        submission_id, current_user.id
    )
