"""Tests for R2StorageService - direct, no FastAPI client, real R2 bucket."""

import pytest
import pytest_asyncio

from src.infrastructure.services.r2_storage_service import R2StorageService


@pytest_asyncio.fixture
async def storage():
    """Real R2 storage connected to schola-dev bucket with cleanup."""
    svc = R2StorageService()
    yield svc
    if R2StorageService._client is not None:
        await R2StorageService._client.aclose()
        R2StorageService._client = None


@pytest.mark.asyncio
async def test_upload_and_get_url(storage: R2StorageService):
    """Upload a file and retrieve its public URL."""
    result = await storage.upload(
        b"Hello R2 from pytest", "pytest-upload.txt", "text/plain", folder="test"
    )
    assert result.file_path.startswith("test/")
    assert result.file_path.endswith("pytest-upload.txt")
    assert result.file_size == 20
    assert result.content_type == "text/plain"
    assert "pub-c7b7b43fb33a4bf3bd46f9e0c6302d5d.r2.dev" in result.file_url

    url = await storage.get_url(result.file_path)
    assert result.file_url == url

    # cleanup
    await storage.delete(result.file_path)


@pytest.mark.asyncio
async def test_delete(storage: R2StorageService):
    """Upload then delete — get_url should still return the URL (R2 is eventual)."""
    result = await storage.upload(
        b"delete me", "pytest-delete.txt", "text/plain", folder="test"
    )
    await storage.delete(result.file_path)
    # Delete should not raise — R2 delete is idempotent


@pytest.mark.asyncio
async def test_delete_nonexistent_does_not_raise(storage: R2StorageService):
    """Deleting a nonexistent key should not crash."""
    await storage.delete("test/does-not-exist-99999.txt")


@pytest.mark.asyncio
async def test_upload_without_folder(storage: R2StorageService):
    """Upload without a folder prefix."""
    result = await storage.upload(
        b"no folder", "nofolder.txt", "text/plain"
    )
    assert "/" not in result.file_path  # no folder
    assert result.file_url.endswith("/nofolder.txt")

    await storage.delete(result.file_path)


@pytest.mark.asyncio
async def test_upload_binary_content(storage: R2StorageService):
    """Upload binary content (simulated PDF bytes)."""
    pdf = b"%PDF-1.4\nfake pdf content\n%%EOF"
    result = await storage.upload(
        pdf, "document.pdf", "application/pdf", folder="test"
    )
    assert result.content_type == "application/pdf"
    assert result.file_size == len(pdf)
    await storage.delete(result.file_path)
