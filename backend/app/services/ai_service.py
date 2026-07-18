"""AI Assistant service — chat with external provider."""

import uuid
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.ai import AIMessage, AISession


async def get_or_create_session(student_id: uuid.UUID, db: AsyncSession) -> AISession:
    result = await db.execute(select(AISession).where(AISession.student_id == student_id))
    session = result.scalar_one_or_none()
    if not session:
        session = AISession(id=uuid.uuid4(), student_id=student_id)
        db.add(session)
        await db.flush()
    return session


async def chat(student_id: uuid.UUID, message: str, db: AsyncSession) -> str:
    """Send message to AI provider and persist exchange."""
    session = await get_or_create_session(student_id, db)

    # Persist user message
    user_msg = AIMessage(id=uuid.uuid4(), session_id=session.id, role="user", text=message)
    db.add(user_msg)

    # Call AI provider
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{settings.AI_PROVIDER_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {settings.AI_PROVIDER_API_KEY}"},
                json={
                    "model": settings.AI_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are a helpful school academic assistant."},
                        {"role": "user", "content": message},
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            assistant_text = data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider unavailable: {str(e)}")

    # Persist assistant reply
    assistant_msg = AIMessage(id=uuid.uuid4(), session_id=session.id,
                               role="assistant", text=assistant_text)
    db.add(assistant_msg)
    await db.flush()
    return assistant_text


async def get_history(student_id: uuid.UUID, db: AsyncSession) -> list[AIMessage]:
    session = await get_or_create_session(student_id, db)
    result = await db.execute(
        select(AIMessage).where(AIMessage.session_id == session.id)
        .order_by(AIMessage.sent_at)
    )
    return result.scalars().all()
