"""Domain model for user entity."""

import datetime
import enum
from dataclasses import dataclass
from typing import Self
from uuid import UUID, uuid4

from src.core.time_now import now as _utcnow

ALLOWED_EMAIL_DOMAINS = ("apps.ipb.ac.id", "ipb.ac.id")


def _assert_email_domain(email: str) -> None:
    domain = email.split("@")[-1]
    if domain not in ALLOWED_EMAIL_DOMAINS:
        raise ValueError(
            f"Domain '{domain}' tidak diizinkan. Domain yang diizinkan: {ALLOWED_EMAIL_DOMAINS}"
        )


class UserRole(str, enum.Enum):
    MAHASISWA = "mahasiswa"
    OPERATOR_LEMBAGA = "operator"
    DOSEN_PEJABAT = "dosen_pejabat"


@dataclass
class User:
    id: UUID
    email: str
    hashed_password: str
    nama: str = ""
    role: UserRole = UserRole.MAHASISWA
    nim: str | None = None
    fakultas: str | None = None
    departemen: str | None = None
    nip: str | None = None
    program: str | None = None
    position: str | None = None
    lokasi_id: UUID | None = None
    email_verified_at: datetime.datetime | None = None
    created_at: datetime.datetime | None = None
    updated_at: datetime.datetime | None = None

    def __post_init__(self) -> None:
        _assert_email_domain(self.email)
        if self.created_at is None:
            self.created_at = _utcnow()
        if self.updated_at is None:
            self.updated_at = self.created_at

    @classmethod
    def New(
        cls,
        email: str,
        hashed_password: str,
        role: UserRole = UserRole.MAHASISWA,
        nim: str | None = None,
        fakultas: str | None = None,
        departemen: str | None = None,
        nip: str | None = None,
        program: str | None = None,
        position: str | None = None,
        lokasi_id: UUID | None = None,
    ) -> Self:
        """Register a new user with domain validation."""
        now = _utcnow()
        return cls(
            id=uuid4(),
            email=email,
            hashed_password=hashed_password,
            role=role,
            nim=nim,
            fakultas=fakultas,
            departemen=departemen,
            nip=nip,
            program=program,
            position=position,
            lokasi_id=lokasi_id,
            email_verified_at=None,
            created_at=now,
            updated_at=now,
        )

    @property
    def is_email_verified(self) -> bool:
        return self.email_verified_at is not None

    def verify_email(self) -> None:
        """Mark the email as verified."""
        now = _utcnow()
        self.email_verified_at = now
        self.updated_at = now


@dataclass
class Mahasiswa(User):
    pass


@dataclass
class OperatorLembaga(User):
    pass


@dataclass
class DosenPejabat(User):
    pass
