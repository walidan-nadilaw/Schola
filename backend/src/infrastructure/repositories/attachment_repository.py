"""Concrete SQLAlchemy implementation of IAttachmentRepository."""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entity.submission import Attachment
from src.domain.entity.i_attachment_repository import IAttachmentRepository
from src.infrastructure.models.submission import Attachment as AttachmentTable


class AttachmentRepository(IAttachmentRepository):
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def save(self, entity: Attachment) -> Attachment:
        row = AttachmentTable.from_domain(entity)
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row.to_domain()

    async def update(self, entity: Attachment) -> Attachment:
        row = AttachmentTable.from_domain(entity)
        merged = await self.db.merge(row)
        await self.db.commit()
        await self.db.refresh(merged)
        return merged.to_domain()

    async def saveAll(self, entities: Iterable[Attachment]) -> Iterable[Attachment]:
        rows = [AttachmentTable.from_domain(e) for e in entities]
        self.db.add_all(rows)
        await self.db.commit()
        for row in rows:
            await self.db.refresh(row)
        return [row.to_domain() for row in rows]

    async def findById(self, id: UUID) -> Attachment | None:
        result = await self.db.execute(
            select(AttachmentTable).where(AttachmentTable.id == id)
        )
        row = result.scalars().first()
        if row is None:
            return None
        return row.to_domain()

    async def existsById(self, id: UUID) -> bool:
        result = await self.db.execute(
            select(AttachmentTable.id).where(AttachmentTable.id == id)
        )
        return result.scalar_one_or_none() is not None

    async def findAll(self) -> Iterable[Attachment]:
        result = await self.db.execute(select(AttachmentTable))
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def findAllById(self, ids: Iterable[UUID]) -> Iterable[Attachment]:
        ids_list = list(ids)
        if not ids_list:
            return []
        result = await self.db.execute(
            select(AttachmentTable).where(AttachmentTable.id.in_(ids_list))
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def count(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(AttachmentTable)
        )
        return int(result.scalar_one())

    async def deleteById(self, id: UUID) -> None:
        await self.db.execute(
            delete(AttachmentTable).where(AttachmentTable.id == id)
        )
        await self.db.commit()

    async def delete(self, entity: Attachment) -> None:
        await self.deleteById(entity.id)

    async def deleteAllById(self, ids: Iterable[UUID]) -> None:
        ids_list = list(ids)
        if not ids_list:
            return
        await self.db.execute(
            delete(AttachmentTable).where(AttachmentTable.id.in_(ids_list))
        )
        await self.db.commit()

    async def deleteAll(self, entities: Iterable[Attachment] | None = None) -> None:
        if entities is None:
            await self.db.execute(delete(AttachmentTable))
            await self.db.commit()
            return
        await self.deleteAllById([e.id for e in entities])

    async def find_by_file_path(self, file_path: str) -> Attachment | None:
        result = await self.db.execute(
            select(AttachmentTable).where(AttachmentTable.file_path == file_path)
        )
        row = result.scalars().first()
        if row is None:
            return None
        return row.to_domain()

    async def find_by_submission_id(self, submission_id: str) -> list[Attachment]:
        result = await self.db.execute(
            select(AttachmentTable).where(
                AttachmentTable.submission_id == submission_id
            )
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]
