"""Use cases for the Verification feature."""

import hashlib
import hmac

from uuid import UUID

from src.api.exceptions import (
    AuthorizationException,
    BadRequestException,
    NotFoundException,
)
from src.core.config import settings
from src.core.time_now import now as _utcnow
from src.domain.entity.activity_log import ActivityLog
from src.domain.entity.i_activity_log_repository import IActivityLogRepository
from src.domain.entity.i_notification_repository import INotificationRepository
from src.domain.entity.i_submission_repository import ISubmissionRepository
from src.domain.entity.notification import Notification
from src.domain.entity.submission import (
    Submission,
    SubmissionVerifier,
    VerifierStatus,
)

from .schemas import PendingVerificationResponse


def _generate_signature(submission_id: str, verifier_id: str) -> str:
    """HMAC-SHA256 e-signature for IPB official approval."""
    ts = _utcnow().strftime("%Y-%m-%d %H:%M:%S")
    msg = f"{submission_id}|{verifier_id}|{ts}".encode()
    sig = hmac.new(settings.JWT_SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()
    return f"IPB-SIGN-{sig[:32].upper()}"


class GetPendingVerificationsUseCase:
    """List submissions pending verification for the current user."""

    def __init__(self, sub_repo: ISubmissionRepository) -> None:
        self._sub_repo = sub_repo

    async def execute(self, verifier_id: UUID) -> list[PendingVerificationResponse]:
        submissions = await self._sub_repo.find_pending_verifications(verifier_id)
        result: list[PendingVerificationResponse] = []

        for sub in submissions:
            # find this user's verifier entry
            my_sv = next(
                (v for v in sub.verifiers if v.verifier_id == verifier_id and v.status == VerifierStatus.PENDING),
                None,
            )
            if my_sv is None:
                continue

            # sequential order check: skip if previous verifiers not done
            if sub.is_ordered_verification and my_sv.verifier_order and my_sv.verifier_order > 1:
                prev_not_done = any(
                    v.status != VerifierStatus.APPROVED
                    for v in sub.verifiers
                    if v.verifier_order is not None and v.verifier_order < my_sv.verifier_order
                )
                if prev_not_done:
                    continue

            # extract keperluan from form_data
            form_data = sub.form_data if isinstance(sub.form_data, dict) else {}
            keperluan = (
                form_data.get("Keperluan")
                or form_data.get("Keperluan Surat")
                or form_data.get("Judul Penelitian")
                or form_data.get("Alasan Cuti")
                or "Keperluan Akademik"
            )

            result.append(PendingVerificationResponse(
                submission_id=sub.id,
                letter_type=sub.letter_type,
                keperluan=keperluan,
                submitter_id=str(sub.submitter_id),
                created_at=sub.created_at,
                verifier_order=my_sv.verifier_order,
                verifier_role=my_sv.verifier_role.value if my_sv.verifier_role else "verifier",
                is_ordered_verification=sub.is_ordered_verification,
                submitter_name=sub.submitter_name,
                submitter_nim=sub.submitter_nim,
            ))

        return result


class VerifySubmissionUseCase:
    """Approve or reject a submission as a verifier."""

    def __init__(
        self,
        sub_repo: ISubmissionRepository,
        notif_repo: INotificationRepository,
        log_repo: IActivityLogRepository,
    ) -> None:
        self._sub_repo = sub_repo
        self._notif_repo = notif_repo
        self._log_repo = log_repo

    async def execute(
        self,
        submission_id: str,
        verifier_id: UUID,
        action: str,
        *,
        comment: str | None = None,
        rejection_reason: str | None = None,
    ) -> dict:
        # load submission with verifiers
        sub = await self._sub_repo.findById(submission_id)
        if sub is None:
            raise NotFoundException("Surat pengajuan tidak ditemukan")

        if sub.status.value != "submitted":
            raise BadRequestException("Surat ini tidak sedang menunggu verifikasi")

        # find this verifier's assignment
        sv = next(
            (v for v in sub.verifiers if v.verifier_id == verifier_id),
            None,
        )
        if sv is None:
            raise AuthorizationException("Anda bukan verifikator yang ditunjuk untuk surat ini")
        if sv.status != VerifierStatus.PENDING:
            raise BadRequestException("Anda sudah memproses surat pengajuan ini sebelumnya")

        # sequential order check
        if sub.is_ordered_verification and sv.verifier_order and sv.verifier_order > 1:
            prev_not_done = any(
                v.status != VerifierStatus.APPROVED
                for v in sub.verifiers
                if v.verifier_order is not None and v.verifier_order < sv.verifier_order
            )
            if prev_not_done:
                raise BadRequestException("Pengajuan belum disetujui oleh verifikator tingkat sebelumnya")

        action_lower = action.lower()

        if action_lower == "rejected":
            return await self._reject(sub, sv, verifier_id, rejection_reason or comment)

        if action_lower == "approved":
            return await self._approve(sub, sv, verifier_id, comment)

        raise BadRequestException("Status aksi verifikasi tidak dikenal")

    async def _reject(
        self,
        sub: Submission,
        sv: SubmissionVerifier,
        verifier_id: UUID,
        reason: str | None,
    ) -> dict:
        if not reason:
            raise BadRequestException("Alasan penolakan wajib disertakan")

        sv.reject(comment=reason)
        await self._sub_repo.update_verifier(sv)

        # cancel downstream verifiers
        for v in sub.verifiers:
            if v.verifier_order is not None and sv.verifier_order is not None:
                if v.verifier_order > sv.verifier_order:
                    v.cancel()
                    await self._sub_repo.update_verifier(v)

        sub.reject(rejected_by=verifier_id, reason=reason)
        await self._sub_repo.update(sub)

        # activity log
        await self._log_repo.save(ActivityLog.New(
            action_type="VERIFICATION_REJECTED",
            user_id=verifier_id,
            submission_id=sub.id,
            description=f"{sub.id} rejected",
        ))

        # notify submitter
        await self._notif_repo.save(Notification.New(
            user_id=sub.submitter_id,
            type="submission_rejected",
            title="Pengajuan Surat Anda Ditolak",
            message=f"Pengajuan '{sub.letter_type}' Anda ditolak. Alasan: {reason}",
            submission_id=sub.id,
        ))

        return {"message": "Pengajuan surat berhasil ditolak.", "status": "rejected"}

    async def _approve(
        self,
        sub: Submission,
        sv: SubmissionVerifier,
        verifier_id: UUID,
        comment: str | None,
    ) -> dict:
        # sign and approve
        sig = _generate_signature(sub.id, str(verifier_id))
        sv.approve(comment=comment)
        sv.sign(sig)
        await self._sub_repo.update_verifier(sv)

        # activity log
        await self._log_repo.save(ActivityLog.New(
            action_type="VERIFICATION_APPROVED",
            user_id=verifier_id,
            submission_id=sub.id,
            description=f"{sub.id} approved",
        ))

        # check if this is the final verifier
        total_verifiers = len(sub.verifiers)
        is_final = (sv.verifier_order == total_verifiers) or (
            sv.verifier_role and sv.verifier_role.value == "signer"
        )

        if is_final:
            sub.approve()
            await self._sub_repo.update(sub)

            # notify submitter
            await self._notif_repo.save(Notification.New(
                user_id=sub.submitter_id,
                type="submission_approved",
                title="Pengajuan Surat Anda Disetujui",
                message=f"Pengajuan '{sub.letter_type}' Anda telah disetujui dan surat resmi diterbitkan.",
                submission_id=sub.id,
            ))

            return {
                "message": "Pengajuan disetujui sepenuhnya! Surat resmi diterbitkan.",
                "status": "approved",
                "signature_hash": sig,
            }

        # not final — notify next verifier
        if sub.is_ordered_verification and sv.verifier_order is not None:
            next_order = sv.verifier_order + 1
            next_sv = next(
                (v for v in sub.verifiers if v.verifier_order == next_order),
                None,
            )
            if next_sv:
                await self._notif_repo.save(Notification.New(
                    user_id=next_sv.verifier_id,
                    type="verification_required",
                    title="Giliran Anda untuk Memverifikasi Pengajuan",
                    message=f"Verifikator sebelumnya telah menyetujui '{sub.letter_type}'. Silakan tinjau.",
                    submission_id=sub.id,
                ))

        return {
            "message": "Pengajuan disetujui. Menunggu verifikator selanjutnya.",
            "status": "pending",
            "signature_hash": sig,
        }
