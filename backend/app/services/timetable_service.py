"""Timetable service."""

import uuid
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.scheduling import TimetableSlot
from app.models.school import Subject

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


async def get_class_timetable(class_id: uuid.UUID, db: AsyncSession) -> dict:
    result = await db.execute(
        select(TimetableSlot, Subject)
        .join(Subject, Subject.id == TimetableSlot.subject_id)
        .where(TimetableSlot.class_id == class_id)
        .order_by(TimetableSlot.period_no, TimetableSlot.day_of_week)
    )
    rows = result.all()

    # Build period → day grid
    grid: dict[int, dict] = {}
    for slot, subj in rows:
        p = slot.period_no
        if p not in grid:
            time_str = f"{slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')}"
            grid[p] = {"time": time_str, "slots": [None] * 6}
        grid[p]["slots"][slot.day_of_week] = subj.name

    periods = [{"time": v["time"], "slots": v["slots"]} for _, v in sorted(grid.items())]
    return {"days": DAYS, "periods": periods}


async def create_timetable_slot(data: dict, db: AsyncSession) -> TimetableSlot:
    slot = TimetableSlot(id=uuid.uuid4(), **data)
    db.add(slot)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Timetable slot conflict: same class/day/period already exists",
        )
    return slot
