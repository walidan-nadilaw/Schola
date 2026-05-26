"""FastAPI dependency that provides a concrete IStorageService."""

from src.application.i_storage_service import IStorageService
from src.core.config import settings
from src.infrastructure.services.local_storage_service import LocalStorageService
from src.infrastructure.services.r2_storage_service import R2StorageService


def get_storage_service() -> IStorageService:
    """Factory for the configured storage backend.

    Respects ``FACTORY_STORAGE_TYPE`` from env:
    - ``"r2"`` → Cloudflare R2
    - anything else (including empty / unset) → local filesystem
    """
    if settings.FACTORY_STORAGE_TYPE == "r2":
        if not settings.R2_ACCOUNT_ID or not settings.R2_ACCESS_KEY or not settings.R2_SECRET_KEY:
            raise RuntimeError(
                "FACTORY_STORAGE_TYPE=r2 but R2_ACCOUNT_ID, R2_ACCESS_KEY, "
                "and R2_SECRET_KEY must all be set."
            )
        return R2StorageService()
    return LocalStorageService()
