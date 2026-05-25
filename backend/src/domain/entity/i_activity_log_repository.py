"""Abstract interface for the ActivityLog repository."""

from abc import abstractmethod
from collections.abc import Iterable
from uuid import UUID

from src.domain.entity.activity_log import ActivityLog
from src.infrastructure.repositories.repository import IRepository


class IActivityLogRepository(IRepository[ActivityLog, UUID]):
    """Port for activity log persistence with additional query methods."""

    @abstractmethod
    async def find_by_user_id(self, user_id: UUID) -> Iterable[ActivityLog]:
        """Find all activity logs for a specific user."""
        pass

    @abstractmethod
    async def find_by_submission_id(self, submission_id: str) -> Iterable[ActivityLog]:
        """Find all activity logs for a specific submission."""
        pass

    @abstractmethod
    async def find_by_action_type(self, action_type: str) -> Iterable[ActivityLog]:
        """Find all activity logs of a specific action type."""
        pass
