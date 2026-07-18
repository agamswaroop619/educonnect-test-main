"""Notification service — helper to insert notification rows."""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import Notification


async def notify(
    user_id: uuid.UUID,
    type: str,
    title: str,
    body: str,
    db: AsyncSession,
    action_url: Optional[str] = None,
) -> None:
    """Insert a notification row for the given user. Fire-and-forget."""
    notif = Notification(
        id=uuid.uuid4(),
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        action_url=action_url,
    )
    db.add(notif)
    # Caller is responsible for committing the session
