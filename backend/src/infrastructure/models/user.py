import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.infrastructure.db import Base
from src.domain.entity.user import (
    User as DomainUser,
    Mahasiswa as DomainMahasiswa,
    OperatorLembaga as DomainOperatorLembaga,
    DosenPejabat as DomainDosenPejabat,
    UserRole,
)

if TYPE_CHECKING:
    from .submission import Submission, SubmissionVerifier
    from .template import FormTemplate

from src.core.time_now import now


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(
        "password_hash", String(255), nullable=False
    )
    nama: Mapped[str] = mapped_column("name", String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, index=True
    )
    departemen: Mapped[str | None] = mapped_column(
        "department", String(255), nullable=True, index=True
    )

    # Student-specific
    nim: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )
    fakultas: Mapped[str | None] = mapped_column(String(255), nullable=True)
    program: Mapped[str | None] = mapped_column(String(255), nullable=True)
    semester: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Faculty/Staff-specific
    nip: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )
    position: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Common
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    profile_picture_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now, onupdate=now
    )

    submissions: Mapped[List["Submission"]] = relationship(
        "Submission",
        back_populates="submitter",
        foreign_keys="[Submission.submitter_id]",
    )
    verifications: Mapped[List["SubmissionVerifier"]] = relationship(
        "SubmissionVerifier", back_populates="verifier"
    )
    templates_created: Mapped[List["FormTemplate"]] = relationship(
        "FormTemplate", back_populates="creator"
    )

    def to_user(self) -> DomainUser:
        return DomainUser(
            id=self.id,
            email=self.email,
            hashed_password=self.hashed_password,
            nama=self.nama,
            role=self.role,
            nim=self.nim,
            fakultas=self.fakultas,
            departemen=self.departemen,
            nip=self.nip,
            program=self.program,
            position=self.position,
            lokasi_id=None,
            email_verified_at=self.created_at if self.email_verified else None,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    def to_mahasiswa(self) -> DomainMahasiswa:
        return DomainMahasiswa(
            id=self.id,
            email=self.email,
            hashed_password=self.hashed_password,
            nama=self.nama,
            role=self.role,
            nim=self.nim,
            fakultas=self.fakultas,
            departemen=self.departemen,
            nip=self.nip,
            lokasi_id=None,
            email_verified_at=self.created_at if self.email_verified else None,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    def to_operator_lembaga(self) -> DomainOperatorLembaga:
        return DomainOperatorLembaga(
            id=self.id,
            email=self.email,
            hashed_password=self.hashed_password,
            nama=self.nama,
            role=self.role,
            nim=self.nim,
            fakultas=self.fakultas,
            departemen=self.departemen,
            nip=self.nip,
            lokasi_id=None,
            email_verified_at=self.created_at if self.email_verified else None,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    def to_dosen_pejabat(self) -> DomainDosenPejabat:
        return DomainDosenPejabat(
            id=self.id,
            email=self.email,
            hashed_password=self.hashed_password,
            nama=self.nama,
            role=self.role,
            nim=self.nim,
            fakultas=self.fakultas,
            departemen=self.departemen,
            nip=self.nip,
            lokasi_id=None,
            email_verified_at=self.created_at if self.email_verified else None,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_domain(cls, user: DomainUser) -> "User":
        """Convert domain model to table model"""
        return cls(
            id=user.id,
            email=user.email,
            hashed_password=user.hashed_password,
            nama=user.nama or user.email.split("@")[0],
            role=user.role,
            nim=user.nim,
            fakultas=user.fakultas,
            departemen=user.departemen,
            nip=user.nip,
            program=user.program,
            position=user.position,
            email_verified=user.is_email_verified,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


class Mahasiswa(User):
    __mapper_args__ = {
        "polymorphic_identity": UserRole.MAHASISWA,
    }


class OperatorLembaga(User):
    __mapper_args__ = {
        "polymorphic_identity": UserRole.OPERATOR_LEMBAGA,
    }


class DosenPejabat(User):
    __mapper_args__ = {
        "polymorphic_identity": UserRole.DOSEN_PEJABAT,
    }
