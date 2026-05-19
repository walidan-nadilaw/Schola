"""
services/verification_service.py — Business logic for the verification pipeline.
"""
import datetime
import hashlib
import hmac
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import ActivityLog, Submission, SubmissionVerifier, User
from ..schemas import PendingVerificationResponseSchema, VerifyActionSchema
from .notification_service import NotificationService


class VerificationService:
    def __init__(self, db: Session, jwt_secret: str):
        self.db = db
        self.jwt_secret = jwt_secret
        self.notif = NotificationService(db)

    @staticmethod
    def _generate_signature(submission_id: str, verifier_id: str, salt: str) -> str:
        """HMAC-SHA256 e-signature for IPB official approval."""
        ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        msg = f"{submission_id}|{verifier_id}|{ts}".encode()
        sig = hmac.new(salt.encode(), msg, hashlib.sha256).hexdigest()
        return f"IPB-SIGN-{sig[:32].upper()}"

    def _log(self, user: User, submission_id: str, action: str, desc: str) -> None:
        self.db.add(ActivityLog(
            user_id=user.id,
            submission_id=submission_id,
            action_type=action,
            description=desc,
        ))

    def get_pending(self, current_user: User) -> List[PendingVerificationResponseSchema]:
        records = (
            self.db.query(SubmissionVerifier)
            .join(Submission)
            .filter(
                SubmissionVerifier.verifier_id == current_user.id,
                SubmissionVerifier.status == "pending",
                Submission.status == "pending",
            )
            .all()
        )
        result = []
        for rec in records:
            sub = rec.submission
            if sub.is_ordered_verification and rec.verifier_order > 1:
                prev = self.db.query(SubmissionVerifier).filter(
                    SubmissionVerifier.submission_id == sub.id,
                    SubmissionVerifier.verifier_order < rec.verifier_order,
                ).all()
                if not all(p.status == "approved" for p in prev):
                    continue
            form_data = sub.form_data or {}
            keperluan = (
                form_data.get("Keperluan") or
                form_data.get("Keperluan Surat") or
                form_data.get("Judul Penelitian") or
                form_data.get("Alasan Cuti") or
                "Keperluan Akademik"
            )
            result.append(PendingVerificationResponseSchema(
                submission_id=sub.id,
                letter_type=sub.letter_type,
                keperluan=keperluan,
                submitter_name=sub.submitter.name,
                submitter_nim=sub.submitter.nim,
                submitter_program=sub.submitter.program,
                created_at=sub.created_at,
                verifier_order=rec.verifier_order,
                verifier_role=rec.verifier_role or "verifier",
                is_ordered_verification=sub.is_ordered_verification,
            ))
        return result

    def verify(self, payload: VerifyActionSchema, current_user: User) -> dict:
        submission = self.db.query(Submission).filter(
            Submission.id == payload.submission_id
        ).first()
        if not submission:
            raise HTTPException(404, "Surat pengajuan tidak ditemukan")
        if submission.status != "pending":
            raise HTTPException(400, "Surat ini tidak sedang menunggu verifikasi")

        sv = self.db.query(SubmissionVerifier).filter(
            SubmissionVerifier.submission_id == submission.id,
            SubmissionVerifier.verifier_id == current_user.id,
        ).first()
        if not sv:
            raise HTTPException(403, "Anda bukan verifikator yang ditunjuk untuk surat ini")
        if sv.status != "pending":
            raise HTTPException(400, "Anda sudah memproses surat pengajuan ini sebelumnya")

        # Sequential order check
        if submission.is_ordered_verification and sv.verifier_order > 1:
            prev = self.db.query(SubmissionVerifier).filter(
                SubmissionVerifier.submission_id == submission.id,
                SubmissionVerifier.verifier_order < sv.verifier_order,
            ).all()
            if not all(p.status == "approved" for p in prev):
                raise HTTPException(400, "Pengajuan belum disetujui oleh verifikator tingkat sebelumnya")

        action = payload.status.lower()
        now = datetime.datetime.now(datetime.timezone.utc)

        if action == "rejected":
            if not payload.rejection_reason:
                raise HTTPException(400, "Alasan penolakan wajib disertakan")

            sv.status = "rejected"
            sv.comment = payload.rejection_reason
            sv.verified_at = now

            # Cancel downstream verifiers
            self.db.query(SubmissionVerifier).filter(
                SubmissionVerifier.submission_id == submission.id,
                SubmissionVerifier.verifier_order > sv.verifier_order,
            ).update({"status": "cancelled"}, synchronize_session=False)

            submission.status = "rejected"
            submission.rejection_reason = payload.rejection_reason
            submission.rejected_by = current_user.id
            submission.rejected_at = now

            self._log(current_user, submission.id, "VERIFICATION_REJECTED",
                      f"{submission.id} rejected by {current_user.name}")
            self.notif.notify_submission_rejected(submission, current_user, payload.rejection_reason)
            self.db.commit()
            return {"message": "Pengajuan surat berhasil ditolak.", "status": "rejected"}

        elif action == "approved":
            sig = self._generate_signature(submission.id, str(current_user.id), self.jwt_secret)
            sv.status = "approved"
            sv.comment = payload.comment
            sv.verified_at = now
            sv.signature_hash = sig

            self._log(current_user, submission.id, "VERIFICATION_APPROVED",
                      f"{submission.id} approved by {current_user.name}")

            total = self.db.query(SubmissionVerifier).filter(
                SubmissionVerifier.submission_id == submission.id
            ).count()

            is_final = (sv.verifier_order == total) or (sv.verifier_role == "signer")
            if is_final:
                submission.status = "approved"
                submission.verified_at = now
                self.notif.notify_submission_approved(submission)
                self.db.commit()
                return {
                    "message": "Pengajuan disetujui sepenuhnya! Surat resmi diterbitkan.",
                    "status": "approved",
                    "signature_hash": sig,
                }
            else:
                # Notify next verifier in chain
                self.notif.notify_next_verifier(submission, sv.verifier_order + 1)
                self.db.commit()
                return {
                    "message": "Pengajuan disetujui. Menunggu verifikator selanjutnya.",
                    "status": "pending",
                    "signature_hash": sig,
                }
        else:
            raise HTTPException(400, "Status aksi verifikasi tidak dikenal")
