"""Homework router — /api/v1/homework"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.academics import Homework, Submission
from app.models.people import Student, Teacher
from app.schemas.homework import HomeworkCreateRequest, HomeworkGradeRequest, HomeworkUpdateRequest, SubmitHomeworkRequest
from app.services.homework_service import create_homework, get_student_homework, grade_homework

router = APIRouter(prefix="/homework", tags=["homework"])


@router.get("/me")
async def my_homework(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await get_student_homework(student.id, db)


@router.post("", status_code=201)
async def create(body: HomeworkCreateRequest, current_user: CurrentUser,
                 db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin"):
        raise HTTPException(status_code=403, detail="Teachers only")
    teacher_result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
    teacher = teacher_result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    hw = await create_homework(body.model_dump(), teacher.id, db)
    await db.commit()
    return {"id": hw.id, "title": hw.title}


@router.put("/{homework_id}")
async def update_homework(homework_id: uuid.UUID, body: HomeworkUpdateRequest,
                           current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Homework).where(Homework.id == homework_id))
    hw = result.scalar_one_or_none()
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")
    teacher_result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
    teacher = teacher_result.scalar_one_or_none()
    if not teacher or hw.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="Not your homework assignment")
    if body.title:
        hw.title = body.title
    if body.due_date:
        hw.due_date = body.due_date
    if body.description is not None:
        hw.description = body.description
    await db.commit()
    return {"id": hw.id}


@router.delete("/{homework_id}", status_code=204)
async def delete_homework(homework_id: uuid.UUID, current_user: CurrentUser,
                           db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Homework).where(Homework.id == homework_id))
    hw = result.scalar_one_or_none()
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")
    if current_user.role == "teacher":
        teacher_result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
        teacher = teacher_result.scalar_one_or_none()
        if not teacher or hw.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="Not your homework assignment")
    hw.is_deleted = True
    await db.commit()


@router.post("/{homework_id}/submit")
async def submit(homework_id: uuid.UUID, body: SubmitHomeworkRequest,
                 current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    student_result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    sub_result = await db.execute(
        select(Submission).where(
            Submission.homework_id == homework_id, Submission.student_id == student.id
        )
    )
    sub = sub_result.scalar_one_or_none()
    if sub:
        sub.status = "submitted"
        if body.file_url:
            sub.file_url = body.file_url
    else:
        from datetime import datetime, timezone
        sub = Submission(
            id=uuid.uuid4(), homework_id=homework_id, student_id=student.id,
            status="submitted", file_url=body.file_url,
            submitted_at=datetime.now(timezone.utc),
        )
        db.add(sub)
    await db.commit()
    return {"status": "submitted"}


@router.post("/{homework_id}/grade")
async def grade(homework_id: uuid.UUID, body: HomeworkGradeRequest,
                current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    teacher_result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
    teacher = teacher_result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=403, detail="Teachers only")
    # Grade first submission for this homework (simplified)
    sub_result = await db.execute(
        select(Submission).where(Submission.homework_id == homework_id).limit(1)
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub.marks_obtained = body.grade
    sub.status = "graded"
    await db.commit()
    return {"grade": body.grade}
