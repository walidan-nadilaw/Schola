"""Shared test fixtures: async test client with Postgres."""

import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from src.core.config import settings
from src.infrastructure.db import Base, get_async_db_session
from src.app import app
from src.api.deps.storage import get_storage_service
from src.application.i_storage_service import IStorageService, StoredFile

import src.infrastructure.models  # noqa, register all models

# NullPool avoids asyncpg "another operation in progress" issues
engine = create_async_engine(settings.DATABASE_URL, echo=False, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    """Create tables once at start, drop once at end."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def clean_tables():
    """Truncate all tables between tests for isolation."""
    yield
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(text(f'TRUNCATE TABLE "{table.name}" CASCADE'))


async def _override_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


class FakeStorageService(IStorageService):
    """In-memory fake storage for tests — no external dependencies."""

    def __init__(self):
        self._store: dict[str, bytes] = {}

    async def upload(self, file_data: bytes, file_name: str, content_type: str, folder: str = "") -> StoredFile:
        key = f"{folder}/{file_name}" if folder else file_name
        self._store[key] = file_data
        return StoredFile(file_path=key, file_url=f"/fake/{key}", file_size=len(file_data), content_type=content_type)

    async def download(self, file_path: str) -> bytes:
        if file_path not in self._store:
            raise FileNotFoundError(file_path)
        return self._store[file_path]

    async def delete(self, file_path: str) -> None:
        self._store.pop(file_path, None)

    async def get_url(self, file_path: str) -> str:
        return f"/fake/{file_path}"


app.dependency_overrides[get_async_db_session] = _override_db
app.dependency_overrides[get_storage_service] = FakeStorageService


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
