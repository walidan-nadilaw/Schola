"""Abstract interface for the FormTemplate repository."""

from abc import abstractmethod
from collections.abc import Iterable
from uuid import UUID

from src.domain.entity.template import FormTemplate
from src.infrastructure.repositories.repository import IRepository


class IFormTemplateRepository(IRepository[FormTemplate, UUID]):
    """Port for form template persistence with additional query methods."""

    @abstractmethod
    async def update(self, entity: FormTemplate) -> FormTemplate:
        """Persist changes to an existing template."""
        pass

    @abstractmethod
    async def find_by_letter_type(self, letter_type: str) -> Iterable[FormTemplate]:
        """Find all templates for a specific letter type."""
        pass

    @abstractmethod
    async def find_active(self) -> Iterable[FormTemplate]:
        """Find all active templates."""
        pass
