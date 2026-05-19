"""
routers/files.py — File upload, download, and delete endpoints.
Size/type constraints read from config (not hardcoded).
"""
import os
import shutil
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models import Attachment, Submission, User

router = APIRouter(prefix="/files", tags=["File Attachments"])

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    file: UploadFile = File(...),
    submission_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a supporting document (PDF, image, ZIP) for a submission."""
    if file.content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(400, "Tipe berkas tidak didukung. Hanya menerima PDF, JPG, PNG, atau ZIP.")

    # Validate size without loading entire file into memory
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(400, f"Ukuran berkas melebihi batas {settings.MAX_FILE_SIZE_BYTES // (1024*1024)} MB.")

    # Optional: validate submission exists before saving
    if submission_id:
        sub = db.query(Submission).filter(Submission.id == submission_id).first()
        if not sub:
            raise HTTPException(404, "Surat pengajuan tujuan tidak ditemukan")

    ext = os.path.splitext(file.filename)[1]
    secure_name = f"{uuid.uuid4()}{ext}"
    target = os.path.join(UPLOAD_DIR, secure_name)

    try:
        with open(target, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
    except Exception as e:
        raise HTTPException(500, f"Gagal menyimpan berkas: {str(e)}")

    attachment = Attachment(
        submission_id=submission_id,
        file_name=file.filename,
        file_size=file_size,
        file_type=file.content_type,
        file_path=secure_name,
        uploaded_by=current_user.id,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return {
        "id": str(attachment.id),
        "file_name": attachment.file_name,
        "file_size": attachment.file_size,
        "file_type": attachment.file_type,
        "file_path": f"/api/files/download/{attachment.file_path}",
    }


@router.get("/download/{filename}")
def download_attachment(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stream a file from the uploads directory with authorization check."""
    # Basic path traversal guard
    safe_name = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    if not os.path.exists(file_path):
        raise HTTPException(404, "Berkas tidak ditemukan di server")

    att = db.query(Attachment).filter(Attachment.file_path == safe_name).first()
    if not att:
        raise HTTPException(404, "Metadata berkas tidak ditemukan")

    role = current_user.role.lower()
    if role != "admin":
        # Check if the user is the uploader OR the submitter of the associated submission
        is_owner_or_submitter = (
            att.uploaded_by == current_user.id or
            (att.submission and att.submission.submitter_id == current_user.id)
        )
        if not is_owner_or_submitter:
            # Check if they are an assigned verifier for the submission
            from ..models import SubmissionVerifier
            assigned = db.query(SubmissionVerifier).filter(
                SubmissionVerifier.submission_id == att.submission_id,
                SubmissionVerifier.verifier_id == current_user.id,
            ).first()
            if not assigned:
                raise HTTPException(403, "Anda tidak memiliki hak akses untuk berkas ini")

    return FileResponse(path=file_path, media_type=att.file_type, filename=att.file_name)


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a file attachment. Only the uploader or admin may delete."""
    att = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not att:
        raise HTTPException(404, "Berkas tidak ditemukan")

    role = current_user.role.lower()
    if role != "admin" and att.uploaded_by != current_user.id:
        raise HTTPException(403, "Anda tidak diizinkan menghapus berkas ini")

    # Remove physical file
    file_path = os.path.join(UPLOAD_DIR, att.file_path)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(att)
    db.commit()
