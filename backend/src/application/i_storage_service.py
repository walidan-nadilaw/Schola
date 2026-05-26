"""Abstract interface for file storage."""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class StoredFile:
    """Metadata returned after a successful upload."""

    file_path: str
    file_url: str
    file_size: int
    content_type: str


class IStorageService(ABC):
    """Port for file upload / download / delete operations."""

    @abstractmethod
    async def upload(
        self,
        file_data: bytes,
        file_name: str,
        content_type: str,
        folder: str = "",
    ) -> StoredFile:
        """Upload a file and return its stored metadata."""

    @abstractmethod
    async def delete(self, file_path: str) -> None:
        """Delete a file by its stored path."""

    @abstractmethod
    async def get_url(self, file_path: str) -> str:
        """Get a public or pre-signed URL for a stored file."""

    @property
    def is_local(self) -> bool:
        """Whether files are stored on the local filesystem."""
        return False
