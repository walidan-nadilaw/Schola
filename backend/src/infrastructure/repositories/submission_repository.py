"""Concrete SQLAlchemy implementation of ISubmissionRepository."""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domain.entity.submission import Submission, SubmissionStatus
from src.domain.entity.i_submission_repository import ISubmissionRepository
from src.infrastructure.models.submission import (
    Submission as SubmissionTable,
    SubmissionVerifier as SubmissionVerifierTable,
    Attachment as AttachmentTable,
)


class SubmissionRepository(ISubmissionRepository):
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _query_with_relations(self):
        """Base query that eager-loads verifiers and attachments."""
        return select(SubmissionTable).options(
            selectinload(SubmissionTable.verifiers),
            selectinload(SubmissionTable.attachments),
        )

    async def save(self, entity: Submission) -> Submission:
        row = SubmissionTable.from_domain(entity)
        # Also persist child verifiers and attachments
        for v in entity.verifiers:
            row.verifiers.append(SubmissionVerifierTable.from_domain(v))
        for a in entity.attachments:
            row.attachments.append(AttachmentTable.from_domain(a))
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row, attribute_names=["verifiers", "attachments"])
        return row.to_domain()

    async def update(self, entity: Submission) -> Submission:
        row = SubmissionTable.from_domain(entity)
        merged = await self.db.merge(row)
        await self.db.commit()
        await self.db.refresh(merged, attribute_names=["verifiers", "attachments"])
        return merged.to_domain()

    async def saveAll(self, entities: Iterable[Submission]) -> Iterable[Submission]:
        rows = [SubmissionTable.from_domain(e) for e in entities]
        self.db.add_all(rows)
        await self.db.commit()
        for row in rows:
            await self.db.refresh(row, attribute_names=["verifiers", "attachments"])
        return [row.to_domain() for row in rows]

    async def findById(self, id: str) -> Submission | None:
        result = await self.db.execute(
            self._query_with_relations().where(SubmissionTable.id == id)
        )
        row = result.scalars().first()
        if row is None:
            return None
        return row.to_domain()

    async def existsById(self, id: str) -> bool:
        result = await self.db.execute(
            select(SubmissionTable.id).where(SubmissionTable.id == id)
        )
        return result.scalar_one_or_none() is not None

    async def findAll(self) -> Iterable[Submission]:
        result = await self.db.execute(self._query_with_relations())
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def findAllById(self, ids: Iterable[str]) -> Iterable[Submission]:
        ids_list = list(ids)
        if not ids_list:
            return []
        result = await self.db.execute(
            self._query_with_relations().where(SubmissionTable.id.in_(ids_list))
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def count(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(SubmissionTable)
        )
        return int(result.scalar_one())

    async def deleteById(self, id: str) -> None:
        await self.db.execute(
            delete(SubmissionTable).where(SubmissionTable.id == id)
        )
        await self.db.commit()

    async def delete(self, entity: Submission) -> None:
        await self.deleteById(entity.id)

    async def deleteAllById(self, ids: Iterable[str]) -> None:
        ids_list = list(ids)
        if not ids_list:
            return
        await self.db.execute(
            delete(SubmissionTable).where(SubmissionTable.id.in_(ids_list))
        )
        await self.db.commit()

    async def deleteAll(self, entities: Iterable[Submission] | None = None) -> None:
        if entities is None:
            await self.db.execute(delete(SubmissionTable))
            await self.db.commit()
            return
        entity_ids = [e.id for e in entities]
        await self.deleteAllById(entity_ids)

    # --- Domain-specific queries ---

    async def find_by_submitter_id(self, submitter_id: UUID) -> Iterable[Submission]:
        result = await self.db.execute(
            self._query_with_relations().where(
                SubmissionTable.submitter_id == submitter_id
            )
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def find_by_status(self, status: SubmissionStatus) -> Iterable[Submission]:
        result = await self.db.execute(
            self._query_with_relations().where(
                SubmissionTable.status == status.value
            )
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def find_by_letter_type(self, letter_type: str) -> Iterable[Submission]:
        result = await self.db.execute(
            self._query_with_relations().where(
                SubmissionTable.letter_type == letter_type
            )
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]
