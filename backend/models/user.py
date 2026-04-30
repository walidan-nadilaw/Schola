from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from ..database import Base
import enum


class RoleType(enum.Enum):
    operator = "operator"
    dosen_pejabat = "dosen_pejabat"
    mahasiswa = "mahasiswa"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    nama: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[RoleType] = mapped_column(SAEnum(RoleType), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    __mapper_args__ = {
        "polymorphic_on": role,  # discriminator column
        "polymorphic_identity": None,
    }


class Mahasiswa(User):
    __tablename__ = "mahasiswa"

    id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    nim: Mapped[str] = mapped_column(String, nullable=False)
    fakultas: Mapped[str] = mapped_column(String, nullable=False)
    program_studi: Mapped[str] = mapped_column(String, nullable=False)
    status_aktif: Mapped[str] = mapped_column(String, nullable=False, default="aktif")

    __mapper_args__ = {
        "polymorphic_identity": RoleType.mahasiswa,
    }


class OperatorLembaga(User):
    __tablename__ = "operator_lembaga"

    id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    unit_kerja: Mapped[str] = mapped_column(String, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": RoleType.operator,
    }


class DosenPejabat(User):
    __tablename__ = "dosen_pejabat"

    id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    nip: Mapped[str] = mapped_column(String, nullable=False)
    jabatan: Mapped[str] = mapped_column(String, nullable=False)
    unit_kerja: Mapped[str] = mapped_column(String, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": RoleType.dosen_pejabat,
    }
