"""Tests for verification feature: pending list + approve/reject flow."""

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from tests.conftest import engine


async def _register_and_login(client: AsyncClient, email: str, pw: str = "pass123"):
    """Register + login, return JWT token."""
    await client.post("/auth/register", json={"email": email, "password": pw})
    resp = await client.post("/auth/login", json={"email": email, "password": pw})
    return resp.json()["data"]["token"]


async def _auth_header(client: AsyncClient, email: str) -> dict:
    token = await _register_and_login(client, email)
    return {"Authorization": f"Bearer {token}"}


async def _promote_role(email: str, role: str = "DOSEN_PEJABAT"):
    """Promote a user to a given role directly in the DB."""
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = :r WHERE email = :e"),
            {"r": role, "e": email},
        )


async def _setup_submission_with_verifier(client: AsyncClient):
    """Full setup: operator creates template, mahasiswa creates + submits, dosen is verifier.

    Returns (mahasiswa_headers, dosen_headers, submission_id, dosen_user_id).
    """
    # 1. operator creates a template
    op_email = "verif_op@apps.ipb.ac.id"
    await _register_and_login(client, op_email)
    await _promote_role(op_email, "OPERATOR_LEMBAGA")
    op_resp = await client.post("/auth/login", json={"email": op_email, "password": "pass123"})
    op_token = op_resp.json()["data"]["token"]
    op_headers = {"Authorization": f"Bearer {op_token}"}

    tpl_resp = await client.post(
        "/templates/",
        headers=op_headers,
        json={
            "letter_type": "Surat Keterangan Aktif",
            "fields": [{"name": "nama", "type": "text", "required": True}],
        },
    )
    tpl_id = tpl_resp.json()["data"]["id"]

    # 2. register the dosen and get their user ID
    dosen_email = "verif_dosen@apps.ipb.ac.id"
    await _register_and_login(client, dosen_email)
    await _promote_role(dosen_email, "DOSEN_PEJABAT")
    dosen_resp = await client.post("/auth/login", json={"email": dosen_email, "password": "pass123"})
    dosen_data = dosen_resp.json()["data"]
    dosen_token = dosen_data["token"]
    dosen_headers = {"Authorization": f"Bearer {dosen_token}"}

    # get dosen user id from /auth/me
    me_resp = await client.get("/auth/me", headers=dosen_headers)
    dosen_user_id = me_resp.json()["data"]["id"]

    # 3. mahasiswa creates and submits
    mhs_email = "verif_mhs@apps.ipb.ac.id"
    mhs_token = await _register_and_login(client, mhs_email)
    mhs_headers = {"Authorization": f"Bearer {mhs_token}"}

    create_resp = await client.post(
        "/submissions/",
        headers=mhs_headers,
        json={"template_id": tpl_id, "form_data": {"nama": "Test Mahasiswa"}},
    )
    sub_id = create_resp.json()["data"]["id"]

    # manually add verifier + set submission status to submitted via DB
    async with engine.begin() as conn:
        # insert verifier assignment
        await conn.execute(
            text(
                """
                INSERT INTO submission_verifiers
                    (id, submission_id, verifier_id, verifier_order, verifier_role, status, created_at, updated_at)
                VALUES
                    (gen_random_uuid(), :sid, CAST(:vid AS uuid), 1, 'verifier', 'pending', NOW(), NOW())
                """
            ),
            {"sid": sub_id, "vid": dosen_user_id},
        )
        # set submission status to submitted
        await conn.execute(
            text("UPDATE submissions SET status = 'submitted', submitted_at = NOW() WHERE id = :sid"),
            {"sid": sub_id},
        )

    return mhs_headers, dosen_headers, sub_id, dosen_user_id


# -- Auth guard --


@pytest.mark.asyncio
async def test_list_verifications_requires_auth(client: AsyncClient):
    resp = await client.get("/verifications/")
    assert resp.status_code in (401, 403)


# -- Empty list --


