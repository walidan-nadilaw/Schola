"""Concrete SQLAlchemy implementation of IFAQRepository."""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entity.faq import FAQ
from src.domain.entity.i_faq_repository import IFAQRepository
from src.infrastructure.models.faq import FAQ as FAQTable


class FAQRepository(IFAQRepository):
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def save(self, entity: FAQ) -> FAQ:
        row = FAQTable.from_domain(entity)
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row.to_domain()

    async def update(self, entity: FAQ) -> FAQ:
        row = FAQTable.from_domain(entity)
        merged = await self.db.merge(row)
        await self.db.commit()
        await self.db.refresh(merged)
        return merged.to_domain()

    async def saveAll(self, entities: Iterable[FAQ]) -> Iterable[FAQ]:
        rows = [FAQTable.from_domain(e) for e in entities]
        self.db.add_all(rows)
        await self.db.commit()
        for row in rows:
            await self.db.refresh(row)
        return [row.to_domain() for row in rows]

    async def findById(self, id: UUID) -> FAQ | None:
        result = await self.db.execute(select(FAQTable).where(FAQTable.id == id))
        row = result.scalars().first()
        if row is None:
            return None
        return row.to_domain()

    async def existsById(self, id: UUID) -> bool:
        result = await self.db.execute(select(FAQTable.id).where(FAQTable.id == id))
        return result.scalar_one_or_none() is not None

    async def findAll(self) -> Iterable[FAQ]:
        result = await self.db.execute(select(FAQTable))
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def findAllById(self, ids: Iterable[UUID]) -> Iterable[FAQ]:
        ids_list = list(ids)
        if not ids_list:
            return []
        result = await self.db.execute(
            select(FAQTable).where(FAQTable.id.in_(ids_list))
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def count(self) -> int:
        result = await self.db.execute(select(func.count()).select_from(FAQTable))
        return int(result.scalar_one())

    async def deleteById(self, id: UUID) -> None:
        await self.db.execute(delete(FAQTable).where(FAQTable.id == id))
        await self.db.commit()

    async def delete(self, entity: FAQ) -> None:
        await self.deleteById(entity.id)

    async def deleteAllById(self, ids: Iterable[UUID]) -> None:
        ids_list = list(ids)
        if not ids_list:
            return
        await self.db.execute(delete(FAQTable).where(FAQTable.id.in_(ids_list)))
        await self.db.commit()

    async def deleteAll(self, entities: Iterable[FAQ] | None = None) -> None:
        if entities is None:
            await self.db.execute(delete(FAQTable))
            await self.db.commit()
            return
        entity_ids = [e.id for e in entities]
        await self.deleteAllById(entity_ids)
