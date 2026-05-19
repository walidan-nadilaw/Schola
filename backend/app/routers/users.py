"""
routers/users.py — User management endpoints.
Enforces admin-only CRUD constraints for creating, updating, and deleting users.
"""
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import RoleChecker, get_current_user, hash_password
from ..database import get_db
from ..models import User
from ..schemas import (
    PaginationSchema,
    UserCreateSchema,
    UserListResponse,
    UserResponse,
    UserUpdateSchema,
)

router = APIRouter(prefix="/users", tags=["Users"])


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


@router.get("/", response_model=UserListResponse)
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    department: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search / list active users. Used in verifier selection UI and admin dashboard.
    Supports filtering by name/email (search), role, and department.
    """
    query = db.query(User).filter(User.is_active == True)

    if search:
        like = f"%{search}%"
        query = query.filter(
            (User.name.ilike(like)) | (User.email.ilike(like))
        )
    if role:
        query = query.filter(User.role == role.lower())
    if department:
        query = query.filter(User.department.ilike(f"%{department}%"))

    total = query.count()
    users = query.order_by(User.name).offset((page - 1) * limit).limit(limit).all()

    return UserListResponse(
        data=[_map_user(u) for u in users],
        pagination=PaginationSchema(
            currentPage=page,
            totalPages=math.ceil(total / limit) if limit else 1,
            totalItems=total,
            itemsPerPage=limit,
        ),
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single user profile."""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    return _map_user(user)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
):
    """(Admin only) Create a new user with custom attributes."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(400, "Email sudah terdaftar")

    if payload.nim:
        existing_nim = db.query(User).filter(User.nim == payload.nim).first()
        if existing_nim:
            raise HTTPException(400, "NIM sudah terdaftar")

    if payload.nip:
        existing_nip = db.query(User).filter(User.nip == payload.nip).first()
        if existing_nip:
            raise HTTPException(400, "NIP sudah terdaftar")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role=payload.role.lower(),
        department=payload.department,
        nim=payload.nim,
        fakultas=payload.fakultas,
        program=payload.program,
        nip=payload.nip,
        position=payload.position,
        semester=payload.semester,
        is_active=payload.is_active if payload.is_active is not None else True,
        email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _map_user(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    payload: UserUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
):
    """(Admin only) Update any user's profile and attributes."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Pengguna tidak ditemukan")

    # Update simple attributes
    for field in ["name", "role", "department", "nim", "fakultas", "program", "nip", "position", "semester", "is_active"]:
        val = getattr(payload, field)
        if val is not None:
            if field == "role":
                setattr(user, field, val.lower())
            else:
                setattr(user, field, val)

    if payload.email:
        existing = db.query(User).filter(User.email == payload.email, User.id != user.id).first()
        if existing:
            raise HTTPException(400, "Email sudah digunakan oleh pengguna lain")
        user.email = payload.email

    db.commit()
    db.refresh(user)
    return _map_user(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
):
    """(Admin only) Soft-delete a user by setting is_active=False."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Pengguna tidak ditemukan")
    user.is_active = False
    db.commit()
