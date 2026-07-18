"""Integration tests for authentication endpoints — Requirements 3, 4."""

import pytest


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "version" in data


@pytest.mark.asyncio
async def test_protected_route_without_token(client):
    """Property 4: no token → 401."""
    resp = await client.get("/api/v1/students/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_invalid_token(client):
    """Property 4: malformed token → 401."""
    resp = await client.get("/api/v1/students/me",
                             headers={"Authorization": "Bearer not.a.real.token"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_error_response_envelope(client):
    """Property 1: 4xx responses include RFC 7807 fields."""
    resp = await client.get("/api/v1/students/me")
    assert resp.status_code in (401, 403, 404)
    body = resp.json()
    assert "detail" in body or "title" in body


@pytest.mark.asyncio
async def test_validation_error_returns_422(client):
    """Property 17: missing required fields → 422 with field-level errors."""
    resp = await client.post("/api/v1/auth/login", json={"email": "only@email.com"})
    assert resp.status_code == 422
    body = resp.json()
    assert "detail" in body
