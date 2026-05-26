"""Seed data for development - runs on first boot if DB is empty."""

import uuid

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from src.core.time_now import now as _utcnow
from src.infrastructure.db import Base, async_session_maker, engine


async def seed_if_empty() -> bool:
    """Seed the database if users table is empty. Returns True if seeded."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as session:
        result = await session.execute(select(text("COUNT(*) FROM users")))
        count = result.scalar_one()
        if count > 0:
            return False

        from src.infrastructure.services.argon_password_service import ArgonPasswordService
        pwd = ArgonPasswordService()
        admin_pw = pwd.hash("admin123")
        user_pw = pwd.hash("user123")

        now = _utcnow()

        admin_id = uuid.uuid4()
        user1_id = uuid.uuid4()
        user2_id = uuid.uuid4()
        user3_id = uuid.uuid4()
        user4_id = uuid.uuid4()
        user5_id = uuid.uuid4()

        users_data = [
            {"id": admin_id, "email": "admin@ipb.ac.id", "hashed_password": admin_pw,
             "nama": "Administrator", "role": "OPERATOR_LEMBAGA", "nip": "198006152008022002",
             "is_active": True, "email_verified": True, "created_at": now, "updated_at": now},

            {"id": user1_id, "email": "user1@apps.ipb.ac.id", "hashed_password": user_pw,
             "nama": "User Satu", "role": "MAHASISWA", "nim": "G64180001",
             "fakultas": "FMIPA", "program": "S1 Ilmu Komputer", "semester": 6,
             "is_active": True, "email_verified": True, "created_at": now, "updated_at": now},

            {"id": user2_id, "email": "user2@apps.ipb.ac.id", "hashed_password": user_pw,
             "nama": "User Dua", "role": "MAHASISWA", "nim": "G64180002",
             "fakultas": "FMIPA", "program": "S1 Sains Data", "semester": 4,
             "is_active": True, "email_verified": True, "created_at": now, "updated_at": now},

            {"id": user3_id, "email": "user3@apps.ipb.ac.id", "hashed_password": user_pw,
             "nama": "User Tiga", "role": "DOSEN_PEJABAT", "nip": "198503122010121001",
             "position": "Dosen Pembimbing Akademik",
             "is_active": True, "email_verified": True, "created_at": now, "updated_at": now},

            {"id": user4_id, "email": "user4@apps.ipb.ac.id", "hashed_password": user_pw,
             "nama": "User Empat", "role": "DOSEN_PEJABAT", "nip": "199008242015042001",
             "position": "Kepala Seksi Akademik",
             "is_active": True, "email_verified": True, "created_at": now, "updated_at": now},

            {"id": user5_id, "email": "user5@apps.ipb.ac.id", "hashed_password": user_pw,
             "nama": "User Lima", "role": "DOSEN_PEJABAT", "nip": "197804152002121002",
             "position": "Ketua Departemen",
             "is_active": True, "email_verified": True, "created_at": now, "updated_at": now},
        ]

        from src.infrastructure.models.user import User
        for u in users_data:
            session.add(User(**u))
        await session.flush()

        # ── Form Templates ──
        tpl1_id = uuid.uuid4()
        tpl2_id = uuid.uuid4()
        templates_data = [
            {"id": tpl1_id, "letter_type": "Surat Keterangan Aktif", "is_active": True,
             "fields": [
                 {"id": "nama", "label": "Nama Lengkap", "type": "text", "required": True},
                 {"id": "nim", "label": "NIM", "type": "text", "required": True},
                 {"id": "program", "label": "Program Studi", "type": "text", "required": True},
                 {"id": "semester", "label": "Semester", "type": "number", "required": True},
                 {"id": "tujuan", "label": "Tujuan", "type": "text", "required": True},
                 {"id": "Keperluan", "label": "Keperluan Surat", "type": "text", "required": True},
             ], "created_at": now, "updated_at": now},

            {"id": tpl2_id, "letter_type": "Surat Rekomendasi", "is_active": True,
             "fields": [
                 {"id": "nama", "label": "Nama Lengkap", "type": "text", "required": True},
                 {"id": "nim", "label": "NIM", "type": "text", "required": True},
                 {"id": "program", "label": "Program Studi", "type": "text", "required": True},
                 {"id": "Judul Penelitian", "label": "Judul Penelitian", "type": "text", "required": True},
                 {"id": "dosen_pembimbing", "label": "Dosen Pembimbing", "type": "text", "required": True},
             ], "created_at": now, "updated_at": now},
        ]

        from src.infrastructure.models.template import FormTemplate
        for t in templates_data:
            session.add(FormTemplate(**t))
        await session.flush()

        # ── FAQs ──
        faqs_data = [
            {"id": uuid.uuid4(), "question": "Apa itu Schola?",
             "answer": "Schola adalah platform pengajuan surat akademik daring untuk sivitas IPB.", "created_at": now, "updated_at": now},
            {"id": uuid.uuid4(), "question": "Siapa yang bisa menggunakan Schola?",
             "answer": "Mahasiswa, dosen, dan pejabat IPB dapat menggunakan Schola.", "created_at": now, "updated_at": now},
            {"id": uuid.uuid4(), "question": "Bagaimana cara mengajukan surat?",
             "answer": "Login, pilih template surat, isi data, submit ke verifikator.", "created_at": now, "updated_at": now},
        ]

        from src.infrastructure.models.faq import FAQ
        for f in faqs_data:
            session.add(FAQ(**f))

        try:
            await session.commit()
            return True
        except IntegrityError:
            await session.rollback()
            return False  # another worker beat us to it
