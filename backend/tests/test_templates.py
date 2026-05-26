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


# -- Full CRUD flow as operator --


@pytest.mark.asyncio
async def test_full_template_crud_flow(client: AsyncClient):
    """Operator creates, reads, updates, and soft-deletes a template."""
    from sqlalchemy import text
    from tests.conftest import engine

    email = "tpl_crud_op@apps.ipb.ac.id"
    await client.post("/auth/register", json={"email": email, "password": "pass123"})
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = 'OPERATOR_LEMBAGA' WHERE email = :e"),
            {"e": email},
        )
    resp = await client.post("/auth/login", json={"email": email, "password": "pass123"})
    op_h = {"Authorization": f"Bearer {resp.json()['data']['token']}"}

    # Create
    create = await client.post("/templates/", headers=op_h, json={
        "letter_type": "Surat Aktif",
        "fields": SAMPLE_FIELDS,
    })
    assert create.status_code == 201
    tpl_id = create.json()["data"]["id"]

    # Read
    get = await client.get(f"/templates/{tpl_id}", headers=op_h)
    assert get.status_code == 200
    assert get.json()["data"]["letter_type"] == "Surat Aktif"

    # Update
    update = await client.put(f"/templates/{tpl_id}", headers=op_h, json={
        "letter_type": "Surat Aktif Updated",
        "fields": SAMPLE_FIELDS,
    })
    assert update.status_code == 200
    assert update.json()["data"]["letter_type"] == "Surat Aktif Updated"

    # Soft-delete
    delete = await client.delete(f"/templates/{tpl_id}", headers=op_h)
    assert delete.status_code in (200, 204)

    # Verify inactive (soft-deleted templates are excluded from GET)
    get2 = await client.get(f"/templates/{tpl_id}", headers=op_h)
    assert get2.status_code == 404
