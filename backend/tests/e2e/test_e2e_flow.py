"""
End-to-end tests: full mahasiswa → dosen submission + verification flow.

Covers:
  - Login / auth
  - Template listing
  - Submission create → upload → submit
  - Verification pending list → approve (HMAC signature)
  - File upload + download
"""

import io

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from tests.conftest import engine


# ── helpers ──────────────────────────────────────────────────────────────────


async def _register_and_login(client: AsyncClient, email: str, pw: str = "pass123") -> str:
    await client.post("/auth/register", json={"email": email, "password": pw})
    resp = await client.post("/auth/login", json={"email": email, "password": pw})
    assert resp.status_code == 200
    return resp.json()["data"]["token"]


async def _promote_user(email: str, role: str):
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET role = :r WHERE email = :e"),
            {"r": role, "e": email},
        )


# ── full flow ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_full_submission_verification_flow(client: AsyncClient):
    """
    End-to-end: mahasiswa submits a letter, uploads an attachment,
    dosen approves it — everything via the API.
    """
    # ── 1. Operator creates a template ───────────────────────────────────
    op_token = await _register_and_login(client, "e2e_op@apps.ipb.ac.id")
    await _promote_user("e2e_op@apps.ipb.ac.id", "OPERATOR_LEMBAGA")
    op_resp = await client.post(
        "/auth/login", json={"email": "e2e_op@apps.ipb.ac.id", "password": "pass123"}
    )
    op_headers = {"Authorization": f"Bearer {op_resp.json()['data']['token']}"}

    tpl = await client.post(
        "/templates/",
        headers=op_headers,
        json={
            "letter_type": "Surat Keterangan Aktif",
            "fields": [
                {"id": "nama", "label": "Nama Lengkap", "type": "text", "required": True},
                {"id": "nim", "label": "NIM", "type": "text", "required": True},
                {"id": "program", "label": "Program Studi", "type": "text", "required": True},
                {"id": "semester", "label": "Semester", "type": "number", "required": True},
                {"id": "tujuan", "label": "Tujuan", "type": "text", "required": True},
                {"id": "Keperluan", "label": "Keperluan Surat", "type": "text", "required": True},
            ],
        },
    )
    assert tpl.status_code == 201
    tpl_id = tpl.json()["data"]["id"]

    # ── 2. Dosen registers and gets promoted ─────────────────────────────
    dosen_token = await _register_and_login(client, "e2e_dosen@apps.ipb.ac.id")
    await _promote_user("e2e_dosen@apps.ipb.ac.id", "DOSEN_PEJABAT")
    dosen_resp = await client.post(
        "/auth/login", json={"email": "e2e_dosen@apps.ipb.ac.id", "password": "pass123"}
    )
    dosen_data = dosen_resp.json()["data"]
    dosen_headers = {"Authorization": f"Bearer {dosen_data['token']}"}

    me = await client.get("/auth/me", headers=dosen_headers)
    dosen_id = me.json()["data"]["id"]

    # ── 3. Mahasiswa logs in ─────────────────────────────────────────────
    mhs_token = await _register_and_login(client, "e2e_mhs@apps.ipb.ac.id")
    mhs_headers = {"Authorization": f"Bearer {mhs_token}"}

    # ── 4. List templates ────────────────────────────────────────────────
    tpl_list = await client.get("/templates/", headers=mhs_headers)
    assert tpl_list.status_code == 200
    assert len(tpl_list.json()["data"]) >= 1
    assert any(t["id"] == tpl_id for t in tpl_list.json()["data"])

    # ── 5. Create draft submission ───────────────────────────────────────
    draft = await client.post(
        "/submissions/",
        headers=mhs_headers,
        json={
            "template_id": tpl_id,
            "form_data": {
                "nama": "Budi Santoso",
                "nim": "G64180001",
                "program": "S1 Ilmu Komputer",
                "semester": 6,
                "tujuan": "Beasiswa LPDP",
                "Keperluan": "Pengajuan Beasiswa",
            },
        },
    )
    assert draft.status_code == 201
    sub_id = draft.json()["data"]["id"]
    assert draft.json()["data"]["status"] == "draft"

    # ── 6. Upload file attachment ────────────────────────────────────────
    pdf_content = b"%PDF-1.4 fake pdf for e2e test"
    upload = await client.post(
        f"/files/upload?submission_id={sub_id}",
        headers=mhs_headers,
        files={"file": ("dokumen.pdf", io.BytesIO(pdf_content), "application/pdf")},
    )
    assert upload.status_code == 201
    upload_data = upload.json()["data"]
    assert upload_data["file_name"] == "dokumen.pdf"
    assert upload_data["file_size"] == len(pdf_content)
    attachment_filename = upload_data["file_path"]

    # ── 7. Download attachment ───────────────────────────────────────────
    download = await client.get(
        f"/files/download/{attachment_filename}",
        headers=mhs_headers,
    )
    assert download.status_code in (200, 307)  # 307 = R2 redirect, 200 = local

    # ── 8. Submit with dosen as verifier ─────────────────────────────────
    submit = await client.post(
        f"/submissions/{sub_id}/submit",
        headers=mhs_headers,
        json={
            "verifiers": [dosen_id],
            "is_ordered_verification": False,
        },
    )
    assert submit.status_code == 200
    assert submit.json()["data"]["status"] == "submitted"

    # ── 9. Dosen sees pending verification ──────────────────────────────
    pending = await client.get("/verifications/", headers=dosen_headers)
    assert pending.status_code == 200
    pending_items = pending.json()["data"]
    assert len(pending_items) == 1
    assert pending_items[0]["submission_id"] == sub_id
    assert pending_items[0]["letter_type"] == "Surat Keterangan Aktif"

    # ── 10. Dosen approves ──────────────────────────────────────────────
    approve = await client.post(
        "/verifications/verify",
        headers=dosen_headers,
        json={
            "submission_id": sub_id,
            "action": "approved",
            "comment": "Disetujui — dokumen lengkap",
        },
    )
    assert approve.status_code == 200
    approve_data = approve.json()["data"]
    assert approve_data["status"] == "approved"
    assert approve_data["signature_hash"] is not None

    # ── 11. Verify submission is now approved ───────────────────────────
    detail = await client.get(f"/submissions/{sub_id}", headers=mhs_headers)
    assert detail.status_code == 200
    assert detail.json()["data"]["status"] == "approved"
    assert detail.json()["data"]["verified_at"] is not None

    # ── 12. Pending list is now empty ───────────────────────────────────
    pending2 = await client.get("/verifications/", headers=dosen_headers)
    assert pending2.status_code == 200
    assert len(pending2.json()["data"]) == 0
