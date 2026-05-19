"""
routers/faqs.py — FAQ CRUD (admin only for mutations).
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import RoleChecker, get_current_user
from ..database import get_db
from ..models import FAQ, User
from ..schemas import FAQCreateSchema, FAQResponseSchema

router = APIRouter(prefix="/faqs", tags=["Frequently Asked Questions"])


@router.get("/", response_model=List[FAQResponseSchema])
def get_faqs(db: Session = Depends(get_db)):
    """List all FAQs (public, no auth required)."""
    return db.query(FAQ).order_by(FAQ.created_at.asc()).all()


@router.get("/{faq_id}", response_model=FAQResponseSchema)
def get_faq(faq_id: str, db: Session = Depends(get_db)):
    """Get a single FAQ by UUID."""
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(404, "FAQ tidak ditemukan")
    return faq


@router.post("/", response_model=FAQResponseSchema, status_code=status.HTTP_201_CREATED)
def create_faq(
    payload: FAQCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
):
    """(Admin only) Create a new FAQ."""
    faq = FAQ(
        question=payload.question,
        answer=payload.answer,
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq


@router.put("/{faq_id}", response_model=FAQResponseSchema)
def update_faq(
    faq_id: str,
    payload: FAQCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
):
    """(Admin only) Update an existing FAQ."""
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(404, "FAQ tidak ditemukan")
    faq.question = payload.question
    faq.answer = payload.answer
    db.commit()
    db.refresh(faq)
    return faq


@router.delete("/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faq(
    faq_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
):
    """(Admin only) Delete an FAQ."""
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(404, "FAQ tidak ditemukan")
    db.delete(faq)
    db.commit()
