"""Use cases for the Submissions feature."""

from datetime import datetime
from typing import Any
from uuid import UUID

from src.api.exceptions import BadRequestException, NotFoundException
from src.domain.entity.i_submission_repository import ISubmissionRepository
from src.domain.entity.i_template_repository import IFormTemplateRepository
from src.domain.entity.submission import Submission, SubmissionStatus


def _generate_submission_id(letter_type: str) -> str:
    """Generate a human-readable submission ID like SKA/2026/0001."""
    prefix = "".join(w[0] for w in letter_type.split()[:3]).upper()
    year = datetime.now().year
    import random

    seq = random.randint(1, 9999)
    return f"{prefix}/{year}/{seq:04d}"


class ListSubmissionsUseCase:
    """List submissions – my own (mahasiswa) or all (operator)."""

    def __init__(self, repo: ISubmissionRepository) -> None:
        self._repo = repo

    async def execute(
        self, *, submitter_id: UUID | None = None, status: str | None = None
    ) -> list[Submission]:
        if submitter_id:
            return list(await self._repo.find_by_submitter_id(submitter_id))
        if status:
            return list(await self._repo.find_by_status(SubmissionStatus(status)))
        return list(await self._repo.findAll())


class GetSubmissionUseCase:
    def __init__(self, repo: ISubmissionRepository) -> None:
        self._repo = repo

    async def execute(self, submission_id: str) -> Submission:
        sub = await self._repo.findById(submission_id)
        if sub is None:
            raise NotFoundException("Pengajuan tidak ditemukan")
        return sub


class CreateSubmissionUseCase:
    """Create a new draft submission."""

    def __init__(
        self,
        sub_repo: ISubmissionRepository,
        tpl_repo: IFormTemplateRepository,
    ) -> None:
        self._sub_repo = sub_repo
        self._tpl_repo = tpl_repo

    async def execute(
        self,
        template_id: UUID,
        submitter_id: UUID,
        form_data: dict[str, Any] | list[Any],
    ) -> Submission:
        # validate template exists and is active
        template = await self._tpl_repo.findById(template_id)
        if template is None:
            raise NotFoundException("Template tidak ditemukan")
        if not template.is_active:
            raise BadRequestException("Template sudah tidak aktif")

        sid = _generate_submission_id(template.letter_type)
        sub = Submission.New(
            submission_id=sid,
            template_id=template.id,
            submitter_id=submitter_id,
            letter_type=template.letter_type,
            form_data=form_data,
        )
        return await self._sub_repo.save(sub)


class SubmitSubmissionUseCase:
    """Move a draft submission to 'submitted'."""

    def __init__(self, repo: ISubmissionRepository) -> None:
        self._repo = repo

    async def execute(self, submission_id: str, submitter_id: UUID) -> Submission:
        sub = await self._repo.findById(submission_id)
        if sub is None:
            raise NotFoundException("Pengajuan tidak ditemukan")
        if sub.submitter_id != submitter_id:
            raise BadRequestException("Bukan pengajuan kamu")
        if not sub.is_draft:
            raise BadRequestException("Pengajuan sudah disubmit")

        sub.submit()
        return await self._repo.update(sub)


class UpdateSubmissionUseCase:
    """Update form data on a draft submission."""

    def __init__(self, repo: ISubmissionRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        submission_id: str,
        submitter_id: UUID,
        form_data: dict[str, Any] | list[Any] | None = None,
    ) -> Submission:
        sub = await self._repo.findById(submission_id)
        if sub is None:
            raise NotFoundException("Pengajuan tidak ditemukan")
        if sub.submitter_id != submitter_id:
            raise BadRequestException("Bukan pengajuan kamu")
        if not sub.is_draft:
            raise BadRequestException("Hanya pengajuan draft yang bisa diedit")

        if form_data is not None:
            sub.form_data = form_data

        return await self._repo.update(sub)


class DeleteSubmissionUseCase:
    """Delete a draft submission."""

    def __init__(self, repo: ISubmissionRepository) -> None:
        self._repo = repo

    async def execute(self, submission_id: str, submitter_id: UUID) -> None:
        sub = await self._repo.findById(submission_id)
        if sub is None:
            raise NotFoundException("Pengajuan tidak ditemukan")
        if sub.submitter_id != submitter_id:
            raise BadRequestException("Bukan pengajuan kamu")
        if not sub.is_draft:
            raise BadRequestException("Hanya pengajuan draft yang bisa dihapus")

        await self._repo.deleteById(submission_id)
