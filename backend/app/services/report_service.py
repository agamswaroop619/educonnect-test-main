"""Report / grades service."""

import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.academics import Grade
from app.models.school import Subject, Term
from app.models.people import Student


async def get_student_report(student_id: uuid.UUID, db: AsyncSession) -> dict:
    grades_result = await db.execute(
        select(Grade, Subject, Term)
        .join(Subject, Subject.id == Grade.subject_id)
        .join(Term, Term.id == Grade.term_id)
        .where(Grade.student_id == student_id)
        .order_by(Term.start_date)
    )
    rows = grades_result.all()
    if not rows:
        return {
            "overallGrade": "N/A", "cgpa": 0.0, "rank": 0, "totalStudents": 0,
            "subjects": [], "trend": [], "remarks": {"positive": [], "constructive": []},
        }

    # Latest term subjects
    latest_term_id = rows[-1][2].id
    latest_grades = [(g, s) for g, s, t in rows if t.id == latest_term_id]
    subjects_out = [
        {"name": s.name, "marks": g.marks_obtained, "grade": g.grade_letter, "remark": g.remarks}
        for g, s in latest_grades
    ]

    # CGPA
    all_grades = [g for g, s, t in rows]
    cgpa = round(sum((g.marks_obtained / g.max_marks) * 10 for g in all_grades) / len(all_grades), 2)

    # Trend per term
    term_map: dict[str, list] = {}
    for g, s, t in rows:
        term_map.setdefault(t.label, []).append((g.marks_obtained / g.max_marks) * 10)
    trend = [{"term": label, "cgpa": round(sum(v) / len(v), 2)} for label, v in term_map.items()]

    # Rank within class (approximated — count students with higher CGPA)
    higher_result = await db.execute(
        select(func.count(Grade.student_id.distinct()))
        .where(Grade.marks_obtained > sum(g.marks_obtained for g in all_grades) / len(all_grades))
    )
    rank = (higher_result.scalar() or 0) + 1
    total_result = await db.execute(select(func.count(Grade.student_id.distinct())))
    total = total_result.scalar() or 1

    overall = "A" if cgpa >= 9 else "B" if cgpa >= 7 else "C" if cgpa >= 5 else "D"
    return {
        "overallGrade": overall, "cgpa": cgpa, "rank": rank, "totalStudents": total,
        "subjects": subjects_out, "trend": trend,
        "remarks": {"positive": ["Shows consistent effort"], "constructive": ["Can improve in weaker areas"]},
    }
