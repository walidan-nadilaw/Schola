from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.user import DosenPejabat, Mahasiswa, OperatorLembaga, RoleType, User
from backend.schemas.user import LoginRequest, RegisterRequest
from backend.security import create_access_token, hash_password, verify_password


def build_user(payload: RegisterRequest) -> User:
    common_fields = {
        "email": payload.email,
        "nama": payload.nama,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
    }

    if payload.role == RoleType.mahasiswa:
        missing = [field for field in ("nim", "fakultas", "program_studi") if getattr(payload, field) is None]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing mahasiswa fields: {', '.join(missing)}",
            )
        return Mahasiswa(
            **common_fields,
            nim=payload.nim,
            fakultas=payload.fakultas,
            program_studi=payload.program_studi,
            status_aktif=payload.status_aktif,
        )

    if payload.role == RoleType.operator:
        if payload.unit_kerja is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing operator field: unit_kerja",
            )
        return OperatorLembaga(
            **common_fields,
            unit_kerja=payload.unit_kerja,
        )

    if payload.role == RoleType.dosen_pejabat:
        missing = [field for field in ("nip", "jabatan", "unit_kerja") if getattr(payload, field) is None]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing dosen_pejabat fields: {', '.join(missing)}",
            )
        return DosenPejabat(
            **common_fields,
            nip=payload.nip,
            jabatan=payload.jabatan,
            unit_kerja=payload.unit_kerja,
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported role",
    )


def register_user(payload: RegisterRequest, db: Session) -> User:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    user = build_user(payload)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(payload: LoginRequest, db: Session) -> User:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def create_user_access_token(user: User) -> str:
    return create_access_token({"sub": user.email})