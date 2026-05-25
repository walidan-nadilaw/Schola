"""FastAPI router for the Templates feature."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, require_role
from src.api.http import HTTPDataResponse, HTTPErrorResponse
from src.domain.entity.user import User, UserRole
from src.infrastructure.db import get_async_db_session
from src.infrastructure.repositories.template_repository import FormTemplateRepository

from .schemas import CreateTemplateRequest, TemplateResponse, UpdateTemplateRequest
from .use_case import (
    CreateTemplateUseCase,
    DeleteTemplateUseCase,
    GetTemplateUseCase,
    ListTemplatesUseCase,
    UpdateTemplateUseCase,
)

router = APIRouter(prefix="/templates", tags=["Templates"])


def _to_response(t) -> TemplateResponse:
    return TemplateResponse(
        id=str(t.id),
        letter_type=t.letter_type,
        description=t.description,
        fields=t.fields,
        is_active=t.is_active,
        created_by=str(t.created_by) if t.created_by else None,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


@router.get(
    "/",
    response_model=HTTPDataResponse[list[TemplateResponse]],
    responses={401: {"model": HTTPErrorResponse}},
)
async def list_templates(
    active_only: bool = Query(True, description="Only show active templates"),
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """List templates. Defaults to active only."""
    templates = await ListTemplatesUseCase(FormTemplateRepository(db)).execute(active_only)
    return HTTPDataResponse(
        status="success",
        data=[_to_response(t) for t in templates],
        message="Data template berhasil diambil",
    )


@router.get(
    "/{template_id}",
    response_model=HTTPDataResponse[TemplateResponse],
    responses={
        401: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def get_template(
    template_id: UUID,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Get a single template by ID."""
    t = await GetTemplateUseCase(FormTemplateRepository(db)).execute(template_id)
    return HTTPDataResponse(
        status="success",
        data=_to_response(t),
        message="Data template berhasil diambil",
    )


@router.post(
    "/",
    response_model=HTTPDataResponse[TemplateResponse],
    status_code=status.HTTP_201_CREATED,
    responses={
        403: {"model": HTTPErrorResponse},
    },
)
async def create_template(
    body: CreateTemplateRequest,
    current_user: User = Depends(require_role(UserRole.OPERATOR_LEMBAGA)),
    db: AsyncSession = Depends(get_async_db_session),
):
    """(Operator only) Create a new template."""
    t = await CreateTemplateUseCase(FormTemplateRepository(db)).execute(
        letter_type=body.letter_type,
        fields=body.fields,
        description=body.description,
        created_by=current_user.id,
    )
    return HTTPDataResponse(
        status="success",
        data=_to_response(t),
        message="Template berhasil dibuat",
    )


@router.put(
    "/{template_id}",
    response_model=HTTPDataResponse[TemplateResponse],
    responses={
        403: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def update_template(
    template_id: UUID,
    body: UpdateTemplateRequest,
    _current_user: User = Depends(require_role(UserRole.OPERATOR_LEMBAGA)),
    db: AsyncSession = Depends(get_async_db_session),
):
    """(Operator only) Update a template."""
    t = await UpdateTemplateUseCase(FormTemplateRepository(db)).execute(
        template_id=template_id,
        letter_type=body.letter_type,
        description=body.description,
        fields=body.fields,
        is_active=body.is_active,
    )
    return HTTPDataResponse(
        status="success",
        data=_to_response(t),
        message="Template berhasil diupdate",
    )


@router.delete(
    "/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        403: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def delete_template(
    template_id: UUID,
    _current_user: User = Depends(require_role(UserRole.OPERATOR_LEMBAGA)),
    db: AsyncSession = Depends(get_async_db_session),
):
    """(Operator only) Delete a template."""
    await DeleteTemplateUseCase(FormTemplateRepository(db)).execute(template_id)
