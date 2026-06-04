"""FastAPI router for the Files feature."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user
from src.api.deps.storage import get_storage_service
from src.api.http import HTTPDataResponse, HTTPErrorResponse, HTTPMessageResponse
from src.application.i_storage_service import IStorageService
from src.domain.entity.user import User
from src.infrastructure.db import get_async_db_session
from src.infrastructure.repositories.attachment_repository import AttachmentRepository
from src.infrastructure.repositories.submission_repository import SubmissionRepository

from .schemas import UploadFileResponse
from .use_case import DeleteFileUseCase, DownloadFileUseCase, UploadFileUseCase

router = APIRouter(prefix="/files", tags=["File Attachments"])


@router.post(
    "/upload",
    response_model=HTTPDataResponse[UploadFileResponse],
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": HTTPErrorResponse},
        401: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def upload_file(
    file: UploadFile = File(...),
    submission_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
    storage: IStorageService = Depends(get_storage_service),
):
    """Upload a supporting document (PDF, image, ZIP), optionally linked to a submission."""
    file_data = await file.read()

    uc = UploadFileUseCase(
        storage=storage,
        attachment_repo=AttachmentRepository(db),
        submission_repo=SubmissionRepository(db),
    )
    result = await uc.execute(
        file_data=file_data,
        file_name=file.filename or "unnamed",
        content_type=file.content_type or "application/octet-stream",
        uploaded_by=current_user.id,
        submission_id=submission_id,
    )
    return HTTPDataResponse(
        status="success",
        data=result,
        message="Berkas berhasil diunggah",
    )


@router.get(
    "/download/{filename:path}",
    responses={
        401: {"model": HTTPErrorResponse},
        403: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def download_file(
    filename: str,
    db: AsyncSession = Depends(get_async_db_session),
    storage: IStorageService = Depends(get_storage_service),
):
    """Stream a stored file's bytes. Auth is intentionally open for the demo build."""
    uc = DownloadFileUseCase(
        attachment_repo=AttachmentRepository(db),
        submission_repo=SubmissionRepository(db),
        storage=storage,
    )
    file_info = await uc.execute(filename)

    data = await storage.download(file_info.file_path)
    return Response(
        content=data,
        media_type=file_info.file_type,
        headers={"Content-Disposition": f'inline; filename="{file_info.file_name}"'},
    )


@router.delete(
    "/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"model": HTTPErrorResponse},
        403: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def delete_file(
    attachment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
    storage: IStorageService = Depends(get_storage_service),
):
    """Delete a file attachment. Only the uploader or operator may delete."""
    uc = DeleteFileUseCase(
        storage=storage,
        attachment_repo=AttachmentRepository(db),
    )
    await uc.execute(attachment_id, current_user)
