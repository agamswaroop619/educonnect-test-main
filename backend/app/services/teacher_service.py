"""Teacher service — class roster and subject overviews."""

import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academics import Grade, SubjectProgress
from app.models.attendance import AttendanceRecord
from app.models.people import Student, Teacher
from app.models.auth import User
from app.models.school import Class, Subject, TeachingAssignment


def _performance_status(cgpa: float) -> str:
    if cgpa >= 9.0:
        return "Excellent"
    if cgpa >= 7.0:
        return "Good"
    if cgpa >= 5.0:
        return "Average"
    return "Needs Attention"


def _performance_classification(avg: float) -> str:
    if avg >= 85:
        return "Excellent"
    if avg >= 65:
        return "Good"
    return "Average"


async def get_class_roster(teacher_id: uuid.UUID, db: AsyncSession,
                            status_filter: str | None = None,
                            search: str | None = None) -> list[dict]:
    # Find teacher's class
    teacher_result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    teacher = teacher_result.scalar_one_or_none()
    if not teacher:
        return []

    class_result = await db.execute(select(Class).where(Class.class_teacher_id == teacher_id))
    cls = class_result.scalar_one_or_none()
    if not cls:
        return []

    # Get all students in the class
    students_result = await db.execute(
        select(Student, User)
        .join(User, User.id == Student.user_id)
        .where(Student.class_id == cls.id)
    )
    students = students_result.all()

    roster = []
    for student, user in students:
        name = user.email.split("@")[0].title()

        # Search filter
        if search and search.lower() not in name.lower() and search not in student.roll_no:
            continue

        # Attendance %
        att_result = await db.execute(
            select(func.count().filter(AttendanceRecord.status == "present"),
                   func.count())
            .where(AttendanceRecord.student_id == student.id)
        )
        att_row = att_result.first()
        present = att_row[0] or 0
        total = att_row[1] or 1
        att_pct = round((present / total) * 100, 1)

        # CGPA
        grades_result = await db.execute(select(Grade).where(Grade.student_id == student.id))
        grades = grades_result.scalars().all()
        cgpa = round(sum((g.marks_obtained / g.max_marks) * 10 for g in grades) / len(grades), 2) if grades else 0.0

        perf = _performance_status(cgpa)

        # Status filter
        if status_filter and perf != status_filter:
            continue

        roster.append({
            "id": student.id,
            "name": name,
            "rollNo": student.roll_no,
            "attendancePct": att_pct,
            "cgpa": cgpa,
            "trend": "stable",
            "performanceStatus": perf,
        })
    return roster


async def get_teacher_subjects(teacher_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(TeachingAssignment, Subject)
        .join(Subject, Subject.id == TeachingAssignment.subject_id)
        .where(TeachingAssignment.teacher_id == teacher_id)
    )
    rows = result.all()
    subjects = []
    for ta, subj in rows:
        avg_result = await db.execute(
            select(func.avg(Grade.marks_obtained))
            .where(Grade.subject_id == subj.id)
        )
        avg = float(avg_result.scalar() or 0)
        subjects.append({
            "id": subj.id,
            "name": subj.name,
            "classAverage": round(avg, 1),
            "periodsPerWeek": 5,
            "performanceClassification": _performance_classification(avg),
        })
    return subjects
