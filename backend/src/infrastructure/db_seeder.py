"""Reusable database seeder helpers."""

from collections.abc import Sequence
from typing import Any

from sqlalchemy import insert, text

from src.infrastructure.db import async_session_maker


async def seed(
    table: type[Any],
    rows: Sequence[dict[str, Any]],
) -> int:
    """Insert rows into a table and commit the transaction."""
    if not rows:
        return 0

    async with async_session_maker() as session:
        await session.execute(insert(table).values(list(rows)))
        await session.commit()
    return len(rows)


async def truncate(table_name: str) -> None:
    """Truncate table with identity reset and cascading."""
    async with async_session_maker() as session:
        await session.execute(
            text(f'TRUNCATE TABLE "{table_name}" RESTART IDENTITY CASCADE')
        )
        await session.commit()


async def reseed(
    table: type[Any],
    rows: Sequence[dict[str, Any]],
) -> int:
    """Clear existing rows and insert fresh seed data."""
    await truncate(table.__tablename__)
    return await seed(table, rows)