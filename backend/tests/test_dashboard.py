"""Tests for dashboard feature: role-aware stats + activity."""

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


# -- Auth guard --


@pytest.mark.asyncio
async def test_dashboard_requires_auth(client: AsyncClient):
    resp = await client.get("/dashboard/stats")
    assert resp.status_code in (401, 403)


# -- Empty dashboard --


@pytest.mark.asyncio
async def test_dashboard_empty(client: AsyncClient):
    headers = await _auth_header(client, "dash_empty@apps.ipb.ac.id")
    resp = await client.get("/dashboard/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["total_submissions"] == 0
    assert data["draft_submissions"] == 0
    assert data["pending_verifications"] == 0
    assert data["recent_activity"] == []


# -- Dashboard with data --


@pytest.mark.asyncio
async def test_dashboard_with_submissions(client: AsyncClient):
    mhs_h = await _auth_header(client, "dash_mhs@apps.ipb.ac.id")

    # create a template & submission via operator then link to this mhs
    op_h = await _auth_header(client, "dash_op@apps.ipb.ac.id")
    await _promote_role("dash_op@apps.ipb.ac.id", "OPERATOR_LEMBAGA")
    op_resp = await client.post("/auth/login", json={"email": "dash_op@apps.ipb.ac.id", "password": "pass123"})
    op_token = op_resp.json()["data"]["token"]
    op_h = {"Authorization": f"Bearer {op_token}"}

    tpl = await client.post(
        "/templates/", headers=op_h,
        json={"letter_type": "Surat Keterangan Aktif", "fields": [{"name": "nama", "type": "text", "required": True}]},
    )
    tpl_id = tpl.json()["data"]["id"]

    # mahasiswa creates submission
    sub = await client.post(
        "/submissions/", headers=mhs_h,
        json={"template_id": tpl_id, "form_data": {"nama": "Test"}},
    )
    sub_id = sub.json()["data"]["id"]

    # check dashboard — should have 1 draft
    resp = await client.get("/dashboard/stats", headers=mhs_h)
    data = resp.json()["data"]
    assert data["total_submissions"] == 1
    assert data["draft_submissions"] == 1

    # insert activity log for this user
    async with engine.begin() as conn:
        await conn.execute(
            text("SELECT id FROM users WHERE email = 'dash_mhs@apps.ipb.ac.id'")
        )
        uid_row = await conn.execute(text("SELECT id FROM users WHERE email = 'dash_mhs@apps.ipb.ac.id'"))
        uid = str(uid_row.scalar_one())
        await conn.execute(
            text(
                "INSERT INTO activity_logs (id, user_id, submission_id, action_type, description, created_at) "
                "VALUES (gen_random_uuid(), CAST(:uid AS uuid), :sid, 'SUBMISSION_CREATED', 'created', NOW())"
            ),
            {"uid": uid, "sid": sub_id},
        )

    # verify activity shows up
    resp = await client.get("/dashboard/stats", headers=mhs_h)
    data = resp.json()["data"]
    assert len(data["recent_activity"]) == 1
    assert data["recent_activity"][0]["type"] == "submission_created"


# -- Operator sees all --


@pytest.mark.asyncio
async def test_dashboard_operator_sees_all(client: AsyncClient):
    mhs_h = await _auth_header(client, "dash_omhs@apps.ipb.ac.id")

    op_h = await _auth_header(client, "dash_o_op@apps.ipb.ac.id")
    await _promote_role("dash_o_op@apps.ipb.ac.id", "OPERATOR_LEMBAGA")
    op_resp = await client.post("/auth/login", json={"email": "dash_o_op@apps.ipb.ac.id", "password": "pass123"})
    op_token = op_resp.json()["data"]["token"]
    op_h = {"Authorization": f"Bearer {op_token}"}

    tpl = await client.post(
        "/templates/", headers=op_h,
        json={"letter_type": "Surat Keterangan", "fields": [{"name": "x", "type": "text", "required": True}]},
    )
    tpl_id = tpl.json()["data"]["id"]

    await client.post(
        "/submissions/", headers=mhs_h,
        json={"template_id": tpl_id, "form_data": {"x": "y"}},
    )

    # operator dashboard — should see all
    resp = await client.get("/dashboard/stats", headers=op_h)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["total_submissions"] >= 1
    assert data["pending_verifications"] == 0
