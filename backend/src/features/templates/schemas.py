"""Pydantic schemas for the Templates feature."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel


# -- Requests --

class CreateTemplateRequest(BaseModel):
    letter_type: str
    description: str | None = None
    fields: dict[str, Any] | list[Any]


class UpdateTemplateRequest(BaseModel):
    letter_type: str | None = None
    description: str | None = None
    fields: dict[str, Any] | list[Any] | None = None
    is_active: bool | None = None


# -- Responses --

class TemplateResponse(BaseModel):
    id: str
    letter_type: str
    description: str | None = None
    fields: dict[str, Any] | list[Any]
    is_active: bool
    created_by: str | None = None
    created_at: datetime
    updated_at: datetime
