from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: str
    nama: str
    role: str

class MahasiswaCreate(UserBase):
    password: str
    nim: str
    fakultas: str
    program_studi: str
    status_aktif: str = "aktif"

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"