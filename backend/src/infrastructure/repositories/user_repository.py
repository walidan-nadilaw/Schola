"""Concrete SQLAlchemy implementation of IUserRepository."""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entity.user import User
from src.domain.entity.i_user_repository import IUserRepository
from src.infrastructure.models.user import User as UserTable


class UserRepository(IUserRepository):
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def find_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(UserTable).where(UserTable.email == email)
        )
        row = result.scalars().first()
        if row is None:
            return None
        return row.to_user()

    async def save(self, entity: User) -> User:
        row = UserTable.from_domain(entity)
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row.to_user()

    async def update(self, entity: User) -> User:
        row = UserTable.from_domain(entity)
        merged = await self.db.merge(row)
        await self.db.commit()
        await self.db.refresh(merged)
        return merged.to_user()

    async def saveAll(self, entities: Iterable[User]) -> Iterable[User]:
        rows = [UserTable.from_domain(e) for e in entities]
        self.db.add_all(rows)
        await self.db.commit()
        for row in rows:
            await self.db.refresh(row)
        return [row.to_user() for row in rows]

    async def findById(self, id: UUID) -> User | None:
        result = await self.db.execute(select(UserTable).where(UserTable.id == id))
        row = result.scalars().first()
        if row is None:
            return None
        return row.to_user()

    async def existsById(self, id: UUID) -> bool:
        result = await self.db.execute(select(UserTable.id).where(UserTable.id == id))
        return result.scalar_one_or_none() is not None

    async def findAll(self) -> Iterable[User]:
        result = await self.db.execute(select(UserTable))
        rows = result.scalars().all()
        return [row.to_user() for row in rows]

    async def findAllById(self, ids: Iterable[UUID]) -> Iterable[User]:
        ids_list = list(ids)
        if not ids_list:
            return []
        result = await self.db.execute(
            select(UserTable).where(UserTable.id.in_(ids_list))
        )
        rows = result.scalars().all()
        return [row.to_user() for row in rows]

    async def count(self) -> int:
        result = await self.db.execute(select(func.count()).select_from(UserTable))
        return int(result.scalar_one())

    async def deleteById(self, id: UUID) -> None:
        await self.db.execute(delete(UserTable).where(UserTable.id == id))
        await self.db.commit()

    async def delete(self, entity: User) -> None:
        await self.deleteById(entity.id)

    async def deleteAllById(self, ids: Iterable[UUID]) -> None:
        ids_list = list(ids)
        if not ids_list:
            return
        await self.db.execute(delete(UserTable).where(UserTable.id.in_(ids_list)))
        await self.db.commit()

    async def deleteAll(self, entities: Iterable[User] | None = None) -> None:
        if entities is None:
            await self.db.execute(delete(UserTable))
            await self.db.commit()
            return
        entity_ids = [e.id for e in entities]
        await self.deleteAllById(entity_ids)
