from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models.user import User
from backend.schemas.user import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from backend.services import (
    authenticate_user as authenticate_user_service,
    create_user_access_token,
    register_user as register_user_service,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user_service(payload, db)
    access_token = create_user_access_token(user)
    return AuthResponse(
        access_token=access_token,
        user=user,
    )


@router.post("/login", response_model=AuthResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user_service(payload, db)
    access_token = create_user_access_token(user)
    return AuthResponse(
        access_token=access_token,
        user=user,
    )


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user