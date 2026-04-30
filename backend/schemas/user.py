from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional

from backend.models.user import RoleType


class UserBase(BaseModel):
    email: EmailStr
    nama: str
    role: RoleType


class MahasiswaCreate(UserBase):
    password: str
    nim: str
    fakultas: str
    program_studi: str
    status_aktif: str = "aktif"


class RegisterRequest(UserBase):
    password: str
    nim: Optional[str] = None
    fakultas: Optional[str] = None
    program_studi: Optional[str] = None
    status_aktif: str = "aktif"
    unit_kerja: Optional[str] = None
    nip: Optional[str] = None
    jabatan: Optional[str] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
