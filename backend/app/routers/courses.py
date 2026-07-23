"""Courses router — /api/v1/courses"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Student
from app.services.course_service import get_student_courses, get_class_courses
from sqlalchemy import select

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/me")
async def my_courses(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Student not found")
    return await get_student_courses(student.id, db)


@router.get("")
async def class_courses(current_user: CurrentUser, class_id: uuid.UUID = Query(...),
                         db: AsyncSession = Depends(get_db)):
    return await get_class_courses(class_id, db)
