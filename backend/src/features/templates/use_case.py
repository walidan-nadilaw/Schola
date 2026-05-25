"""Use cases for the Templates feature."""

from typing import Any
from uuid import UUID

from src.api.exceptions import NotFoundException
from src.domain.entity.i_template_repository import IFormTemplateRepository
from src.domain.entity.template import FormTemplate


class ListTemplatesUseCase:
    """List all active templates."""

    def __init__(self, repo: IFormTemplateRepository) -> None:
        self._repo = repo

    async def execute(self, active_only: bool = True) -> list[FormTemplate]:
        if active_only:
            return list(await self._repo.find_active())
        return list(await self._repo.findAll())


class GetTemplateUseCase:
    """Get a single template by ID."""

    def __init__(self, repo: IFormTemplateRepository) -> None:
        self._repo = repo

    async def execute(self, template_id: UUID) -> FormTemplate:
        template = await self._repo.findById(template_id)
        if template is None:
            raise NotFoundException("Template tidak ditemukan")
        return template


class CreateTemplateUseCase:
    """Create a new form template."""

    def __init__(self, repo: IFormTemplateRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        letter_type: str,
        fields: dict[str, Any] | list[Any],
        description: str | None = None,
        created_by: UUID | None = None,
    ) -> FormTemplate:
        template = FormTemplate.New(
            letter_type=letter_type,
            fields=fields,
            description=description,
            created_by=created_by,
        )
        return await self._repo.save(template)


class UpdateTemplateUseCase:
    """Update an existing template."""

    def __init__(self, repo: IFormTemplateRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        template_id: UUID,
        letter_type: str | None = None,
        description: str | None = None,
        fields: dict[str, Any] | list[Any] | None = None,
        is_active: bool | None = None,
    ) -> FormTemplate:
        template = await self._repo.findById(template_id)
        if template is None:
            raise NotFoundException("Template tidak ditemukan")

        if letter_type is not None:
            template.letter_type = letter_type
        if description is not None:
            template.description = description
        if fields is not None:
            template.fields = fields
        if is_active is not None:
            if is_active:
                template.activate()
            else:
                template.deactivate()

        return await self._repo.update(template)


class DeleteTemplateUseCase:
    """Delete a template."""

    def __init__(self, repo: IFormTemplateRepository) -> None:
        self._repo = repo

    async def execute(self, template_id: UUID) -> None:
        exists = await self._repo.existsById(template_id)
        if not exists:
            raise NotFoundException("Template tidak ditemukan")
        await self._repo.deleteById(template_id)
