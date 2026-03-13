from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    nama = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "mahasiswa" | "operator" | "dosen_pejabat"
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    # role-specific fields
    # Mahasiswa
    nim = Column(String, nullable=True)
    fakultas = Column(String, nullable=True)
    program_studi = Column(String, nullable=True)
    status_aktif = Column(String, nullable=True)

    # OperatorLembaga
    unit_kerja = Column(String, nullable=True)

    # DosenPejabat
    nip = Column(String, nullable=True)
    jabatan = Column(String, nullable=True)