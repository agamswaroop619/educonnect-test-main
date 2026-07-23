"""Admin service — school-wide class overview."""

import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academics import Grade
from app.models.attendance import AttendanceRecord
from app.models.people import Student
from app.models.school import Class


async def get_all_classes(school_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    classes_result = await db.execute(select(Class).where(Class.school_id == school_id))
    classes = classes_result.scalars().all()
    out = []
    for cls in classes:
        # Students
        students_result = await db.execute(
            select(Student).where(Student.class_id == cls.id)
        )
        students = students_result.scalars().all()
        if not students:
            out.append({"id": cls.id, "name": cls.name,
                         "avgCgpa": 0.0, "avgAttendancePct": 0.0, "studentsNeedingAttention": 0})
            continue

        # Average CGPA
        all_cgpas = []
        needs_attention = 0
        for s in students:
            grades_result = await db.execute(select(Grade).where(Grade.student_id == s.id))
            grades = grades_result.scalars().all()
            cgpa = round(sum((g.marks_obtained / g.max_marks) * 10 for g in grades) / len(grades), 2) if grades else 0.0
            all_cgpas.append(cgpa)
            if cgpa < 5.0:
                needs_attention += 1

        avg_cgpa = round(sum(all_cgpas) / len(all_cgpas), 2)

        # Average attendance
        att_result = await db.execute(
            select(func.count().filter(AttendanceRecord.status == "present"),
                   func.count())
            .where(AttendanceRecord.class_id == cls.id)
        )
        att_row = att_result.first()
        avg_att = round(((att_row[0] or 0) / max(att_row[1] or 1, 1)) * 100, 1)

        out.append({"id": cls.id, "name": cls.name, "avgCgpa": avg_cgpa,
                     "avgAttendancePct": avg_att, "studentsNeedingAttention": needs_attention})
    return out
