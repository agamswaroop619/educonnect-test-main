"""Admin router — /api/v1/admin"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Admin, Student
from app.models.auth import User
from app.services.admin_service import get_all_classes
from app.services.teacher_service import _performance_status
from app.services.student_service import get_student_profile

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/classes")
async def all_classes(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    admin_result = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
    admin = admin_result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")
    return await get_all_classes(admin.school_id, db)


@router.get("/classes/{class_id}/students")
async def class_students(class_id: uuid.UUID, current_user: CurrentUser,
                          db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    students_result = await db.execute(
        select(Student, User)
        .join(User, User.id == Student.user_id)
        .where(Student.class_id == class_id)
    )
    rows = students_result.all()
    profiles = []
    for student, user in rows:
        profiles.append({
            "id": student.id,
            "name": user.email.split("@")[0].title(),
            "rollNo": student.roll_no,
            "admissionNo": student.admission_no,
        })
    return profiles
