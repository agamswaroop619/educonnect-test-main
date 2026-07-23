"""RBAC enforcement tests — Requirements 4."""

import pytest


@pytest.mark.asyncio
async def test_student_cannot_access_admin_endpoint(client, student_headers):
    """Req 4.2: student on admin-only endpoint → 403."""
    if not student_headers:
        pytest.skip("No student credentials (seed not applied)")
    resp = await client.get("/api/v1/admin/classes", headers=student_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_access_all(client, admin_headers):
    """Req 4.5: admin can access domain endpoints."""
    if not admin_headers:
        pytest.skip("No admin credentials (seed not applied)")
    resp = await client.get("/api/v1/admin/classes", headers=admin_headers)
    assert resp.status_code in (200, 404)  # 404 if no data, but not 403


@pytest.mark.asyncio
async def test_no_password_in_response(client, admin_headers):
    """Property 18: no password field in any response."""
    if not admin_headers:
        pytest.skip("No admin credentials")
    resp = await client.get("/api/v1/admin/classes", headers=admin_headers)
    body = resp.text
    assert "password" not in body
    assert "hashed_password" not in body
    assert "password_hash" not in body
