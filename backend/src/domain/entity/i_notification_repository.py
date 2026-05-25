"""Abstract interface for the Notification repository."""

from abc import abstractmethod
from collections.abc import Iterable
from uuid import UUID

from src.domain.entity.notification import Notification
from src.infrastructure.repositories.repository import IRepository


class INotificationRepository(IRepository[Notification, UUID]):
    """Port for notification persistence with additional query methods."""

    @abstractmethod
    async def update(self, entity: Notification) -> Notification:
        """Persist changes to an existing notification."""
        pass

    @abstractmethod
    async def find_by_user_id(self, user_id: UUID) -> Iterable[Notification]:
        """Find all notifications for a specific user."""
        pass

    @abstractmethod
    async def find_unread_by_user_id(self, user_id: UUID) -> Iterable[Notification]:
        """Find all unread notifications for a specific user."""
        pass

    @abstractmethod
    async def mark_all_as_read(self, user_id: UUID) -> None:
        """Mark all notifications for a user as read."""
        pass
