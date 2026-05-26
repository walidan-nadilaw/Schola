"""FastAPI router for the FAQs feature."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, require_role
from src.api.http import HTTPDataResponse, HTTPErrorResponse
from src.domain.entity.user import User, UserRole
from src.infrastructure.db import get_async_db_session
from src.infrastructure.repositories.faq_repository import FAQRepository

from .schemas import FAQCreateRequest, FAQResponse
from .use_case import (
    CreateFAQUseCase,
    DeleteFAQUseCase,
    GetFAQUseCase,
    ListFAQsUseCase,
    UpdateFAQUseCase,
)

router = APIRouter(prefix="/faqs", tags=["Frequently Asked Questions"])


@router.get(
    "/",
    response_model=HTTPDataResponse[list[FAQResponse]],
)
async def list_faqs(
    db: AsyncSession = Depends(get_async_db_session),
):
    """List all FAQs (public)."""
    uc = ListFAQsUseCase(FAQRepository(db))
    items = await uc.execute()
    return HTTPDataResponse(
        status="success", data=items, message="Daftar FAQ berhasil diambil"
    )


@router.get(
    "/{faq_id}",
    response_model=HTTPDataResponse[FAQResponse],
    responses={404: {"model": HTTPErrorResponse}},
)
async def get_faq(
    faq_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
):
    """Get a single FAQ (public)."""
    uc = GetFAQUseCase(FAQRepository(db))
    faq = await uc.execute(faq_id)
    return HTTPDataResponse(
        status="success", data=faq, message="FAQ berhasil diambil"
    )


@router.post(
    "/",
    response_model=HTTPDataResponse[FAQResponse],
    status_code=status.HTTP_201_CREATED,
    responses={401: {"model": HTTPErrorResponse}, 403: {"model": HTTPErrorResponse}},
)
async def create_faq(
    body: FAQCreateRequest,
    current_user: User = Depends(require_role(UserRole.OPERATOR_LEMBAGA)),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Create a new FAQ (Operator only)."""
    uc = CreateFAQUseCase(FAQRepository(db))
    faq = await uc.execute(body.question, body.answer)
    return HTTPDataResponse(
        status="success", data=faq, message="FAQ berhasil dibuat"
    )


@router.put(
    "/{faq_id}",
    response_model=HTTPDataResponse[FAQResponse],
    responses={
        401: {"model": HTTPErrorResponse},
        403: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def update_faq(
    faq_id: UUID,
    body: FAQCreateRequest,
    current_user: User = Depends(require_role(UserRole.OPERATOR_LEMBAGA)),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Update an existing FAQ (Operator only)."""
    uc = UpdateFAQUseCase(FAQRepository(db))
    faq = await uc.execute(faq_id, body.question, body.answer)
    return HTTPDataResponse(
        status="success", data=faq, message="FAQ berhasil diperbarui"
    )


@router.delete(
    "/{faq_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"model": HTTPErrorResponse},
        403: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def delete_faq(
    faq_id: UUID,
    current_user: User = Depends(require_role(UserRole.OPERATOR_LEMBAGA)),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Delete an FAQ (Operator only)."""
    uc = DeleteFAQUseCase(FAQRepository(db))
    await uc.execute(faq_id)
