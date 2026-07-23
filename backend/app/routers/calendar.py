"""Calendar / Events router — /api/v1/calendar"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Admin
from app.models.scheduling import Event
from app.schemas.calendar import CalendarEventCreateRequest, CalendarEventOut, CalendarEventUpdateRequest

router = APIRouter(prefix="/calendar", tags=["calendar"])


async def _get_school_id(current_user, db):
    result = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
    admin = result.scalar_one_or_none()
    return admin.school_id if admin else None


@router.get("", response_model=list[CalendarEventOut])
async def list_events(current_user: CurrentUser, db: AsyncSession = Depends(get_db),
                       month: Optional[int] = Query(None), year: Optional[int] = Query(None),
                       type: Optional[str] = Query(None)):
    q = select(Event)
    if month:
        from sqlalchemy import extract
        q = q.where(extract("month", Event.event_date) == month)
    if year:
        from sqlalchemy import extract
        q = q.where(extract("year", Event.event_date) == year)
    if type:
        q = q.where(Event.event_type == type)
    result = await db.execute(q.order_by(Event.event_date))
    events = result.scalars().all()
    return [CalendarEventOut(id=e.id, title=e.title, date=e.event_date, type=e.event_type) for e in events]


@router.post("", status_code=201)
async def create_event(body: CalendarEventCreateRequest, current_user: CurrentUser,
                        db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    school_id = await _get_school_id(current_user, db)
    event = Event(id=uuid.uuid4(), school_id=school_id, title=body.title,
                  event_date=body.date, event_type=body.type, description=body.description)
    db.add(event)
    await db.commit()
    return CalendarEventOut(id=event.id, title=event.title, date=event.event_date, type=event.event_type)


@router.put("/{event_id}")
async def update_event(event_id: uuid.UUID, body: CalendarEventUpdateRequest,
                        current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if body.title:
        event.title = body.title
    if body.date:
        event.event_date = body.date
    if body.type:
        event.event_type = body.type
    if body.description is not None:
        event.description = body.description
    await db.commit()
    return CalendarEventOut(id=event.id, title=event.title, date=event.event_date, type=event.event_type)


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: uuid.UUID, current_user: CurrentUser,
                        db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
