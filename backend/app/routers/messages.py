"""Messages router — /api/v1/messages"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.schemas.messages import MessageCreateRequest, MessageReplyRequest
from app.services.message_service import (
    get_thread, list_threads, reply_to_thread, send_message
)

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("")
async def get_threads(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await list_threads(current_user.id, db)


@router.get("/{thread_id}")
async def get_thread_detail(thread_id: uuid.UUID, current_user: CurrentUser,
                             db: AsyncSession = Depends(get_db)):
    return await get_thread(thread_id, current_user.id, db)


@router.post("", status_code=201)
async def send(body: MessageCreateRequest, current_user: CurrentUser,
               db: AsyncSession = Depends(get_db)):
    msg = await send_message(current_user.id, body.to_user_id, body.subject, body.body, db)
    await db.commit()
    return {"id": msg.id}


@router.post("/{thread_id}/reply", status_code=201)
async def reply(thread_id: uuid.UUID, body: MessageReplyRequest, current_user: CurrentUser,
                db: AsyncSession = Depends(get_db)):
    msg = await reply_to_thread(thread_id, current_user.id, body.body, db)
    await db.commit()
    return {"id": msg.id}


@router.put("/{thread_id}/read")
async def mark_read(thread_id: uuid.UUID, current_user: CurrentUser,
                     db: AsyncSession = Depends(get_db)):
    await get_thread(thread_id, current_user.id, db)
    await db.commit()
    return {"status": "read"}
