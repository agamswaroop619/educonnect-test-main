"""Student service — profile assembly with computed fields."""

import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import AttendanceRecord
from app.models.academics import Grade
from app.models.people import Parent, Student, StudentParent, Teacher
from app.models.auth import User
from app.models.school import AcademicYear, Term


async def get_student_profile(student_id: uuid.UUID, db: AsyncSession) -> dict:
    """Assemble full student profile with computed attendance % and CGPA."""
    # Student record
    result = await db.execute(
        select(Student, User)
        .join(User, User.id == Student.user_id)
        .where(Student.id == student_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    student, user = row

    # Attendance percentage
    att_result = await db.execute(
        select(
            func.count().filter(AttendanceRecord.status == "present").label("present"),
            func.count().filter(AttendanceRecord.status == "absent").label("absent"),
            func.count().filter(AttendanceRecord.status == "leave").label("leave"),
            func.count().label("total"),
        ).where(AttendanceRecord.student_id == student_id)
    )
    att = att_result.first()
    present = att.present or 0
    total = att.total or 0
    attendance_pct = round((present / total) * 100, 1) if total > 0 else 0.0

    # CGPA — average of (marks_obtained / max_marks) * 10 across all grades
    grades_result = await db.execute(
        select(Grade).where(Grade.student_id == student_id)
    )
    grades = grades_result.scalars().all()
    if grades:
        cgpa = round(sum((g.marks_obtained / g.max_marks) * 10 for g in grades) / len(grades), 2)
    else:
        cgpa = 0.0

    # Days left in current academic year
    ay_result = await db.execute(select(AcademicYear).where(AcademicYear.is_current == True))  # noqa: E712
    ay = ay_result.scalar_one_or_none()
    days_left = (ay.end_date - date.today()).days if ay else 0

    # Parent info (first linked parent)
    sp_result = await db.execute(
        select(StudentParent, Parent, User)
        .join(Parent, Parent.id == StudentParent.parent_id)
        .join(User, User.id == Parent.user_id)
        .where(StudentParent.student_id == student_id)
        .limit(1)
    )
    sp_row = sp_result.first()
    parent_info = None
    if sp_row:
        _, parent, parent_user = sp_row
        parent_info = {
            "name": parent_user.email,
            "relation": sp_row[0].relation,
            "email": parent_user.email,
            "phone": None,
            "occupation": parent.occupation,
            "verified": parent.verified,
        }

    return {
        "id": student.id,
        "name": user.email.split("@")[0].title(),
        "grade": str(student.class_id),
        "rollNo": student.roll_no,
        "admissionNo": student.admission_no,
        "dob": student.dob,
        "bloodGroup": student.blood_group,
        "address": student.address,
        "email": user.email,
        "phone": None,
        "house": student.house,
        "photo": student.photo_url,
        "attendancePct": attendance_pct,
        "cgpa": cgpa,
        "daysLeft": max(days_left, 0),
        "parent": parent_info,
    }
