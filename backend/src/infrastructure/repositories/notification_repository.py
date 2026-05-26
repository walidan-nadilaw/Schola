"""Concrete SQLAlchemy implementation of INotificationRepository."""

from collections.abc import Iterable
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entity.notification import Notification
from src.domain.entity.i_notification_repository import INotificationRepository
from src.infrastructure.models.notification import Notification as NotificationTable


class NotificationRepository(INotificationRepository):
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def save(self, entity: Notification) -> Notification:
        row = NotificationTable.from_domain(entity)
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row.to_domain()

    async def update(self, entity: Notification) -> Notification:
        row = NotificationTable.from_domain(entity)
        merged = await self.db.merge(row)
        await self.db.commit()
        await self.db.refresh(merged)
        return merged.to_domain()

    async def saveAll(self, entities: Iterable[Notification]) -> Iterable[Notification]:
        rows = [NotificationTable.from_domain(e) for e in entities]
        self.db.add_all(rows)
        await self.db.commit()
        for row in rows:
            await self.db.refresh(row)
        return [row.to_domain() for row in rows]

    async def findById(self, id: UUID) -> Notification | None:
        result = await self.db.execute(
            select(NotificationTable).where(NotificationTable.id == id)
        )
        row = result.scalars().first()
        if row is None:
            return None
        return row.to_domain()

    async def existsById(self, id: UUID) -> bool:
        result = await self.db.execute(
            select(NotificationTable.id).where(NotificationTable.id == id)
        )
        return result.scalar_one_or_none() is not None

    async def findAll(self) -> Iterable[Notification]:
        result = await self.db.execute(select(NotificationTable))
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def findAllById(self, ids: Iterable[UUID]) -> Iterable[Notification]:
        ids_list = list(ids)
        if not ids_list:
            return []
        result = await self.db.execute(
            select(NotificationTable).where(NotificationTable.id.in_(ids_list))
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def count(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(NotificationTable)
        )
        return int(result.scalar_one())

    async def deleteById(self, id: UUID) -> None:
        await self.db.execute(
            delete(NotificationTable).where(NotificationTable.id == id)
        )
        await self.db.commit()

    async def delete(self, entity: Notification) -> None:
        await self.deleteById(entity.id)

    async def deleteAllById(self, ids: Iterable[UUID]) -> None:
        ids_list = list(ids)
        if not ids_list:
            return
        await self.db.execute(
            delete(NotificationTable).where(NotificationTable.id.in_(ids_list))
        )
        await self.db.commit()

    async def deleteAll(self, entities: Iterable[Notification] | None = None) -> None:
        if entities is None:
            await self.db.execute(delete(NotificationTable))
            await self.db.commit()
            return
        entity_ids = [e.id for e in entities]
        await self.deleteAllById(entity_ids)

    # --- Domain-specific queries ---

    async def find_by_user_id(self, user_id: UUID) -> Iterable[Notification]:
        result = await self.db.execute(
            select(NotificationTable)
            .where(NotificationTable.user_id == user_id)
            .order_by(NotificationTable.created_at.desc())
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def find_unread_by_user_id(self, user_id: UUID) -> Iterable[Notification]:
        result = await self.db.execute(
            select(NotificationTable).where(
                NotificationTable.user_id == user_id,
                NotificationTable.is_read == False,
            )
        )
        rows = result.scalars().all()
        return [row.to_domain() for row in rows]

    async def mark_all_as_read(self, user_id: UUID) -> None:
        await self.db.execute(
            update(NotificationTable)
            .where(
                NotificationTable.user_id == user_id,
                NotificationTable.is_read == False,
            )
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        await self.db.commit()
