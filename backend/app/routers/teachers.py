"""Teachers router — /api/v1/teachers"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Teacher
from app.services.teacher_service import get_class_roster, get_teacher_subjects

router = APIRouter(prefix="/teachers", tags=["teachers"])


@router.get("/me/class")
async def my_class_roster(current_user: CurrentUser, db: AsyncSession = Depends(get_db),
                            status: Optional[str] = Query(None),
                            search: Optional[str] = Query(None)):
    if current_user.role not in ("teacher", "school_admin"):
        raise HTTPException(status_code=403, detail="Teachers only")
    result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return await get_class_roster(teacher.id, db, status_filter=status, search=search)


@router.get("/me/subjects")
async def my_subjects(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin"):
        raise HTTPException(status_code=403, detail="Teachers only")
    result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return await get_teacher_subjects(teacher.id, db)


@router.get("/me")
async def my_teacher_profile(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"id": teacher.id, "employee_id": teacher.employee_id,
            "designation": teacher.designation, "department": teacher.department}


@router.get("/{teacher_id}")
async def get_teacher(teacher_id: uuid.UUID, current_user: CurrentUser,
                       db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin"):
        raise HTTPException(status_code=403, detail="Access denied")
    result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"id": teacher.id, "employee_id": teacher.employee_id,
            "designation": teacher.designation, "department": teacher.department}
