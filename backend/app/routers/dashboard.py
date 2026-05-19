"""
routers/dashboard.py — GET /api/dashboard/stats
Returns role-aware statistics for the dashboard home page.
"""
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import ActivityLog, Submission, SubmissionVerifier, User
from ..schemas import DashboardStatsSchema, RecentActivitySchema

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsSchema)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns submission counts and recent activity feed tailored to the
    current user's role:
    - Mahasiswa  → their own submissions
    - Dosen/Staff → submissions they are assigned to verify
    - Admin      → all submissions
    """
    role = current_user.role.lower()

    base_q = db.query(Submission)
    if role == "admin":
        # Admin sees everything
        pass
    else:
        # Non-admin sees what they submitted OR what they are assigned to verify
        from sqlalchemy import or_
        base_q = base_q.filter(
            or_(
                Submission.submitter_id == current_user.id,
                Submission.id.in_(
                    db.query(SubmissionVerifier.submission_id)
                    .filter(SubmissionVerifier.verifier_id == current_user.id)
                )
            )
        )

    def count_status(s: str) -> int:
        return base_q.filter(Submission.status == s).count()

    pending_verifications = 0
    if role != "admin":
        pending_verifications = (
            db.query(SubmissionVerifier)
            .filter(
                SubmissionVerifier.verifier_id == current_user.id,
                SubmissionVerifier.status == "pending",
            )
            .count()
        )

    # Recent activity from audit log (last 10 entries relevant to this user)
    log_q = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
        .all()
    )
    recent = [
        RecentActivitySchema(
            id=str(log.id),
            type=log.action_type.lower(),
            description=log.description or log.action_type,
            timestamp=log.created_at,
        )
        for log in log_q
    ]

    return DashboardStatsSchema(
        pendingVerifications=pending_verifications,
        totalSubmissions=base_q.count(),
        approvedSubmissions=count_status("approved"),
        rejectedSubmissions=count_status("rejected"),
        draftSubmissions=count_status("draft"),
        recentActivity=recent,
    )
