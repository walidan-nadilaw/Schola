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
        # ── Get relevant submissions based on role ──
        if user.role == UserRole.OPERATOR_LEMBAGA:
            subs = list(await self._sub_repo.findAll())
            pending = 0
        else:
            from itertools import chain

            own = list(await self._sub_repo.find_by_submitter_id(user.id))
            verified = await self._sub_repo.find_by_verifier_id(user.id)
            # merge, deduplicate by id
            seen = {s.id: s for s in chain(own, verified)}
            subs = list(seen.values())

            # pending verifications = assigned as verifier + status is pending
            pending_subs = await self._sub_repo.find_pending_verifications(user.id)
            pending = len(pending_subs)

        # ── Counts by status ──
        def _count(status: SubmissionStatus) -> int:
            return sum(1 for s in subs if s.status == status)

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
            total_submissions=len(subs),
            draft_submissions=_count(SubmissionStatus.DRAFT),
            submitted_submissions=_count(SubmissionStatus.SUBMITTED),
            approved_submissions=_count(SubmissionStatus.APPROVED),
            rejected_submissions=_count(SubmissionStatus.REJECTED),
            pending_verifications=pending,
            recent_activity=activity,
        )
