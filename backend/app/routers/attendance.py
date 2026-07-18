"""Attendance router — /api/v1/attendance"""

import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Student, Teacher
from app.schemas.attendance import AttendanceSummary, AttendanceMarkRequest
from app.services.attendance_service import get_student_attendance_summary, mark_class_attendance

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("/me", response_model=AttendanceSummary)
async def my_attendance(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Student not found")
    data = await get_student_attendance_summary(student.id, db)
    return AttendanceSummary(**data)


@router.get("/{student_id}", response_model=AttendanceSummary)
async def student_attendance(student_id: uuid.UUID, current_user: CurrentUser,
                              db: AsyncSession = Depends(get_db)):
    data = await get_student_attendance_summary(student_id, db)
    return AttendanceSummary(**data)


@router.post("", status_code=201)
async def mark_attendance(body: AttendanceMarkRequest, current_user: CurrentUser,
                           db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Teachers only")
    teacher_result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
    teacher = teacher_result.scalar_one_or_none()
    if not teacher:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    records = [{"student_id": r.student_id, "status": r.status} for r in body.records]
    # Use first student's class_id (teacher marks for their own class)
    if not records:
        return []
    student_result = await db.execute(
        select(Student).where(Student.id == records[0]["student_id"])
    )
    s = student_result.scalar_one_or_none()
    class_id = s.class_id if s else uuid.uuid4()

    await mark_class_attendance(class_id, body.date, records, teacher, db)
    await db.commit()
    return {"marked": len(records)}
