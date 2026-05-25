"""FastAPI router for the Auth feature slice."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user
from src.api.http import HTTPDataResponse, HTTPErrorResponse, HTTPMessageResponse
from src.domain.entity.user import User
from src.infrastructure.db import get_async_db_session
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.services.argon_password_service import ArgonPasswordService
from src.infrastructure.services.jwt_token_service import JwtTokenService

from .schemas import LoginData, LoginRequest, RegisterRequest, UserResponse
from .use_case import LoginUseCase, RegisterUseCase

router = APIRouter(prefix="/auth", tags=["Auth"])

# ── Helpers ───────────────────────────────────────────


def _to_user_response(user: User) -> UserResponse:
    """Map a domain User to the API response schema."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role.value,
        nim=user.nim,
        fakultas=user.fakultas,
        departemen=user.departemen,
        nip=user.nip,
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
    )


# ── Endpoints ─────────────────────────────────────────


@router.post(
    "/register",
    response_model=HTTPDataResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {
            "model": HTTPErrorResponse,
            "description": "Domain email tidak diizinkan",
        },
        409: {"model": HTTPErrorResponse, "description": "Email sudah terdaftar"},
        422: {"model": HTTPErrorResponse, "description": "Validasi input gagal"},
    },
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_async_db_session),
):
    """Register a new user account."""
    use_case = RegisterUseCase(
        user_repo=UserRepository(db),
        password_service=ArgonPasswordService(),
    )

    user = await use_case.execute(
        email=body.email,
        password=body.password,
        role=body.role,
        nim=body.nim,
        fakultas=body.fakultas,
        departemen=body.departemen,
        nip=body.nip,
    )

    return HTTPDataResponse(
        status="success",
        data=_to_user_response(user),
        message="Registrasi berhasil",
    )


@router.post(
    "/login",
    response_model=HTTPDataResponse[LoginData],
    responses={
        401: {"model": HTTPErrorResponse, "description": "Email atau password salah"},
        422: {"model": HTTPErrorResponse, "description": "Validasi input gagal"},
    },
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_async_db_session),
):
    """Authenticate and receive a JWT."""
    use_case = LoginUseCase(
        user_repo=UserRepository(db),
        password_service=ArgonPasswordService(),
        token_service=JwtTokenService(),
    )

    user, token, expires_in = await use_case.execute(
        email=body.email,
        password=body.password,
    )

    return HTTPDataResponse(
        status="success",
        data=LoginData(
            user=_to_user_response(user),
            token=token,
            expires_in=expires_in,
        ),
        message="Login berhasil",
    )


@router.post(
    "/logout",
    response_model=HTTPMessageResponse,
    responses={
        401: {"model": HTTPErrorResponse, "description": "Token tidak valid"},
    },
)
async def logout(_current_user: User = Depends(get_current_user)):
    """Stateless logout, client must discard the token."""
    return HTTPMessageResponse(
        status="success",
        message="Logout berhasil",
    )


@router.get(
    "/me",
    response_model=HTTPDataResponse[UserResponse],
    responses={
        401: {"model": HTTPErrorResponse, "description": "Token tidak valid"},
    },
)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return HTTPDataResponse(
        status="success",
        data=_to_user_response(current_user),
        message="Data user berhasil diambil",
    )
