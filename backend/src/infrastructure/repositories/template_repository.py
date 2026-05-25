"""Concrete SQLAlchemy implementation of IFormTemplateRepository."""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entity.template import FormTemplate
from src.domain.entity.i_template_repository import IFormTemplateRepository
from src.infrastructure.models.template import FormTemplate as FormTemplateTable


class FormTemplateRepository(IFormTemplateRepository):
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def save(self, entity: FormTemplate) -> FormTemplate:
        row = FormTemplateTable.from_domain(entity)
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row.to_domain()

    async def update(self, entity: FormTemplate) -> FormTemplate:
        row = FormTemplateTable.from_domain(entity)
        merged = await self.db.merge(row)
        await self.db.commit()
        await self.db.refresh(merged)
        return merged.to_domain()

    async def saveAll(self, entities: Iterable[FormTemplate]) -> Iterable[FormTemplate]:
        rows = [FormTemplateTable.from_domain(e) for e in entities]
        self.db.add_all(rows)
        await self.db.commit()
        for row in rows:
            await self.db.refresh(row)
        return [row.to_domain() for row in rows]

    async def findById(self, id: UUID) -> FormTemplate | None:
        result = await self.db.execute(
            select(FormTemplateTable).where(FormTemplateTable.id == id)
        )
        row = result.scalars().first()
        if row is None:
            return None
        return row.to_domain()

    async def existsById(self, id: UUID) -> bool:
        result = await self.db.execute(
            select(FormTemplateTable.id).where(FormTemplateTable.id == id)
        )
        return result.scalar_one_or_none() is not None

    async def findAll(self) -> Iterable[FormTemplate]:
        result = await self.db.execute(select(FormTemplateTable))
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def findAllById(self, ids: Iterable[UUID]) -> Iterable[FormTemplate]:
        ids_list = list(ids)
        if not ids_list:
            return []
        result = await self.db.execute(
            select(FormTemplateTable).where(FormTemplateTable.id.in_(ids_list))
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def count(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(FormTemplateTable)
        )
        return int(result.scalar_one())

    async def deleteById(self, id: UUID) -> None:
        await self.db.execute(
            delete(FormTemplateTable).where(FormTemplateTable.id == id)
        )
        await self.db.commit()

    async def delete(self, entity: FormTemplate) -> None:
        await self.deleteById(entity.id)

    async def deleteAllById(self, ids: Iterable[UUID]) -> None:
        ids_list = list(ids)
        if not ids_list:
            return
        await self.db.execute(
            delete(FormTemplateTable).where(FormTemplateTable.id.in_(ids_list))
        )
        await self.db.commit()

    async def deleteAll(self, entities: Iterable[FormTemplate] | None = None) -> None:
        if entities is None:
            await self.db.execute(delete(FormTemplateTable))
            await self.db.commit()
            return
        entity_ids = [e.id for e in entities]
        await self.deleteAllById(entity_ids)

    # --- Domain-specific queries ---

    async def find_by_letter_type(self, letter_type: str) -> Iterable[FormTemplate]:
        result = await self.db.execute(
            select(FormTemplateTable).where(
                FormTemplateTable.letter_type == letter_type
            )
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def find_active(self) -> Iterable[FormTemplate]:
        result = await self.db.execute(
            select(FormTemplateTable).where(FormTemplateTable.is_active == True)
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]
