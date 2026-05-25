"""Abstract interface for the FAQ repository."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entity.faq import FAQ
from src.infrastructure.repositories.repository import IRepository


class IFAQRepository(IRepository[FAQ, UUID]):
    """Port for FAQ persistence with additional query methods."""

    @abstractmethod
    async def update(self, entity: FAQ) -> FAQ:
        """Persist changes to an existing FAQ."""
        pass
