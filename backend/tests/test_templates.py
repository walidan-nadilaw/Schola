"""Tests for templates feature: CRUD with role-based access."""

import pytest
from httpx import AsyncClient


async def _register_and_login(
    client: AsyncClient, email: str, password: str = "pass123"
):
    """Register + login, return token."""
    await client.post("/auth/register", json={"email": email, "password": password})
    resp = await client.post("/auth/login", json={"email": email, "password": password})
    return resp.json()["data"]["token"]


async def _auth_header(client: AsyncClient, email: str) -> dict:
    token = await _register_and_login(client, email)
    return {"Authorization": f"Bearer {token}"}


SAMPLE_FIELDS = [
    {"name": "nama_lengkap", "type": "text", "required": True},
    {"name": "nim", "type": "text", "required": True},
]


# -- List --


@pytest.mark.asyncio
async def test_list_templates_requires_auth(client: AsyncClient):
    resp = await client.get("/templates/")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_templates_empty(client: AsyncClient):
    headers = await _auth_header(client, "tpl_list@apps.ipb.ac.id")
    resp = await client.get("/templates/", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


# -- Create (operator only) --


@pytest.mark.asyncio
async def test_create_template_forbidden_for_mahasiswa(client: AsyncClient):
    headers = await _auth_header(client, "tpl_mhs@apps.ipb.ac.id")
    resp = await client.post(
        "/templates/",
        headers=headers,
        json={
            "letter_type": "surat_aktif",
            "fields": SAMPLE_FIELDS,
        },
    )
    assert resp.status_code == 403


# -- Get --


@pytest.mark.asyncio
async def test_get_template_not_found(client: AsyncClient):
    headers = await _auth_header(client, "tpl_get@apps.ipb.ac.id")
    resp = await client.get(
        "/templates/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert resp.status_code == 404


# -- Delete (operator only) --


@pytest.mark.asyncio
async def test_delete_template_forbidden_for_mahasiswa(client: AsyncClient):
    headers = await _auth_header(client, "tpl_del@apps.ipb.ac.id")
    resp = await client.delete(
        "/templates/00000000-0000-0000-0000-000000000000", headers=headers
    )
    assert resp.status_code == 403
