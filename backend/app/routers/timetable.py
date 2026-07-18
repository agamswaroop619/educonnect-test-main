"""Timetable router — /api/v1/timetable"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Student
from app.models.scheduling import TimetableSlot
from app.schemas.timetable import TimetableSlotCreateRequest, TimetableSlotUpdateRequest
from app.services.timetable_service import create_timetable_slot, get_class_timetable

router = APIRouter(prefix="/timetable", tags=["timetable"])


@router.get("/me")
async def my_timetable(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student or not student.class_id:
        raise HTTPException(status_code=404, detail="Student/class not found")
    return await get_class_timetable(student.class_id, db)


@router.get("")
async def class_timetable(current_user: CurrentUser, class_id: uuid.UUID = Query(...),
                            db: AsyncSession = Depends(get_db)):
    return await get_class_timetable(class_id, db)


@router.post("", status_code=201)
async def create_slot(body: TimetableSlotCreateRequest, current_user: CurrentUser,
                       db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    slot = await create_timetable_slot(body.model_dump(), db)
    await db.commit()
    return {"id": slot.id}


@router.put("/{slot_id}")
async def update_slot(slot_id: uuid.UUID, body: TimetableSlotUpdateRequest,
                       current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(TimetableSlot).where(TimetableSlot.id == slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if body.subject_id:
        slot.subject_id = body.subject_id
    if body.teacher_id:
        slot.teacher_id = body.teacher_id
    if body.start_time:
        slot.start_time = body.start_time
    if body.end_time:
        slot.end_time = body.end_time
    await db.commit()
    return {"id": slot.id}


@router.delete("/{slot_id}", status_code=204)
async def delete_slot(slot_id: uuid.UUID, current_user: CurrentUser,
                       db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(TimetableSlot).where(TimetableSlot.id == slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    await db.delete(slot)
    await db.commit()
