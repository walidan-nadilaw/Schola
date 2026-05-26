"""Pydantic schemas for the FAQs feature."""

from datetime import datetime

from pydantic import BaseModel


class FAQCreateRequest(BaseModel):
    question: str
    answer: str


class FAQResponse(BaseModel):
    id: str
    question: str
    answer: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
