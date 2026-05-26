"""Use cases for the Notifications feature."""

from uuid import UUID

from src.api.exceptions import AuthorizationException, NotFoundException
from src.core.time_now import now as _utcnow
from src.domain.entity.i_notification_repository import INotificationRepository
from src.domain.entity.notification import Notification

from .schemas import NotificationResponse


def _to_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=str(n.id),
        user_id=str(n.user_id),
        type=n.type,
        title=n.title,
        message=n.message,
        submission_id=n.submission_id,
        is_read=n.is_read,
        read_at=n.read_at,
        action_url=n.action_url,
        created_at=n.created_at,
    )


class ListNotificationsUseCase:
    """List all notifications for the current user, newest first."""

    def __init__(self, repo: INotificationRepository) -> None:
        self._repo = repo

    async def execute(self, user_id: UUID) -> list[NotificationResponse]:
        notifications = await self._repo.find_by_user_id(user_id)
        return [_to_response(n) for n in notifications]


class MarkAsReadUseCase:
    """Mark a single notification as read."""

    def __init__(self, repo: INotificationRepository) -> None:
        self._repo = repo

    async def execute(self, notification_id: UUID, user_id: UUID) -> None:
        notification = await self._repo.findById(notification_id)
        if notification is None:
            raise NotFoundException("Notifikasi tidak ditemukan")

        if notification.user_id != user_id:
            raise AuthorizationException("Bukan notifikasi milik Anda")

        notification.is_read = True
        notification.read_at = _utcnow()
        await self._repo.update(notification)
