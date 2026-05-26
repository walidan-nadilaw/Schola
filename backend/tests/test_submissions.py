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


# -- Submit flow: verifier assignment + form validation --


@pytest.mark.asyncio
async def test_submit_with_verifiers(client: AsyncClient):
    """Create a draft, submit with verifiers, verify status changes."""
    from sqlalchemy import text
    from tests.conftest import engine

    # 1. Create template as operator
    op_email = "sub_submit_op@apps.ipb.ac.id"
    await client.post("/auth/register", json={"email": op_email, "password": "pass123"})
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = 'OPERATOR_LEMBAGA' WHERE email = :e"),
            {"e": op_email},
        )
    op_resp = await client.post("/auth/login", json={"email": op_email, "password": "pass123"})
    op_h = {"Authorization": f"Bearer {op_resp.json()['data']['token']}"}

    tpl = await client.post("/templates/", headers=op_h, json={
        "letter_type": "Surat Aktif",
        "fields": [
            {"id": "nama", "label": "Nama", "type": "text", "required": True},
            {"id": "Keperluan", "label": "Keperluan", "type": "text", "required": True},
        ],
    })
    tpl_id = tpl.json()["data"]["id"]

    # 2. Create dosen as verifier
    dosen_email = "sub_submit_dosen@apps.ipb.ac.id"
    await client.post("/auth/register", json={"email": dosen_email, "password": "pass123"})
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = 'DOSEN_PEJABAT' WHERE email = :e"),
            {"e": dosen_email},
        )
    dosen_resp = await client.post("/auth/login", json={"email": dosen_email, "password": "pass123"})
    dosen_id = dosen_resp.json()["data"]["id"]

    # 3. Mahasiswa creates draft
    mhs_h = await _auth_header(client, "sub_submit_mhs@apps.ipb.ac.id")
    draft = await client.post("/submissions/", headers=mhs_h, json={
        "template_id": tpl_id,
        "form_data": {"nama": "Test Mahasiswa", "Keperluan": "Pengajuan Surat"},
    })
    sub_id = draft.json()["data"]["id"]
    assert draft.json()["data"]["status"] == "draft"

    # 4. Submit with verifiers
    sub = await client.post(f"/submissions/{sub_id}/submit", headers=mhs_h, json={
        "verifiers": [dosen_id],
        "is_ordered_verification": True,
    })
    assert sub.status_code == 200
    assert sub.json()["data"]["status"] == "submitted"


@pytest.mark.asyncio
async def test_submit_missing_required_field(client: AsyncClient):
    """Submit should fail if required template field is missing."""
    from sqlalchemy import text
    from tests.conftest import engine

    op_email = "sub_val_op@apps.ipb.ac.id"
    await client.post("/auth/register", json={"email": op_email, "password": "pass123"})
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = 'OPERATOR_LEMBAGA' WHERE email = :e"),
            {"e": op_email},
        )
    op_resp = await client.post("/auth/login", json={"email": op_email, "password": "pass123"})
    op_h = {"Authorization": f"Bearer {op_resp.json()['data']['token']}"}

    tpl = await client.post("/templates/", headers=op_h, json={
        "letter_type": "Surat Aktif",
        "fields": [{"id": "wajib", "label": "Wajib Diisi", "type": "text", "required": True}],
    })
    tpl_id = tpl.json()["data"]["id"]

    dosen_email = "sub_val_dosen@apps.ipb.ac.id"
    await client.post("/auth/register", json={"email": dosen_email, "password": "pass123"})
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = 'DOSEN_PEJABAT' WHERE email = :e"),
            {"e": dosen_email},
        )
    dosen_resp = await client.post("/auth/login", json={"email": dosen_email, "password": "pass123"})
    dosen_id = dosen_resp.json()["data"]["id"]

    mhs_h = await _auth_header(client, "sub_val_mhs@apps.ipb.ac.id")
    draft = await client.post("/submissions/", headers=mhs_h, json={
        "template_id": tpl_id,
        "form_data": {},  # missing "wajib"
    })
    sub_id = draft.json()["data"]["id"]

    resp = await client.post(f"/submissions/{sub_id}/submit", headers=mhs_h, json={
        "verifiers": [dosen_id],
    })
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_submit_nonexistent_verifier(client: AsyncClient):
    """Submit should fail if verifier does not exist."""
    from sqlalchemy import text
    from tests.conftest import engine

    op_email = "sub_badv_op@apps.ipb.ac.id"
    await client.post("/auth/register", json={"email": op_email, "password": "pass123"})
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = 'OPERATOR_LEMBAGA' WHERE email = :e"),
            {"e": op_email},
        )
    op_resp = await client.post("/auth/login", json={"email": op_email, "password": "pass123"})
    op_h = {"Authorization": f"Bearer {op_resp.json()['data']['token']}"}

    tpl = await client.post("/templates/", headers=op_h, json={
        "letter_type": "Surat Aktif",
        "fields": [{"id": "x", "label": "X", "type": "text", "required": False}],
    })
    tpl_id = tpl.json()["data"]["id"]

    mhs_h = await _auth_header(client, "sub_badv_mhs@apps.ipb.ac.id")
    draft = await client.post("/submissions/", headers=mhs_h, json={
        "template_id": tpl_id,
        "form_data": {},
    })
    sub_id = draft.json()["data"]["id"]

    resp = await client.post(f"/submissions/{sub_id}/submit", headers=mhs_h, json={
        "verifiers": ["00000000-0000-0000-0000-000000000000"],
    })
    assert resp.status_code == 404
