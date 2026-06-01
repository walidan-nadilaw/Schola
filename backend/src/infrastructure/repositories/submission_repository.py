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
        """Base query that eager-loads verifiers, submitter, and attachments."""
        return select(SubmissionTable).options(
            selectinload(SubmissionTable.verifiers).selectinload(SubmissionVerifierTable.verifier),
            selectinload(SubmissionTable.submitter),
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
        # Query again with all relationships eager-loaded to avoid lazy-loading MissingGreenlet errors
        result = await self.db.execute(
            self._query_with_relations().where(SubmissionTable.id == row.id)
        )
        refreshed = result.scalars().unique().first()
        if refreshed is None:
            return row.to_domain()
        return refreshed.to_domain()

    async def update(self, entity: Submission) -> Submission:
        # Delete old verifiers and attachments, then re-insert
        await self.db.execute(
            delete(SubmissionVerifierTable).where(
                SubmissionVerifierTable.submission_id == entity.id
            )
        )
        await self.db.execute(
            delete(AttachmentTable).where(
                AttachmentTable.submission_id == entity.id
            )
        )
        row = SubmissionTable.from_domain(entity)
        for v in entity.verifiers:
            row.verifiers.append(SubmissionVerifierTable.from_domain(v))
        for a in entity.attachments:
            row.attachments.append(AttachmentTable.from_domain(a))
        merged = await self.db.merge(row)
        await self.db.commit()
        # Query again with all relationships eager-loaded to avoid lazy-loading MissingGreenlet errors
        result = await self.db.execute(
            self._query_with_relations().where(SubmissionTable.id == merged.id)
        )
        refreshed = result.scalars().unique().first()
        if refreshed is None:
            return merged.to_domain()
        return refreshed.to_domain()

    async def saveAll(self, entities: Iterable[Submission]) -> Iterable[Submission]:
        rows = [SubmissionTable.from_domain(e) for e in entities]
        self.db.add_all(rows)
        await self.db.commit()
        # Query all again with all relationships eager-loaded to avoid lazy-loading MissingGreenlet errors
        ids = [row.id for row in rows]
        if not ids:
            return []
        result = await self.db.execute(
            self._query_with_relations().where(SubmissionTable.id.in_(ids))
        )
        refreshed_rows = result.scalars().unique().all()
        return [r.to_domain() for r in refreshed_rows]

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
        await self.db.execute(delete(SubmissionTable).where(SubmissionTable.id == id))
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
            self._query_with_relations().where(SubmissionTable.status == status.value)
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

    async def find_pending_verifications(self, verifier_id: UUID) -> list[Submission]:
        """Submissions where this user has a pending verifier row and submission is submitted."""
        result = await self.db.execute(
            self._query_with_relations()
            .join(SubmissionVerifierTable)
            .where(
                SubmissionVerifierTable.verifier_id == verifier_id,
                SubmissionVerifierTable.status == "pending",
                SubmissionTable.status == "submitted",
            )
        )
        rows = result.scalars().unique().all()
        return [row.to_domain() for row in rows]

    async def find_by_verifier_id(self, verifier_id: UUID) -> list[Submission]:
        """Find all submissions where this user is assigned as a verifier (any status)."""
        result = await self.db.execute(
            self._query_with_relations()
            .join(SubmissionVerifierTable)
            .where(SubmissionVerifierTable.verifier_id == verifier_id)
        )
        rows = result.scalars().unique().all()
        return [row.to_domain() for row in rows]

    async def update_verifier(self, verifier) -> object:
        """Persist changes to a single submission verifier row."""
        row = SubmissionVerifierTable.from_domain(verifier)
        merged = await self.db.merge(row)
        await self.db.commit()
        # Query again with nested verifier relationship eager-loaded to avoid lazy loading
        result = await self.db.execute(
            select(SubmissionVerifierTable)
            .options(selectinload(SubmissionVerifierTable.verifier))
            .where(SubmissionVerifierTable.id == merged.id)
        )
        refreshed = result.scalars().unique().first()
        if refreshed is None:
            return merged.to_domain()
        return refreshed.to_domain()

    async def count_by_status(
        self,
        submitter_id: UUID | None = None,
        verifier_id: UUID | None = None,
    ) -> dict[str, int]:
        """Return {status: count} with optional filters (OR combined)."""
        from sqlalchemy import or_

        query = select(SubmissionTable.status, func.count(func.distinct(SubmissionTable.id)))
        if verifier_id:
            query = query.outerjoin(SubmissionVerifierTable)
        conditions = []
        if submitter_id:
            conditions.append(SubmissionTable.submitter_id == submitter_id)
        if verifier_id:
            conditions.append(SubmissionVerifierTable.verifier_id == verifier_id)
        if conditions:
            query = query.where(or_(*conditions))
        query = query.group_by(SubmissionTable.status)

        result = await self.db.execute(query)
        return {row[0]: row[1] for row in result.all()}

