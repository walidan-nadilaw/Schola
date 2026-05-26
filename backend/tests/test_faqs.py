"""Tests for FAQs feature: public read, operator-only write."""

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


async def _promote_role(email: str, role: str):
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = :r WHERE email = :e"),
            {"r": role, "e": email},
        )


async def _operator_headers(client: AsyncClient, email: str) -> dict:
    await _register_and_login(client, email)
    await _promote_role(email, "OPERATOR_LEMBAGA")
    resp = await client.post("/auth/login", json={"email": email, "password": "pass123"})
    return {"Authorization": f"Bearer {resp.json()['data']['token']}"}


# -- Public read --


@pytest.mark.asyncio
async def test_list_faqs_public(client: AsyncClient):
    resp = await client.get("/faqs/")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_get_faq_not_found(client: AsyncClient):
    resp = await client.get("/faqs/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 404


# -- Auth guards --


@pytest.mark.asyncio
async def test_create_faq_forbidden_for_mahasiswa(client: AsyncClient):
    headers = await _auth_header(client, "faq_mhs@apps.ipb.ac.id")
    resp = await client.post("/faqs/", headers=headers, json={"question": "Q?", "answer": "A."})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_delete_faq_forbidden_for_mahasiswa(client: AsyncClient):
    headers = await _auth_header(client, "faq_del@apps.ipb.ac.id")
    resp = await client.delete("/faqs/00000000-0000-0000-0000-000000000001", headers=headers)
    assert resp.status_code == 403


# -- Full CRUD flow --


@pytest.mark.asyncio
async def test_full_faq_crud_flow(client: AsyncClient):
    op_h = await _operator_headers(client, "faq_crud@apps.ipb.ac.id")

    # create
    resp = await client.post("/faqs/", headers=op_h, json={"question": "Apa itu Schola?", "answer": "Platform surat menyurat IPB."})
    assert resp.status_code == 201
    faq_id = resp.json()["data"]["id"]

    # list (public)
    resp = await client.get("/faqs/")
    assert len(resp.json()["data"]) >= 1

    # get single
    resp = await client.get(f"/faqs/{faq_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["question"] == "Apa itu Schola?"

    # update
    resp = await client.put(f"/faqs/{faq_id}", headers=op_h, json={"question": "Apa itu Schola v2?", "answer": "Updated."})
    assert resp.status_code == 200
    assert resp.json()["data"]["answer"] == "Updated."

    # delete
    resp = await client.delete(f"/faqs/{faq_id}", headers=op_h)
    assert resp.status_code == 204

    # verify gone
    resp = await client.get(f"/faqs/{faq_id}")
    assert resp.status_code == 404
