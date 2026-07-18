"""Reports router — /api/v1/reports"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Student, Teacher
from app.models.academics import Grade
from app.schemas.reports import GradeCreateRequest
from app.services.report_service import get_student_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/me")
async def my_report(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await get_student_report(student.id, db)


@router.get("/{student_id}")
async def student_report(student_id: uuid.UUID, current_user: CurrentUser,
                          db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin", "parent"):
        raise HTTPException(status_code=403, detail="Access denied")
    return await get_student_report(student_id, db)


@router.post("", status_code=201)
async def create_grade(body: GradeCreateRequest, current_user: CurrentUser,
                        db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin"):
        raise HTTPException(status_code=403, detail="Teachers only")
    teacher_result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
    teacher = teacher_result.scalar_one_or_none()
    teacher_id = teacher.id if teacher else current_user.id
    grade = Grade(
        id=uuid.uuid4(),
        student_id=body.student_id,
        subject_id=body.subject_id,
        term_id=body.term_id,
        marks_obtained=body.marks_obtained,
        max_marks=body.max_marks,
        grade_letter=body.grade_letter,
        remarks=body.remarks,
        teacher_id=teacher_id,
    )
    db.add(grade)
    await db.commit()
    return {"id": grade.id}
