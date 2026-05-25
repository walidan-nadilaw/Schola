import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base


def _now():
    """Timezone-aware UTC timestamp (replaces deprecated datetime.utcnow)."""
    return datetime.now(timezone.utc)


class RoleType(str, Enum):
    mahasiswa = "mahasiswa"
    operator = "operator"
    dosen_pejabat = "dosen_pejabat"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nama = Column("name", String(255), nullable=False)
    role = Column(String(50), nullable=False, index=True)
    department = Column(String(255), nullable=True, index=True)

    # Student-specific
    nim = Column(String(50), unique=True, nullable=True, index=True)
    fakultas = Column(String(255), nullable=True)
    program = Column(String(255), nullable=True)
    semester = Column(Integer, nullable=True)

    # Faculty/Staff-specific
    nip = Column(String(50), unique=True, nullable=True, index=True)
    position = Column(String(255), nullable=True)

    # Common
    phone = Column(String(20), nullable=True)
    profile_picture_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    submissions = relationship("Submission", back_populates="submitter", foreign_keys="[Submission.submitter_id]")
    verifications = relationship("SubmissionVerifier", back_populates="verifier")
    templates_created = relationship("FormTemplate", back_populates="creator")

    __mapper_args__ = {
        "polymorphic_on": role,
        "polymorphic_identity": "user",
    }

    @property
    def name(self) -> str:
        return self.nama

    @name.setter
    def name(self, value: str):
        self.nama = value


class Mahasiswa(User):
    __mapper_args__ = {
        "polymorphic_identity": RoleType.mahasiswa.value,
    }

    @property
    def program_studi(self) -> str | None:
        return self.program

    @program_studi.setter
    def program_studi(self, value: str | None):
        self.program = value

    @property
    def status_aktif(self) -> str:
        return "aktif" if self.is_active else "nonaktif"

    @status_aktif.setter
    def status_aktif(self, value: str):
        self.is_active = (value == "aktif")


class OperatorLembaga(User):
    __mapper_args__ = {
        "polymorphic_identity": RoleType.operator.value,
    }

    @property
    def unit_kerja(self) -> str | None:
        return self.department

    @unit_kerja.setter
    def unit_kerja(self, value: str | None):
        self.department = value


class DosenPejabat(User):
    __mapper_args__ = {
        "polymorphic_identity": RoleType.dosen_pejabat.value,
    }

    @property
    def jabatan(self) -> str | None:
        return self.position

    @jabatan.setter
    def jabatan(self, value: str | None):
        self.position = value

    @property
    def unit_kerja(self) -> str | None:
        return self.department

    @unit_kerja.setter
    def unit_kerja(self, value: str | None):
        self.department = value
