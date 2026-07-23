"""Attendance service."""

import uuid
from calendar import month_abbr
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import AttendanceRecord
from app.models.people import Student, Teacher
from app.models.school import TeachingAssignment


async def get_student_attendance_summary(student_id: uuid.UUID, db: AsyncSession) -> dict:
    today = date.today()

    # All records for this student
    result = await db.execute(
        select(AttendanceRecord)
        .where(AttendanceRecord.student_id == student_id)
        .order_by(AttendanceRecord.date.desc())
    )
    records = result.scalars().all()

    present = sum(1 for r in records if r.status == "present")
    absent = sum(1 for r in records if r.status == "absent")
    leave = sum(1 for r in records if r.status == "leave")
    total = len(records)

    # Streak: consecutive present days ending today
    streak = 0
    check_date = today
    date_map = {r.date: r.status for r in records}
    while True:
        s = date_map.get(check_date)
        if s == "present":
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Last 30 days
    recent = []
    for i in range(30):
        d = today - timedelta(days=i)
        s = date_map.get(d, "absent")
        recent.append({"date": d, "status": s})

    # Monthly % for last 6 months
    monthly = []
    for i in range(5, -1, -1):
        month_start = (today.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        label = month_abbr[month_start.month]
        month_records = [r for r in records if r.date.year == month_start.year and r.date.month == month_start.month]
        if month_records:
            p = sum(1 for r in month_records if r.status == "present")
            pct = round((p / len(month_records)) * 100, 1)
        else:
            pct = 0.0
        monthly.append({"month": label, "pct": pct})

    return {
        "present": present, "absent": absent, "leave": leave, "total": total,
        "streak": streak, "monthly": monthly, "recent": recent,
    }


async def mark_class_attendance(
    class_id: uuid.UUID,
    mark_date: date,
    records: list[dict],
    teacher: Teacher,
    db: AsyncSession,
) -> list[AttendanceRecord]:
    """Bulk insert attendance records. Raises 409 on duplicate."""
    created = []
    for item in records:
        ar = AttendanceRecord(
            id=uuid.uuid4(),
            student_id=item["student_id"],
            class_id=class_id,
            date=mark_date,
            status=item["status"],
            marked_by=teacher.id,
            marked_at=datetime.now(timezone.utc),
        )
        db.add(ar)
        created.append(ar)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate attendance record for one or more students on this date",
        )
    return created