@pytest.mark.asyncio
async def test_list_verifications_empty(client: AsyncClient):
    headers = await _auth_header(client, "verif_empty@apps.ipb.ac.id")
    # promote to dosen so it doesn't get blocked
    await _promote_role("verif_empty@apps.ipb.ac.id")
    # re-login after promotion
    resp = await client.post("/auth/login", json={"email": "verif_empty@apps.ipb.ac.id", "password": "pass123"})
    token = resp.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.get("/verifications/", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


# -- Verify auth guard --


@pytest.mark.asyncio
async def test_verify_requires_auth(client: AsyncClient):
    resp = await client.post(
        "/verifications/verify",
        json={"submission_id": "X", "action": "approved"},
    )
    assert resp.status_code in (401, 403)


# -- Verify not found --


@pytest.mark.asyncio
async def test_verify_submission_not_found(client: AsyncClient):
    headers = await _auth_header(client, "verif_nf@apps.ipb.ac.id")
    await _promote_role("verif_nf@apps.ipb.ac.id")
    resp = await client.post("/auth/login", json={"email": "verif_nf@apps.ipb.ac.id", "password": "pass123"})
    token = resp.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post(
        "/verifications/verify",
        headers=headers,
        json={"submission_id": "NONEXISTENT/2026/0001", "action": "approved"},
    )
    assert resp.status_code == 404


# -- Full approve flow --


@pytest.mark.asyncio
async def test_full_approve_flow(client: AsyncClient):
    mhs_h, dosen_h, sub_id, _ = await _setup_submission_with_verifier(client)

    # dosen sees it in pending list
    pending = await client.get("/verifications/", headers=dosen_h)
    assert pending.status_code == 200
    ids = [v["submission_id"] for v in pending.json()["data"]]
    assert sub_id in ids

    # dosen approves
    resp = await client.post(
        "/verifications/verify",
        headers=dosen_h,
        json={"submission_id": sub_id, "action": "approved", "comment": "Looks good"},
    )
    assert resp.status_code == 200
    body = resp.json()["data"]
    assert body["status"] == "approved"
    assert body["signature_hash"].startswith("IPB-SIGN-")

    # submission is now approved
    sub_resp = await client.get(f"/submissions/{sub_id}", headers=mhs_h)
    assert sub_resp.json()["data"]["status"] == "approved"


# -- Reject flow --


@pytest.mark.asyncio
async def test_reject_flow(client: AsyncClient):
    mhs_h, dosen_h, sub_id, _ = await _setup_submission_with_verifier(client)

    # dosen rejects
    resp = await client.post(
        "/verifications/verify",
        headers=dosen_h,
        json={
            "submission_id": sub_id,
            "action": "rejected",
            "rejection_reason": "Data tidak lengkap",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "rejected"

    # submission is now rejected
    sub_resp = await client.get(f"/submissions/{sub_id}", headers=mhs_h)
    assert sub_resp.json()["data"]["status"] == "rejected"


# -- Operator blocked --


@pytest.mark.asyncio
async def test_operator_blocked_from_verification(client: AsyncClient):
    """Operators manage templates, not verify submissions."""
    op_email = "verif_blocked@apps.ipb.ac.id"
    await _register_and_login(client, op_email)
    await _promote_role(op_email, "OPERATOR_LEMBAGA")
    op_resp = await client.post("/auth/login", json={"email": op_email, "password": "pass123"})
    op_h = {"Authorization": f"Bearer {op_resp.json()['data']['token']}"}

    resp = await client.get("/verifications/", headers=op_h)
    assert resp.status_code == 403


# -- Reject without reason --


@pytest.mark.asyncio
async def test_reject_without_reason_fails(client: AsyncClient):
    _, dosen_h, sub_id, _ = await _setup_submission_with_verifier(client)
    resp = await client.post(
        "/verifications/verify",
        headers=dosen_h,
        json={"submission_id": sub_id, "action": "rejected"},
    )
    assert resp.status_code == 400
