"""
Test configuration — async pytest setup with in-memory SQLite for unit tests,
and fixtures for auth headers per role.

For full integration tests against PostgreSQL, set TEST_DATABASE_URL env var.
"""

import asyncio
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.main import app
from app.models.base import Base
from app.models import *  # noqa: F401,F403 — register all models


# ---------------------------------------------------------------------------
# Async event loop
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ---------------------------------------------------------------------------
# Test database (SQLite in-memory for speed; override with Postgres via env)
# ---------------------------------------------------------------------------

import os

TEST_DB_URL = os.getenv("TEST_DATABASE_URL", "sqlite+aiosqlite:///:memory:")


@pytest_asyncio.fixture(scope="session")
async def engine():
    _engine = create_async_engine(TEST_DB_URL, echo=False)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def admin_headers(client):
    """Get auth headers for admin@scholarly.edu (seeded by seed.py)."""
    resp = await client.post("/api/v1/auth/login", json={
        "email": "admin@scholarly.edu", "password": "password123"
    })
    if resp.status_code == 200:
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return {}


@pytest_asyncio.fixture
async def teacher_headers(client):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "teacher@scholarly.edu", "password": "password123"
    })
    if resp.status_code == 200:
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return {}


@pytest_asyncio.fixture
async def student_headers(client):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "student@scholarly.edu", "password": "password123"
    })
    if resp.status_code == 200:
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return {}


@pytest_asyncio.fixture
async def parent_headers(client):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "parent@scholarly.edu", "password": "password123"
    })
    if resp.status_code == 200:
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return {}
