"""Pydantic schemas for the Files feature."""

from datetime import datetime

from pydantic import BaseModel


class UploadFileResponse(BaseModel):
    id: str
    file_name: str
    file_size: int
    file_type: str
    file_path: str
    file_url: str


class FileInfoResponse(BaseModel):
    id: str
    file_name: str
    file_size: int
    file_type: str
    file_path: str
    submission_id: str | None = None
    uploaded_by: str | None = None
    uploaded_at: datetime | None = None
