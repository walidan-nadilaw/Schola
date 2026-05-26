"""Use cases for the Dashboard feature."""

from uuid import UUID

from src.domain.entity.i_activity_log_repository import IActivityLogRepository
from src.domain.entity.i_submission_repository import ISubmissionRepository
from src.domain.entity.submission import SubmissionStatus
from src.domain.entity.user import User, UserRole

from .schemas import DashboardStatsResponse, RecentActivityItem


class GetDashboardStatsUseCase:
    """Return role-aware submission counts and recent activity."""

    def __init__(
        self,
        sub_repo: ISubmissionRepository,
        log_repo: IActivityLogRepository,
    ) -> None:
        self._sub_repo = sub_repo
        self._log_repo = log_repo

    async def execute(self, user: User) -> DashboardStatsResponse:
        # ── Counts by status ──
        if user.role == UserRole.OPERATOR_LEMBAGA:
            counts = await self._sub_repo.count_by_status()
            pending = 0
            total = sum(counts.values())
        else:
            counts = await self._sub_repo.count_by_status(
                submitter_id=user.id, verifier_id=user.id
            )
            pending_subs = await self._sub_repo.find_pending_verifications(user.id)
            pending = len(pending_subs)
            total = sum(counts.values())

        # ── Recent activity ──
        logs = await self._log_repo.find_by_user_id(user.id)
        sorted_logs = sorted(logs, key=lambda l: l.created_at or "", reverse=True)[:10]
        activity = [
            RecentActivityItem(
                id=str(log.id),
                type=log.action_type.lower(),
                description=log.description or log.action_type,
                timestamp=log.created_at,
            )
            for log in sorted_logs
        ]

        return DashboardStatsResponse(
            total_submissions=total,
            draft_submissions=counts.get("draft", 0),
            submitted_submissions=counts.get("submitted", 0),
            approved_submissions=counts.get("approved", 0),
            rejected_submissions=counts.get("rejected", 0),
            pending_verifications=pending,
            recent_activity=activity,
        )
