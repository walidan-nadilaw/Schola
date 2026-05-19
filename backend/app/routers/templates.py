"""
routers/templates.py — Form template CRUD (admin only for mutations).
Uses centralized schemas from schemas.py.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import RoleChecker, get_current_user
from ..database import get_db
from ..models import FormTemplate, User
from ..schemas import FormTemplateCreateSchema, FormTemplateResponseSchema

router = APIRouter(prefix="/templates", tags=["Form Templates"])


@router.get("/", response_model=List[FormTemplateResponseSchema])
def get_templates(db: Session = Depends(get_db)):
    """List all active form templates (public, no auth required)."""
    return db.query(FormTemplate).filter(FormTemplate.is_active == True).all()


@router.get("/{template_id}", response_model=FormTemplateResponseSchema)
def get_template(template_id: str, db: Session = Depends(get_db)):
    """Get a single template by UUID."""
    tmpl = db.query(FormTemplate).filter(FormTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(404, "Template formulir tidak ditemukan")
    return tmpl


@router.post("/", response_model=FormTemplateResponseSchema, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: FormTemplateCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
):
    """(Admin only) Create a new dynamic letter template."""
    tmpl = FormTemplate(
        letter_type=payload.letter_type,
        description=payload.description,
        fields=[f.dict() for f in payload.fields],
        is_active=payload.is_active,
        created_by=current_user.id,
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return tmpl


@router.put("/{template_id}", response_model=FormTemplateResponseSchema)
def update_template(
    template_id: str,
    payload: FormTemplateCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
):
    """(Admin only) Update an existing template."""
    tmpl = db.query(FormTemplate).filter(FormTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(404, "Template formulir tidak ditemukan")
    tmpl.letter_type = payload.letter_type
    tmpl.description = payload.description
    tmpl.fields = [f.dict() for f in payload.fields]
    tmpl.is_active = payload.is_active
    db.commit()
    db.refresh(tmpl)
    return tmpl


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
):
    """(Admin only) Soft-delete a template (sets is_active=False)."""
    tmpl = db.query(FormTemplate).filter(FormTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(404, "Template formulir tidak ditemukan")
    tmpl.is_active = False
    db.commit()
