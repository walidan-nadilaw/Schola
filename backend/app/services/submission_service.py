"""
services/submission_service.py — Business logic for submission lifecycle.
Routers are thin HTTP controllers; all rules live here.
"""
import datetime
import random
from typing import List, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import Attachment, FormTemplate, Submission, SubmissionVerifier, User
from ..schemas import (
    AttachmentResponseSchema,
    PaginatedSubmissionsResponse,
    PaginationSchema,
    SubmissionCreateSchema,
    SubmissionResponseSchema,
    SubmissionUpdateSchema,
    SubmitterInfoSchema,
    VerifierTimelineSchema,
)


class SubmissionService:
    def __init__(self, db: Session):
        self.db = db

    # ──────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────

    def generate_submission_id(self, template: FormTemplate) -> str:
        """Atomic-safe sequential ID, e.g. SKA/2026/0003."""
        words = template.letter_type.split()
        prefix = (
            "".join(w[0].upper() for w in words if w[0].isalnum())
            if len(words) > 1
            else template.letter_type[:3].upper()
        )
        year = datetime.datetime.now(datetime.timezone.utc).year
        count = (
            self.db.query(func.count(Submission.id))
            .filter(Submission.template_id == template.id)
            .scalar()
            or 0
        )
        for delta in range(10):
            candidate = f"{prefix}/{year}/{count + delta + 1:04d}"
            if not self.db.query(Submission).filter(Submission.id == candidate).first():
                return candidate
        return f"{prefix}/{year}/{count + 1:04d}-{random.randint(10, 99)}"

    def validate_form_fields(self, template_fields, form_data: dict) -> None:
        """Raise 400 if required fields are missing or empty."""
        for field in template_fields:
            fid = field.get("id")
            label = field.get("label")
            if field.get("required", True):
                if fid not in form_data:
                    raise HTTPException(400, f"Field '{label}' wajib diisi")
                val = form_data.get(fid)
                if val is None or str(val).strip() == "":
                    raise HTTPException(400, f"Field '{label}' tidak boleh kosong")

    def build_response(self, submission: Submission) -> SubmissionResponseSchema:
        """Map ORM Submission → SubmissionResponseSchema."""
        verifiers = [
            VerifierTimelineSchema(
                verifier_id=str(sv.verifier.id),
                verifier_name=sv.verifier.name,
                verifier_role=sv.verifier_role or "verifier",
                verifier_order=sv.verifier_order,
                status=sv.status,
                comment=sv.comment,
                verified_at=sv.verified_at,
                signature_hash=sv.signature_hash,
            )
            for sv in sorted(submission.verifiers, key=lambda x: x.verifier_order or 0)
        ]
        attachments = [
            AttachmentResponseSchema(
                id=str(a.id),
                file_name=a.file_name,
                file_size=a.file_size,
                file_type=a.file_type,
                file_path=a.file_path,
                uploaded_at=a.uploaded_at,
            )
            for a in submission.attachments
        ]
        return SubmissionResponseSchema(
            id=submission.id,
            template_id=str(submission.template_id),
            letter_type=submission.letter_type,
            form_data=submission.form_data,
            status=submission.status,
            is_ordered_verification=submission.is_ordered_verification,
            submitted_at=submission.submitted_at,
            verified_at=submission.verified_at,
            rejection_reason=submission.rejection_reason,
            created_at=submission.created_at,
            updated_at=submission.updated_at,
            submitter=SubmitterInfoSchema(
                id=str(submission.submitter.id),
                name=submission.submitter.name,
                email=submission.submitter.email,
                nim=submission.submitter.nim,
                fakultas=submission.submitter.fakultas,
                program=submission.submitter.program,
                semester=submission.submitter.semester,
            ),
            verifiers=verifiers,
            attachments=attachments,
        )

    def _assign_verifiers(self, submission_id: str, verifier_ids: List[str]) -> None:
        """Delete existing verifiers and re-assign a new ordered list."""
        self.db.query(SubmissionVerifier).filter(
            SubmissionVerifier.submission_id == submission_id
        ).delete()
        for i, uid in enumerate(verifier_ids):
            verifier = self.db.query(User).filter(User.id == uid).first()
            if not verifier:
                raise HTTPException(400, f"Verifikator dengan ID {uid} tidak valid")
            self.db.add(
                SubmissionVerifier(
                    submission_id=submission_id,
                    verifier_id=verifier.id,
                    verifier_order=i + 1,
                    verifier_role="signer" if i == len(verifier_ids) - 1 else "verifier",
                    status="pending",
                )
            )

    # ──────────────────────────────────────────────
    # CRUD operations
    # ──────────────────────────────────────────────

    def create(
        self, payload: SubmissionCreateSchema, current_user: User
    ) -> SubmissionResponseSchema:
        if current_user.role.lower() == "admin":
            raise HTTPException(403, "Admin tidak dapat membuat pengajuan surat")

        template = self.db.query(FormTemplate).filter(
            FormTemplate.id == payload.template_id, FormTemplate.is_active == True
        ).first()
        if not template:
            raise HTTPException(404, "Template surat tidak ditemukan atau tidak aktif")

        if payload.status == "pending":
            self.validate_form_fields(template.fields, payload.form_data)
            if not payload.verifiers:
                raise HTTPException(400, "Minimal satu verifikator harus dipilih")

        now = datetime.datetime.now(datetime.timezone.utc)
        sub_id = self.generate_submission_id(template)
        submission = Submission(
            id=sub_id,
            template_id=template.id,
            submitter_id=current_user.id,
            letter_type=template.letter_type,
            form_data=payload.form_data,
            status=payload.status,
            is_ordered_verification=payload.is_ordered_verification,
            submitted_at=now if payload.status == "pending" else None,
        )
        self.db.add(submission)
        self.db.flush()

        if payload.status == "pending":
            self._assign_verifiers(sub_id, payload.verifiers)

        self.db.commit()
        self.db.refresh(submission)
        return self.build_response(submission)

    def get_by_id(
        self, submission_id: str, current_user: User
    ) -> SubmissionResponseSchema:
        submission = self.db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            raise HTTPException(404, "Surat pengajuan tidak ditemukan")

        role = current_user.role.lower()
        if role == "admin":
            # Admin has full permission to read any submission
            pass
        elif submission.submitter_id == current_user.id:
            # Submitter always has access to their own
            pass
        else:
            # Anyone else must be an assigned verifier
            assigned = self.db.query(SubmissionVerifier).filter(
                SubmissionVerifier.submission_id == submission_id,
                SubmissionVerifier.verifier_id == current_user.id,
            ).first()
            if not assigned:
                raise HTTPException(403, "Anda tidak memiliki akses ke pengajuan surat ini")

        return self.build_response(submission)

    def list_paginated(
        self,
        current_user: User,
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> PaginatedSubmissionsResponse:
        query = self.db.query(Submission)
        role = current_user.role.lower()

        if role == "admin":
            # Admin sees all submissions
            pass
        else:
            # Non-admin sees what they submitted only
            query = query.filter(Submission.submitter_id == current_user.id)

        if status_filter:
            query = query.filter(Submission.status == status_filter.lower())

        total = query.count()
        submissions = (
            query.order_by(Submission.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        import math
        return PaginatedSubmissionsResponse(
            data=[self.build_response(s) for s in submissions],
            pagination=PaginationSchema(
                currentPage=page,
                totalPages=math.ceil(total / limit) if limit else 1,
                totalItems=total,
                itemsPerPage=limit,
            ),
        )

    def update(
        self, submission_id: str, payload: SubmissionUpdateSchema, current_user: User
    ) -> SubmissionResponseSchema:
        submission = self.db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            raise HTTPException(404, "Surat pengajuan tidak ditemukan")
        if submission.submitter_id != current_user.id:
            raise HTTPException(403, "Hanya pemohon yang dapat mengubah data")
        if submission.status not in ["draft", "rejected"]:
            raise HTTPException(400, "Pengajuan yang sedang diproses tidak dapat diubah")

        submission.form_data = payload.form_data
        submission.is_ordered_verification = payload.is_ordered_verification
        submission.updated_at = datetime.datetime.now(datetime.timezone.utc)

        if submission.status == "rejected":
            # Reset to draft and clear stale verifiers
            submission.status = "draft"
            submission.rejection_reason = None
            submission.rejected_by = None
            submission.rejected_at = None
            self.db.query(SubmissionVerifier).filter(
                SubmissionVerifier.submission_id == submission_id
            ).delete()

        self.db.commit()
        return self.build_response(submission)

    def delete(self, submission_id: str, current_user: User) -> None:
        submission = self.db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            raise HTTPException(404, "Surat pengajuan tidak ditemukan")
        if submission.submitter_id != current_user.id:
            raise HTTPException(403, "Hanya pemohon yang dapat menghapus pengajuan")
        if submission.status != "draft":
            raise HTTPException(400, "Hanya draf surat yang dapat dihapus")
        self.db.delete(submission)
        self.db.commit()

    def finalize(
        self, submission_id: str, verifier_ids: List[str], current_user: User
    ) -> SubmissionResponseSchema:
        submission = self.db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            raise HTTPException(404, "Surat pengajuan tidak ditemukan")
        if submission.submitter_id != current_user.id:
            raise HTTPException(403, "Hanya pemohon yang dapat memfinalisasi pengajuan")
        if submission.status != "draft":
            raise HTTPException(400, "Hanya draf surat yang dapat difinalisasi")
        if not verifier_ids:
            raise HTTPException(400, "Minimal satu verifikator harus dipilih")

        self.validate_form_fields(submission.template.fields, submission.form_data)
        self._assign_verifiers(submission_id, verifier_ids)

        submission.status = "pending"
        submission.submitted_at = datetime.datetime.now(datetime.timezone.utc)
        self.db.commit()
        self.db.refresh(submission)
        return self.build_response(submission)
