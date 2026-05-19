"""
services/notification_service.py — Writes notification records to the DB.
Called by verification and submission routers after state transitions.
"""
import datetime
from sqlalchemy.orm import Session
from ..models import Notification, Submission, User


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def _create(
        self,
        user_id,
        title: str,
        message: str,
        notification_type: str,
        submission_id: str = None,
        action_url: str = None,
    ) -> None:
        notif = Notification(
            user_id=user_id,
            submission_id=submission_id,
            type=notification_type,
            title=title,
            message=message,
            action_url=action_url,
            created_at=datetime.datetime.now(datetime.timezone.utc),
        )
        self.db.add(notif)
        # Flushed by the caller's commit

    def notify_verifiers_assigned(self, submission: Submission) -> None:
        """Notify each assigned verifier that a new letter requires their action."""
        for sv in submission.verifiers:
            # For ordered verification, only notify the first verifier initially
            if submission.is_ordered_verification and sv.verifier_order > 1:
                continue
            self._create(
                user_id=sv.verifier_id,
                submission_id=submission.id,
                notification_type="verification_required",
                title="Pengajuan Surat Baru Memerlukan Verifikasi Anda",
                message=(
                    f"{submission.submitter.name} mengajukan '{submission.letter_type}' "
                    f"dan memerlukan verifikasi Anda."
                ),
                action_url=f"/verifikasi/{submission.id}",
            )

    def notify_next_verifier(self, submission: Submission, next_order: int) -> None:
        """In ordered flow, notify the next verifier after the previous one approves."""
        from ..models import SubmissionVerifier
        next_sv = (
            self.db.query(SubmissionVerifier)
            .filter(
                SubmissionVerifier.submission_id == submission.id,
                SubmissionVerifier.verifier_order == next_order,
            )
            .first()
        )
        if next_sv:
            self._create(
                user_id=next_sv.verifier_id,
                submission_id=submission.id,
                notification_type="verification_required",
                title="Giliran Anda untuk Memverifikasi Pengajuan",
                message=(
                    f"Verifikator sebelumnya telah menyetujui '{submission.letter_type}' "
                    f"dari {submission.submitter.name}. Silakan tinjau pengajuan tersebut."
                ),
                action_url=f"/verifikasi/{submission.id}",
            )

    def notify_submission_approved(self, submission: Submission) -> None:
        """Notify the submitter that their letter was fully approved."""
        self._create(
            user_id=submission.submitter_id,
            submission_id=submission.id,
            notification_type="submission_approved",
            title="Pengajuan Surat Anda Disetujui",
            message=(
                f"Selamat! Pengajuan '{submission.letter_type}' Anda telah disetujui "
                f"oleh semua verifikator dan surat resmi telah diterbitkan."
            ),
            action_url=f"/diajukan/{submission.id}",
        )

    def notify_submission_rejected(
        self, submission: Submission, rejector: User, reason: str
    ) -> None:
        """Notify the submitter that their letter was rejected."""
        self._create(
            user_id=submission.submitter_id,
            submission_id=submission.id,
            notification_type="submission_rejected",
            title="Pengajuan Surat Anda Ditolak",
            message=(
                f"Pengajuan '{submission.letter_type}' Anda ditolak oleh {rejector.name}. "
                f"Alasan: {reason}"
            ),
            action_url=f"/diajukan/{submission.id}",
        )
