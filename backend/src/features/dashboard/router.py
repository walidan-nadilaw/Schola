"""FastAPI router for the Dashboard feature."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user
from src.api.http import HTTPDataResponse, HTTPErrorResponse
from src.domain.entity.user import User
from src.infrastructure.db import get_async_db_session
from src.infrastructure.repositories.submission_repository import SubmissionRepository
from src.infrastructure.repositories.activity_log_repository import ActivityLogRepository

from .schemas import DashboardStatsResponse
from .use_case import GetDashboardStatsUseCase

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/stats",
    response_model=HTTPDataResponse[DashboardStatsResponse],
    responses={401: {"model": HTTPErrorResponse}},
)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Role-aware submission counts and recent activity feed."""
    uc = GetDashboardStatsUseCase(
        SubmissionRepository(db),
        ActivityLogRepository(db),
    )
    stats = await uc.execute(current_user)
    return HTTPDataResponse(
        status="success",
        data=stats,
        message="Statistik dashboard berhasil diambil",
    )
