"""Pydantic schemas for the Auth feature slice."""

from datetime import datetime

from pydantic import BaseModel, EmailStr

from src.domain.entity.user import UserRole

# ── Requests ──────────────────────────────────────────


class RegisterRequest(BaseModel):
    """Body for POST /auth/register."""

    email: EmailStr
    password: str
    role: UserRole = UserRole.MAHASISWA
    nim: str | None = None
    fakultas: str | None = None
    departemen: str | None = None
    nip: str | None = None


class LoginRequest(BaseModel):
    """Body for POST /auth/login."""

    email: EmailStr
    password: str


# ── Responses ─────────────────────────────────────────


class UserResponse(BaseModel):
    """Public representation of a User."""

    id: str
    email: str
    role: str
    nama: str
    nim: str | None = None
    fakultas: str | None = None
    departemen: str | None = None
    nip: str | None = None
    is_email_verified: bool
    created_at: datetime


class LoginData(BaseModel):
    """Payload returned on successful login."""

    user: UserResponse
    token: str
    expires_in: int
