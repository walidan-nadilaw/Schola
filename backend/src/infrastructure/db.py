"""Database connection and operations for the core application."""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from src.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
# Named to match usages elsewhere (async_session_maker is imported by db_seeder)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all database models."""


async def get_async_db_session():
    """Get an asynchronous database session dependency yielding `AsyncSession`."""
    async with async_session_maker() as session:
        yield session
