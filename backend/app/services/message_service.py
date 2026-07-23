"""Message service — threaded conversations."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.communication import Message
from app.models.auth import User


async def list_threads(user_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    """Return root messages (no parent) where user is sender or recipient."""
    result = await db.execute(
        select(Message, User)
        .join(User, User.id == Message.sender_id)
        .where(
            Message.parent_id == None,  # noqa: E711
            or_(Message.sender_id == user_id, Message.recipient_id == user_id),
        )
        .order_by(Message.sent_at.desc())
    )
    rows = result.all()
    threads = []
    for msg, sender in rows:
        threads.append({
            "id": msg.id,
            "sender_name": sender.email.split("@")[0].title(),
            "sender_role": sender.role,
            "subject": msg.subject,
            "preview": msg.body[:100],
            "time": msg.sent_at,
            "unread": msg.read_at is None and msg.recipient_id == user_id,
            "avatar": sender.email[:2].upper(),
        })
    return threads


async def get_thread(thread_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> dict:
    """Return all messages in a thread. Raises 403 if not a participant."""
    root_result = await db.execute(select(Message).where(Message.id == thread_id))
    root = root_result.scalar_one_or_none()
    if not root:
        raise HTTPException(status_code=404, detail="Thread not found")
    if root.sender_id != user_id and root.recipient_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")

    # Fetch all messages in thread (root + replies)
    all_result = await db.execute(
        select(Message, User)
        .join(User, User.id == Message.sender_id)
        .where(
            or_(Message.id == thread_id, Message.parent_id == thread_id)
        )
        .order_by(Message.sent_at)
    )
    rows = all_result.all()
    messages = []
    for msg, sender in rows:
        messages.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": sender.email.split("@")[0].title(),
            "sender_role": sender.role,
            "body": msg.body,
            "sent_at": msg.sent_at,
            "read": msg.read_at is not None,
        })

    # Mark as read
    if root.recipient_id == user_id and root.read_at is None:
        root.read_at = datetime.now(timezone.utc)
        await db.flush()

    return {"thread_id": thread_id, "subject": root.subject, "messages": messages}


async def send_message(sender_id: uuid.UUID, to_user_id: uuid.UUID, subject: str | None,
                       body: str, db: AsyncSession) -> Message:
    msg = Message(
        id=uuid.uuid4(),
        sender_id=sender_id,
        recipient_id=to_user_id,
        subject=subject,
        body=body,
    )
    db.add(msg)
    await db.flush()
    return msg


async def reply_to_thread(thread_id: uuid.UUID, sender_id: uuid.UUID, body: str,
                          db: AsyncSession) -> Message:
    root_result = await db.execute(select(Message).where(Message.id == thread_id))
    root = root_result.scalar_one_or_none()
    if not root:
        raise HTTPException(status_code=404, detail="Thread not found")
    if root.sender_id != sender_id and root.recipient_id != sender_id:
        raise HTTPException(status_code=403, detail="Not a participant in this thread")

    recipient_id = root.recipient_id if root.sender_id == sender_id else root.sender_id
    reply = Message(
        id=uuid.uuid4(),
        sender_id=sender_id,
        recipient_id=recipient_id,
        body=body,
        parent_id=thread_id,
    )
    db.add(reply)
    await db.flush()
    return reply
