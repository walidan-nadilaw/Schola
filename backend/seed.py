import os
import sys
import bcrypt
from sqlalchemy.orm import Session

# Add current path to import app correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User, FormTemplate, Submission, SubmissionVerifier, Attachment, Notification, ActivityLog

def hash_password(password: str) -> str:
    # Hash password using bcrypt directly
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_database():
    print("Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables initialized successfully.")

    db: Session = SessionLocal()
    try:
        print("Cleaning up existing database records to prevent duplicate key violations...")
        # Clean existing tables in correct order of dependency
        db.query(ActivityLog).delete()
        db.query(Notification).delete()
        db.query(Attachment).delete()
        db.query(SubmissionVerifier).delete()
        db.query(Submission).delete()
        db.query(FormTemplate).delete()
        db.query(User).delete()
        db.commit()
        print("Cleanup completed.")

        print("Seeding Clean Database Users (user1-user5, admin)...")

        # ─── ADMIN ───
        admin = User(
            email="admin@ipb.ac.id",
            password_hash=hash_password("admin123"),
            name="Administrator",
            role="admin",
            department="Administrasi Sistem",
            nip="198006152008022002",
            is_active=True,
            email_verified=True
        )
        db.add(admin)

        # ─── USER 1 ───
        user1 = User(
            email="user1@apps.ipb.ac.id",
            password_hash=hash_password("user123"),
            name="User Satu",
            role="mahasiswa",
            department="Ilmu Komputer",
            nim="G64180001",
            fakultas="FMIPA",
            program="S1 Ilmu Komputer",
            semester=6,
            is_active=True,
            email_verified=True
        )
        db.add(user1)

        # ─── USER 2 ───
        user2 = User(
            email="user2@apps.ipb.ac.id",
            password_hash=hash_password("user123"),
            name="User Dua",
            role="mahasiswa",
            department="Sains Data",
            nim="G64180002",
            fakultas="FMIPA",
            program="S1 Sains Data",
            semester=4,
            is_active=True,
            email_verified=True
        )
        db.add(user2)

        # ─── USER 3 ───
        user3 = User(
            email="user3@apps.ipb.ac.id",
            password_hash=hash_password("user123"),
            name="User Tiga",
            role="dosen",
            department="Departemen Ilmu Komputer",
            nip="198503122010121001",
            position="Dosen Pembimbing Akademik",
            is_active=True,
            email_verified=True
        )
        db.add(user3)

        # ─── USER 4 ───
        user4 = User(
            email="user4@apps.ipb.ac.id",
            password_hash=hash_password("user123"),
            name="User Empat",
            role="staff",
            department="Tata Usaha FMIPA",
            nip="199008242015042001",
            position="Kepala Seksi Akademik",
            is_active=True,
            email_verified=True
        )
        db.add(user4)

        # ─── USER 5 ───
        user5 = User(
            email="user5@apps.ipb.ac.id",
            password_hash=hash_password("user123"),
            name="User Lima",
            role="dosen",
            department="Departemen Matematika",
            nip="197804152002121002",
            position="Ketua Departemen",
            is_active=True,
            email_verified=True
        )
        db.add(user5)

        db.commit()
        db.refresh(admin)
        print("Demo users (user1-user5, admin) successfully seeded.")
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during database seeding: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
