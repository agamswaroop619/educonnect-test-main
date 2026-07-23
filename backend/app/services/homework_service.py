"""Homework service."""

import uuid
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academics import Homework, Submission
from app.models.school import Subject


async def get_student_homework(student_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    today = date.today()
    # Get all homework for classes this student is in
    result = await db.execute(
        select(Homework, Subject, Submission)
        .join(Subject, Subject.id == Homework.subject_id)
        .outerjoin(
            Submission,
            (Submission.homework_id == Homework.id) & (Submission.student_id == student_id)
        )
        .where(Homework.is_deleted == False)  # noqa: E712
    )
    rows = result.all()
    out = []
    for hw, subj, sub in rows:
        if sub:
            hw_status = sub.status
        elif hw.due_date < today:
            hw_status = "overdue"
        else:
            hw_status = "pending"
        out.append({
            "id": hw.id,
            "subject": subj.name,
            "title": hw.title,
            "assigned": hw.assigned_date,
            "due": hw.due_date,
            "status": hw_status,
            "grade": sub.marks_obtained if sub else None,
            "resources": 0,
        })
    return out


async def create_homework(data: dict, teacher_id: uuid.UUID, db: AsyncSession) -> Homework:
    hw = Homework(
        id=uuid.uuid4(),
        class_id=data["class_id"],
        subject_id=data["subject_id"],
        teacher_id=teacher_id,
        title=data["title"],
        description=data.get("description"),
        assigned_date=date.today(),
        due_date=data["due_date"],
        max_marks=data.get("max_marks"),
    )
    db.add(hw)
    await db.flush()
    return hw


async def grade_homework(homework_id: uuid.UUID, student_id: uuid.UUID, grade: float,
                         teacher_id: uuid.UUID, db: AsyncSession) -> Submission:
    result = await db.execute(
        select(Homework).where(Homework.id == homework_id)
    )
    hw = result.scalar_one_or_none()
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")
    if hw.teacher_id != teacher_id:
        raise HTTPException(status_code=403, detail="Not your homework assignment")

    sub_result = await db.execute(
        select(Submission).where(
            Submission.homework_id == homework_id,
            Submission.student_id == student_id,
        )
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.marks_obtained = grade
    sub.status = "graded"
    await db.flush()
    return sub
