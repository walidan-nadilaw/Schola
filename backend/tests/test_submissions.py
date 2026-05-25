"""Tests for submissions feature: CRUD + submit workflow."""

import pytest
from httpx import AsyncClient


async def _register_and_login(
    client: AsyncClient, email: str, password: str = "pass123"
):
    await client.post("/auth/register", json={"email": email, "password": password})
    resp = await client.post("/auth/login", json={"email": email, "password": password})
    return resp.json()["data"]["token"]


async def _auth_header(client: AsyncClient, email: str) -> dict:
    token = await _register_and_login(client, email)
    return {"Authorization": f"Bearer {token}"}


async def _create_template_as_operator(client: AsyncClient):
    """Helper: register an operator, create a template, return (headers, template_id)."""
    from sqlalchemy import text

    # register an operator and promote via DB
    email = "sub_op@apps.ipb.ac.id"
    await client.post("/auth/register", json={"email": email, "password": "pass123"})

    # promote to operator directly
    from tests.conftest import _engine
    from sqlalchemy.ext.asyncio import AsyncSession

    async with _engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = 'OPERATOR_LEMBAGA' WHERE email = :e"),
            {"e": email},
        )

    resp = await client.post(
        "/auth/login", json={"email": email, "password": "pass123"}
    )
    token = resp.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    tpl_resp = await client.post(
        "/templates/",
        headers=headers,
        json={
            "letter_type": "Surat Keterangan Aktif",
            "fields": [{"name": "nama", "type": "text", "required": True}],
        },
    )
    tpl_id = tpl_resp.json()["data"]["id"]
    return headers, tpl_id


# -- Auth guard --


@pytest.mark.asyncio
async def test_list_submissions_requires_auth(client: AsyncClient):
    resp = await client.get("/submissions/")
    assert resp.status_code in (401, 403)


# -- List (empty) --


@pytest.mark.asyncio
async def test_list_submissions_empty(client: AsyncClient):
    headers = await _auth_header(client, "sub_list@apps.ipb.ac.id")
    resp = await client.get("/submissions/", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


# -- Create draft --


@pytest.mark.asyncio
async def test_create_submission_bad_template(client: AsyncClient):
    headers = await _auth_header(client, "sub_bad@apps.ipb.ac.id")
    resp = await client.post(
        "/submissions/",
        headers=headers,
        json={
            "template_id": "00000000-0000-0000-0000-000000000000",
            "form_data": {"nama": "Test"},
        },
    )
    assert resp.status_code == 404


# -- Get not found --


@pytest.mark.asyncio
async def test_get_submission_not_found(client: AsyncClient):
    headers = await _auth_header(client, "sub_nf@apps.ipb.ac.id")
    resp = await client.get("/submissions/NOTEXIST", headers=headers)
    assert resp.status_code == 404


# -- Delete not found --


@pytest.mark.asyncio
async def test_delete_submission_not_found(client: AsyncClient):
    headers = await _auth_header(client, "sub_delnf@apps.ipb.ac.id")
    resp = await client.delete("/submissions/NOTEXIST", headers=headers)
    assert resp.status_code == 404
