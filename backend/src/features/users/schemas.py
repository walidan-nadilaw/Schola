"""Pydantic schemas for the Users feature."""

from datetime import datetime

from pydantic import BaseModel, EmailStr

from src.domain.entity.user import UserRole


# -- Requests --

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.MAHASISWA
    nim: str | None = None
    fakultas: str | None = None
    departemen: str | None = None
    nip: str | None = None


class UpdateUserRequest(BaseModel):
    role: UserRole | None = None
    nim: str | None = None
    fakultas: str | None = None
    departemen: str | None = None
    nip: str | None = None


# -- Responses --

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    nim: str | None = None
    fakultas: str | None = None
    departemen: str | None = None
    nip: str | None = None
    is_email_verified: bool
    created_at: datetime


class PaginationResponse(BaseModel):
    current_page: int
    total_pages: int
    total_items: int
    items_per_page: int


class UserListResponse(BaseModel):
    data: list[UserResponse]
    pagination: PaginationResponse
