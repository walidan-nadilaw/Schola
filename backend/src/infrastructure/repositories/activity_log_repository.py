"""Concrete SQLAlchemy implementation of IActivityLogRepository."""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entity.activity_log import ActivityLog
from src.domain.entity.i_activity_log_repository import IActivityLogRepository
from src.infrastructure.models.activity_log import ActivityLog as ActivityLogTable


class ActivityLogRepository(IActivityLogRepository):
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def save(self, entity: ActivityLog) -> ActivityLog:
        row = ActivityLogTable.from_domain(entity)
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row.to_domain()

    async def update(self, entity: ActivityLog) -> ActivityLog:
        row = ActivityLogTable.from_domain(entity)
        merged = await self.db.merge(row)
        await self.db.commit()
        await self.db.refresh(merged)
        return merged.to_domain()

    async def saveAll(self, entities: Iterable[ActivityLog]) -> Iterable[ActivityLog]:
        rows = [ActivityLogTable.from_domain(e) for e in entities]
        self.db.add_all(rows)
        await self.db.commit()
        for row in rows:
            await self.db.refresh(row)
        return [row.to_domain() for row in rows]

    async def findById(self, id: UUID) -> ActivityLog | None:
        result = await self.db.execute(
            select(ActivityLogTable).where(ActivityLogTable.id == id)
        )
        row = result.scalars().first()
        if row is None:
            return None
        return row.to_domain()

    async def existsById(self, id: UUID) -> bool:
        result = await self.db.execute(
            select(ActivityLogTable.id).where(ActivityLogTable.id == id)
        )
        return result.scalar_one_or_none() is not None

    async def findAll(self) -> Iterable[ActivityLog]:
        result = await self.db.execute(select(ActivityLogTable))
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def findAllById(self, ids: Iterable[UUID]) -> Iterable[ActivityLog]:
        ids_list = list(ids)
        if not ids_list:
            return []
        result = await self.db.execute(
            select(ActivityLogTable).where(ActivityLogTable.id.in_(ids_list))
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def count(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(ActivityLogTable)
        )
        return int(result.scalar_one())

    async def deleteById(self, id: UUID) -> None:
        await self.db.execute(
            delete(ActivityLogTable).where(ActivityLogTable.id == id)
        )
        await self.db.commit()

    async def delete(self, entity: ActivityLog) -> None:
        await self.deleteById(entity.id)

    async def deleteAllById(self, ids: Iterable[UUID]) -> None:
        ids_list = list(ids)
        if not ids_list:
            return
        await self.db.execute(
            delete(ActivityLogTable).where(ActivityLogTable.id.in_(ids_list))
        )
        await self.db.commit()

    async def deleteAll(self, entities: Iterable[ActivityLog] | None = None) -> None:
        if entities is None:
            await self.db.execute(delete(ActivityLogTable))
            await self.db.commit()
            return
        entity_ids = [e.id for e in entities]
        await self.deleteAllById(entity_ids)

    # --- Domain-specific queries ---

    async def find_by_user_id(self, user_id: UUID) -> Iterable[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLogTable).where(ActivityLogTable.user_id == user_id)
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def find_by_submission_id(self, submission_id: str) -> Iterable[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLogTable).where(
                ActivityLogTable.submission_id == submission_id
            )
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def find_by_action_type(self, action_type: str) -> Iterable[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLogTable).where(
                ActivityLogTable.action_type == action_type
            )
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]
