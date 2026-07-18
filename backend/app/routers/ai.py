"""AI Assistant router — /api/v1/ai"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Student
from app.schemas.ai import AIChatRequest, AIChatResponse, AIMessageOut
from app.services.ai_service import chat, get_history

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=AIChatResponse)
async def send_message(body: AIChatRequest, current_user: CurrentUser,
                        db: AsyncSession = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    response_text = await chat(student.id, body.message, db)
    await db.commit()
    return AIChatResponse(response=response_text)


@router.get("/chat/history", response_model=list[AIMessageOut])
async def chat_history(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    messages = await get_history(student.id, db)
    return [AIMessageOut(id=m.id, role=m.role, text=m.text, sent_at=m.sent_at) for m in messages]
