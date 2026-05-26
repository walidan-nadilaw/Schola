"""FastAPI router for the Notifications feature."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user
from src.api.http import HTTPDataResponse, HTTPErrorResponse
from src.domain.entity.user import User
from src.infrastructure.db import get_async_db_session
from src.infrastructure.repositories.notification_repository import NotificationRepository

from .schemas import NotificationResponse
from .use_case import ListNotificationsUseCase, MarkAsReadUseCase

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "/",
    response_model=HTTPDataResponse[list[NotificationResponse]],
    responses={401: {"model": HTTPErrorResponse}},
)
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """List all notifications for the current user, newest first."""
    uc = ListNotificationsUseCase(NotificationRepository(db))
    items = await uc.execute(current_user.id)
    return HTTPDataResponse(
        status="success",
        data=items,
        message="Notifikasi berhasil diambil",
    )


@router.post(
    "/{notification_id}/read",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"model": HTTPErrorResponse},
        403: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Mark a notification as read."""
    uc = MarkAsReadUseCase(NotificationRepository(db))
    await uc.execute(notification_id, current_user.id)
