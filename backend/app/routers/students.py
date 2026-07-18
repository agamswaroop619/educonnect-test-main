"""Students router — /api/v1/students"""

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser, require_roles
from app.models.people import Student
from app.services.student_service import get_student_profile
from sqlalchemy import select

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/me")
async def get_my_profile(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    student_result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = student_result.scalar_one_or_none()
    if not student:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Student profile not found")
    return await get_student_profile(student.id, db)


@router.get("/{student_id}")
async def get_student(student_id: uuid.UUID, current_user: CurrentUser,
                      db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin", "parent"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    return await get_student_profile(student_id, db)
