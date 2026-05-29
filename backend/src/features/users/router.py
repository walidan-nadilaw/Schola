"""FastAPI router for the Users feature."""

import math
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, require_role
from src.api.http import HTTPDataResponse, HTTPErrorResponse, HTTPMessageResponse
from src.domain.entity.user import User, UserRole
from src.infrastructure.db import get_async_db_session
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.services.argon_password_service import ArgonPasswordService

from .schemas import (
    CreateUserRequest,
    PaginationResponse,
    UpdateUserRequest,
    UserListResponse,
    UserResponse,
)
from .use_case import (
    CreateUserUseCase,
    DeleteUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
)

router = APIRouter(prefix="/users", tags=["Users"])


def _to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role.value,
        nama=user.nama,
        nim=user.nim,
        fakultas=user.fakultas,
        departemen=user.departemen,
        nip=user.nip,
        program=user.program,
        position=user.position,
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
    )


@router.get(
    "/",
    response_model=HTTPDataResponse[UserListResponse],
    responses={401: {"model": HTTPErrorResponse}},
)
async def list_users(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    role: str | None = None,
    department: str | None = None,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """List users with optional search, role filter, and department filter."""
    users, total = await ListUsersUseCase(UserRepository(db)).execute(
        page, limit, search=search, role=role, department=department
    )
    return HTTPDataResponse(
        status="success",
        data=UserListResponse(
            data=[_to_response(u) for u in users],
            pagination=PaginationResponse(
                current_page=page,
                total_pages=math.ceil(total / limit) if limit else 1,
                total_items=total,
                items_per_page=limit,
            ),
        ),
        message="Data user berhasil diambil",
    )


@router.get(
    "/{user_id}",
    response_model=HTTPDataResponse[UserResponse],
    responses={
        401: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse, "description": "User tidak ditemukan"},
    },
)
async def get_user(
    user_id: UUID,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Get a single user."""
    user = await GetUserUseCase(UserRepository(db)).execute(user_id)
    return HTTPDataResponse(
        status="success",
        data=_to_response(user),
        message="Data user berhasil diambil",
    )


@router.post(
    "/",
    response_model=HTTPDataResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": HTTPErrorResponse},
        403: {"model": HTTPErrorResponse},
        409: {"model": HTTPErrorResponse},
    },
)
async def create_user(
    body: CreateUserRequest,
    _current_user: User = Depends(require_role(UserRole.OPERATOR_LEMBAGA)),
    db: AsyncSession = Depends(get_async_db_session),
):
    """(Operator only) Create a new user."""
    uc = CreateUserUseCase(UserRepository(db), ArgonPasswordService())
    user = await uc.execute(
        email=body.email,
        password=body.password,
        nama=body.nama,
        role=body.role,
        nim=body.nim,
        fakultas=body.fakultas,
        departemen=body.departemen,
        nip=body.nip,
        program=body.program,
        position=body.position,
    )
    return HTTPDataResponse(
        status="success",
        data=_to_response(user),
        message="User berhasil dibuat",
    )


@router.put(
    "/{user_id}",
    response_model=HTTPDataResponse[UserResponse],
    responses={
        403: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def update_user(
    user_id: UUID,
    body: UpdateUserRequest,
    _current_user: User = Depends(require_role(UserRole.OPERATOR_LEMBAGA)),
    db: AsyncSession = Depends(get_async_db_session),
):
    """(Operator only) Update user attributes."""
    user = await UpdateUserUseCase(UserRepository(db)).execute(
        user_id=user_id,
        nama=body.nama,
        role=body.role,
        nim=body.nim,
        fakultas=body.fakultas,
        departemen=body.departemen,
        nip=body.nip,
        program=body.program,
        position=body.position,
    )
    return HTTPDataResponse(
        status="success",
        data=_to_response(user),
        message="User berhasil diupdate",
    )


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        403: {"model": HTTPErrorResponse},
        404: {"model": HTTPErrorResponse},
    },
)
async def delete_user(
    user_id: UUID,
    _current_user: User = Depends(require_role(UserRole.OPERATOR_LEMBAGA)),
    db: AsyncSession = Depends(get_async_db_session),
):
    """(Operator only) Delete a user."""
    await DeleteUserUseCase(UserRepository(db)).execute(user_id)
