"""Course / subject progress service."""

import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academics import SubjectProgress
from app.models.school import Subject, TeachingAssignment, Enrollment


async def get_student_courses(student_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(SubjectProgress, Subject)
        .join(Subject, Subject.id == SubjectProgress.subject_id)
        .where(SubjectProgress.student_id == student_id)
    )
    rows = result.all()
    courses = []
    for sp, subj in rows:
        total = sp.total_chapters or 1
        progress = int((sp.chapters_completed / total) * 100)
        courses.append({
            "id": subj.id,
            "name": subj.name,
            "chapters": {"completed": sp.chapters_completed, "total": sp.total_chapters},
            "quizzes": sp.quizzes_done,
            "dpp": sp.dpp_done,
            "progress": progress,
            "color": subj.color_hex,
            "icon": subj.icon,
        })
    return courses


async def get_class_courses(class_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    """Return all subjects for a class with class-wide average progress."""
    # Get all subject progress for all students in the class
    result = await db.execute(
        select(Subject, func.avg(
            (SubjectProgress.chapters_completed * 100.0) / func.nullif(SubjectProgress.total_chapters, 0)
        ).label("avg_progress"))
        .join(SubjectProgress, SubjectProgress.subject_id == Subject.id)
        .join(TeachingAssignment, TeachingAssignment.subject_id == Subject.id)
        .where(TeachingAssignment.class_id == class_id)
        .group_by(Subject.id)
    )
    rows = result.all()
    courses = []
    for subj, avg_prog in rows:
        courses.append({
            "id": subj.id,
            "name": subj.name,
            "chapters": {"completed": 0, "total": 0},
            "quizzes": 0, "dpp": 0,
            "progress": int(avg_prog or 0),
            "color": subj.color_hex, "icon": subj.icon,
            "classAverage": round(float(avg_prog or 0), 1),
        })
    return courses
