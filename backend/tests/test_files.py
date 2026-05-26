"""Tests for files feature: upload, download, delete."""

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from tests.conftest import engine


async def _register_and_login(client: AsyncClient, email: str, pw: str = "pass123"):
    await client.post("/auth/register", json={"email": email, "password": pw})
    resp = await client.post("/auth/login", json={"email": email, "password": pw})
    return resp.json()["data"]["token"]


async def _auth_header(client: AsyncClient, email: str) -> dict:
    token = await _register_and_login(client, email)
    return {"Authorization": f"Bearer {token}"}


def _pdf_bytes() -> bytes:
    # minimal valid PDF
    return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\nxref\n0 1\ntrailer<</Size 1>>\nstartxref\n9\n%%EOF"


# -- Auth guards --


@pytest.mark.asyncio
async def test_upload_requires_auth(client: AsyncClient):
    resp = await client.post("/files/upload")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_download_requires_auth(client: AsyncClient):
    resp = await client.get("/files/download/somefile.pdf")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_delete_requires_auth(client: AsyncClient):
    resp = await client.delete("/files/00000000-0000-0000-0000-000000000001")
    assert resp.status_code in (401, 403)


# -- Bad request --


@pytest.mark.asyncio
async def test_upload_bad_file_type(client: AsyncClient):
    headers = await _auth_header(client, "file_badtype@apps.ipb.ac.id")
    resp = await client.post(
        "/files/upload",
        headers=headers,
        files={"file": ("test.exe", b"malware", "application/x-msdownload")},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_upload_nonexistent_submission(client: AsyncClient):
    headers = await _auth_header(client, "file_nosub@apps.ipb.ac.id")
    resp = await client.post(
        "/files/upload?submission_id=NONEXISTENT/2026/0001",
        headers=headers,
        files={"file": ("doc.pdf", _pdf_bytes(), "application/pdf")},
    )
    assert resp.status_code == 404


# -- Not found --


@pytest.mark.asyncio
async def test_download_not_found(client: AsyncClient):
    headers = await _auth_header(client, "file_dl_nf@apps.ipb.ac.id")
    resp = await client.get("/files/download/nonexistent.pdf", headers=headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_not_found(client: AsyncClient):
    headers = await _auth_header(client, "file_del_nf@apps.ipb.ac.id")
    resp = await client.delete(
        "/files/00000000-0000-0000-0000-000000000099", headers=headers
    )
    assert resp.status_code == 404


# -- Full flow: upload → download → delete --


@pytest.mark.asyncio
async def test_full_upload_download_delete_flow(client: AsyncClient):
    headers = await _auth_header(client, "file_flow@apps.ipb.ac.id")

    # upload
    resp = await client.post(
        "/files/upload",
        headers=headers,
        files={"file": ("lampiran.pdf", _pdf_bytes(), "application/pdf")},
    )
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["file_name"] == "lampiran.pdf"
    assert data["file_type"] == "application/pdf"
    att_id = data["id"]

    # download — redirect
    resp = await client.get(
        f"/files/download/{data['file_path']}",
        headers=headers,
        follow_redirects=False,
    )
    assert resp.status_code in (307, 302, 200)

    # delete
    resp = await client.delete(f"/files/{att_id}", headers=headers)
    assert resp.status_code == 204

    # verify deleted (download 404)
    resp = await client.get(
        f"/files/download/{data['file_path']}",
        headers=headers,
    )
    assert resp.status_code == 404


# -- Delete by wrong user forbidden --


@pytest.mark.asyncio
async def test_delete_wrong_user_forbidden(client: AsyncClient):
    h_a = await _auth_header(client, "file_own@apps.ipb.ac.id")
    # upload as user A
    resp = await client.post(
        "/files/upload",
        headers=h_a,
        files={"file": ("doc.pdf", _pdf_bytes(), "application/pdf")},
    )
    att_id = resp.json()["data"]["id"]

    # user B tries to delete
    h_b = await _auth_header(client, "file_intruder@apps.ipb.ac.id")
    resp = await client.delete(f"/files/{att_id}", headers=h_b)
    assert resp.status_code == 403
