"""Local filesystem storage — fallback when R2 is not configured."""

import os
import shutil
import uuid

from src.application.i_storage_service import IStorageService, StoredFile
from src.core.config import settings

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"
)


class LocalStorageService(IStorageService):
    """File storage backed by the local filesystem (dev fallback)."""

    @property
    def is_local(self) -> bool:
        return True

    def __init__(self) -> None:
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    async def upload(
        self,
        file_data: bytes,
        file_name: str,
        content_type: str,
        folder: str = "",
    ) -> StoredFile:
        key = f"{folder}/{file_name}" if folder else file_name
        target = os.path.join(UPLOAD_DIR, key)
        os.makedirs(os.path.dirname(target), exist_ok=True)

        with open(target, "wb") as f:
            f.write(file_data)

        file_url = f"{settings.BASE_URL or 'http://localhost:8000'}/files/download/{key}"
        return StoredFile(
            file_path=key,
            file_url=file_url,
            file_size=len(file_data),
            content_type=content_type,
        )

    async def download(self, file_path: str) -> bytes:
        target = os.path.join(UPLOAD_DIR, file_path)
        if not os.path.exists(target):
            raise FileNotFoundError(file_path)
        with open(target, "rb") as f:
            return f.read()

    async def delete(self, file_path: str) -> None:
        target = os.path.join(UPLOAD_DIR, file_path)
        if os.path.exists(target):
            os.remove(target)

    async def get_url(self, file_path: str) -> str:
        return f"{settings.BASE_URL or 'http://localhost:8000'}/files/download/{file_path}"
