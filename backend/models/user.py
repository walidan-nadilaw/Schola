from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base
import enum


class RoleType(enum.Enum):
    operator = "operator"
    dosen_pejabat = "dosen_pejabat"
    mahasiswa = "mahasiswa"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    nama = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SAEnum(RoleType), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __mapper_args__ = {
        "polymorphic_on": role,  # discriminator column
        "polymorphic_identity": None,
    }


class Mahasiswa(User):
    __tablename__ = "mahasiswa"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    nim = Column(String, nullable=False)
    fakultas = Column(String, nullable=False)
    program_studi = Column(String, nullable=False)
    status_aktif = Column(String, nullable=False, default="aktif")

    __mapper_args__ = {
        "polymorphic_identity": RoleType.mahasiswa,
    }


class OperatorLembaga(User):
    __tablename__ = "operator_lembaga"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    unit_kerja = Column(String, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": RoleType.operator,
    }


class DosenPejabat(User):
    __tablename__ = "dosen_pejabat"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    nip = Column(String, nullable=False)
    jabatan = Column(String, nullable=False)
    unit_kerja = Column(String, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": RoleType.dosen_pejabat,
    }
