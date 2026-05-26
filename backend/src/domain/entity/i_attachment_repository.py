"""Abstract interface for the Attachment repository."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entity.submission import Attachment
from src.infrastructure.repositories.repository import IRepository


class IAttachmentRepository(IRepository[Attachment, UUID]):
    """Port for attachment persistence with additional query methods."""

    @abstractmethod
    async def update(self, entity: Attachment) -> Attachment:
        """Persist changes to an existing attachment."""
        pass

    @abstractmethod
    async def find_by_file_path(self, file_path: str) -> Attachment | None:
        """Find an attachment by its stored file path."""
        pass

    @abstractmethod
    async def find_by_submission_id(self, submission_id: str) -> list[Attachment]:
        """Find all attachments linked to a submission."""
        pass
