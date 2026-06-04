"""Use cases for the Files feature."""

import hashlib
import os
import uuid
from uuid import UUID

from src.api.exceptions import (
    AuthorizationException,
    BadRequestException,
    NotFoundException,
)
from src.application.i_storage_service import IStorageService
from src.core.config import settings
from src.domain.entity.i_attachment_repository import IAttachmentRepository
from src.domain.entity.i_submission_repository import ISubmissionRepository
from src.domain.entity.submission import Attachment
from src.domain.entity.user import User, UserRole

from .schemas import FileInfoResponse, UploadFileResponse


class UploadFileUseCase:
    """Upload a supporting document, optionally linked to a submission."""

    def __init__(
        self,
        storage: IStorageService,
        attachment_repo: IAttachmentRepository,
        submission_repo: ISubmissionRepository,
    ) -> None:
        self._storage = storage
        self._attachment_repo = attachment_repo
        self._submission_repo = submission_repo

    async def execute(
        self,
        file_data: bytes,
        file_name: str,
        content_type: str,
        uploaded_by: UUID,
        *,
        submission_id: str | None = None,
    ) -> UploadFileResponse:
        # ── Validate file type ──
        if content_type not in settings.ALLOWED_MIME_TYPES:
            raise BadRequestException(
                "Tipe berkas tidak didukung. Hanya menerima PDF, JPG, PNG, atau ZIP."
            )

        # ── Validate file size ──
        if len(file_data) > settings.MAX_FILE_SIZE_BYTES:
            max_mb = settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)
            raise BadRequestException(
                f"Ukuran berkas melebihi batas {max_mb} MB."
            )

        # ── Validate submission exists if linked ──
        if submission_id:
            sub = await self._submission_repo.findById(submission_id)
            if sub is None:
                raise NotFoundException("Surat pengajuan tujuan tidak ditemukan")

        # ── Generate secure filename ──
        ext = os.path.splitext(file_name)[1]
        secure_name = f"{uuid.uuid4()}{ext}"

        # ── Upload to storage ──
        stored = await self._storage.upload(
            file_data=file_data,
            file_name=secure_name,
            content_type=content_type,
            folder="submissions",
        )

        # ── Compute file hash ──
        file_hash = hashlib.sha256(file_data).hexdigest()

        # ── Save attachment metadata ──
        attachment = Attachment.New(
            file_name=file_name,
            file_size=len(file_data),
            file_type=content_type,
            file_path=stored.file_path,
            submission_id=submission_id,
            file_hash=file_hash,
            uploaded_by=uploaded_by,
        )
        saved = await self._attachment_repo.save(attachment)

        return UploadFileResponse(
            id=str(saved.id),
            file_name=saved.file_name,
            file_size=saved.file_size,
            file_type=saved.file_type,
            file_path=saved.file_path,
            file_url=stored.file_url,
        )


class DownloadFileUseCase:
    """Authorize and retrieve a file for download."""

    def __init__(
        self,
        attachment_repo: IAttachmentRepository,
        submission_repo: ISubmissionRepository,
        storage: IStorageService,
    ) -> None:
        self._attachment_repo = attachment_repo
        self._submission_repo = submission_repo
        self._storage = storage

    async def execute(
        self, file_path: str, current_user: User | None = None
    ) -> FileInfoResponse:
        att = await self._attachment_repo.find_by_file_path(file_path)
        if att is None:
            raise NotFoundException("Berkas tidak ditemukan")

        # ── Authorization ──
        # Skipped when no user is supplied (open download for the demo build).
        if current_user is not None and not await self._is_authorized(att, current_user):
            raise AuthorizationException(
                "Anda tidak memiliki hak akses untuk berkas ini"
            )

        return FileInfoResponse(
            id=str(att.id),
            file_name=att.file_name,
            file_size=att.file_size,
            file_type=att.file_type,
            file_path=att.file_path,
            submission_id=att.submission_id,
            uploaded_by=str(att.uploaded_by) if att.uploaded_by else None,
            uploaded_at=att.uploaded_at,
        )

    async def _is_authorized(self, att: Attachment, user: User) -> bool:
        """Check if the user is allowed to access this file."""
        # Admin has full access
        if user.role == UserRole.OPERATOR_LEMBAGA:
            return True

        # Uploader always has access
        if att.uploaded_by == user.id:
            return True

        # If linked to a submission: submitter and assigned verifiers can access
        if att.submission_id:
            sub = await self._submission_repo.findById(att.submission_id)
            if sub is None:
                return False

            # Submitter
            if sub.submitter_id == user.id:
                return True

            # Assigned verifier
            for v in sub.verifiers:
                if v.verifier_id == user.id:
                    return True

        return False


class DeleteFileUseCase:
    """Delete a file attachment (uploader or operator only)."""

    def __init__(
        self,
        storage: IStorageService,
        attachment_repo: IAttachmentRepository,
    ) -> None:
        self._storage = storage
        self._attachment_repo = attachment_repo

    async def execute(self, attachment_id: UUID, current_user: User) -> None:
        att = await self._attachment_repo.findById(attachment_id)
        if att is None:
            raise NotFoundException("Berkas tidak ditemukan")

        # Only uploader or operator can delete
        if (
            current_user.role != UserRole.OPERATOR_LEMBAGA
            and att.uploaded_by != current_user.id
        ):
            raise AuthorizationException(
                "Anda tidak diizinkan menghapus berkas ini"
            )

        # Delete from storage
        await self._storage.delete(att.file_path)

        # Delete metadata
        await self._attachment_repo.deleteById(att.id)
