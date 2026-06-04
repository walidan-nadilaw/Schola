"""Use cases for the Submissions feature."""

from datetime import datetime
from typing import Any
from urllib.parse import quote
from uuid import UUID

from src.api.exceptions import BadRequestException, NotFoundException
from src.domain.entity.i_notification_repository import INotificationRepository
from src.domain.entity.i_submission_repository import ISubmissionRepository
from src.domain.entity.i_template_repository import IFormTemplateRepository
from src.domain.entity.i_user_repository import IUserRepository
from src.domain.entity.notification import Notification
from src.domain.entity.submission import Submission, SubmissionStatus, SubmissionVerifier, VerifierRole
from src.domain.entity.user import UserRole


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
    """Finalize a draft: validate fields, assign verifiers, submit."""

    def __init__(
        self,
        sub_repo: ISubmissionRepository,
        tpl_repo: IFormTemplateRepository,
        user_repo: IUserRepository,
        notif_repo: INotificationRepository,
    ) -> None:
        self._sub_repo = sub_repo
        self._tpl_repo = tpl_repo
        self._user_repo = user_repo
        self._notif_repo = notif_repo

    async def execute(
        self,
        submission_id: str,
        submitter_id: UUID,
        verifier_ids: list[UUID],
        *,
        is_ordered: bool = True,
    ) -> Submission:
        sub = await self._sub_repo.findById(submission_id)
        if sub is None:
            raise NotFoundException("Pengajuan tidak ditemukan")
        if sub.submitter_id != submitter_id:
            raise BadRequestException("Bukan pengajuan kamu")
        if sub.status != SubmissionStatus.DRAFT:
            raise BadRequestException("Pengajuan sudah disubmit")

        if not verifier_ids:
            raise BadRequestException("Minimal satu verifikator harus dipilih")

        # ── Validate template fields ──
        template = await self._tpl_repo.findById(sub.template_id)
        if template is None:
            raise NotFoundException("Template surat tidak ditemukan")
        self._validate_form_fields(template.fields, sub.form_data)

        # ── Validate verifiers exist ──
        users = await self._user_repo.findAllById(verifier_ids)
        found_ids = {u.id for u in users}
        for vid in verifier_ids:
            if vid not in found_ids:
                raise NotFoundException(f"Verifikator dengan ID {vid} tidak valid")

        # ── Assign verifiers ──
        total = len(verifier_ids)
        verifiers: list[SubmissionVerifier] = []
        for i, vid in enumerate(verifier_ids):
            role = VerifierRole.SIGNER if i == total - 1 else VerifierRole.VERIFIER
            verifiers.append(SubmissionVerifier.New(
                submission_id=sub.id,
                verifier_id=vid,
                verifier_order=i + 1,
                verifier_role=role,
            ))

        sub.verifiers = verifiers
        sub.is_ordered_verification = is_ordered
        sub.submit()
        saved = await self._sub_repo.update(sub)

        # ── Notify verifiers ──
        action_url = f"/submission/{quote(sub.id, safe='')}"
        notif_kwargs = dict(
            type="verification_required",
            title="Ada Pengajuan Baru untuk Diverifikasi",
            message=f"Pengajuan '{sub.letter_type}' menunggu verifikasi Anda.",
            submission_id=sub.id,
            action_url=action_url,
        )
        if is_ordered:
            first_sv = next((v for v in verifiers if v.verifier_order == 1), None)
            if first_sv:
                await self._notif_repo.save(Notification.New(user_id=first_sv.verifier_id, **notif_kwargs))
        else:
            for sv in verifiers:
                await self._notif_repo.save(Notification.New(user_id=sv.verifier_id, **notif_kwargs))

        return saved

    @staticmethod
    def _validate_form_fields(
        fields: list[dict[str, Any]] | list[Any],
        form_data: dict[str, Any] | list[Any],
    ) -> None:
        """Raise 400 if required fields are missing or empty."""
        if not isinstance(form_data, dict) or not isinstance(fields, list):
            return
        for field in fields:
            if not isinstance(field, dict):
                continue
            fid = field.get("id")
            label = field.get("label", fid or "Unknown")
            if field.get("required", True):
                if fid not in form_data:
                    raise BadRequestException(f"Field '{label}' wajib diisi")
                val = form_data.get(fid)
                if val is None or str(val).strip() == "":
                    raise BadRequestException(f"Field '{label}' tidak boleh kosong")


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
