"""
routers/auth.py — Authentication endpoints using centralized schemas.
"""
import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import create_access_token, get_current_user, verify_password
from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, LoginResponse, MeResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _map_user(u: User) -> UserResponse:
    return UserResponse(
        id=str(u.id),
        name=u.name,
        email=u.email,
        role=u.role,
        department=u.department,
        nim=u.nim,
        fakultas=u.fakultas,
        program=u.program,
        nip=u.nip,
        position=u.position,
    )


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Validate credentials and return a JWT token."""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email atau password salah")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Akun Anda dinonaktifkan.")

    user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return LoginResponse(
        user=_map_user(user),
        token=token,
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Stateless JWT logout — client must discard the token."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return MeResponse(user=_map_user(current_user))


@router.get("/verifiers", response_model=List[UserResponse])
def get_verifiers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all active verifier-eligible users (for the selection UI)."""
    users = db.query(User).filter(
        User.role != "admin",
        User.is_active == True,
    ).all()
    return [_map_user(u) for u in users]
