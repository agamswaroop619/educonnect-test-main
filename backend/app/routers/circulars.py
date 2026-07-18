"""Circulars router — /api/v1/circulars"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.communication import Circular, CircularVisibility
from app.models.people import Admin
from app.schemas.circulars import CircularCreateRequest, CircularOut, CircularUpdateRequest
from app.services.circular_service import list_circulars

router = APIRouter(prefix="/circulars", tags=["circulars"])


async def _get_school_id(current_user, db):
    result = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
    admin = result.scalar_one_or_none()
    return admin.school_id if admin else None


@router.get("", response_model=list[CircularOut])
async def get_circulars(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    school_result = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
    admin = school_result.scalar_one_or_none()
    if admin:
        school_id = admin.school_id
    else:
        from app.models.people import Student, Teacher
        for model in [Student, Teacher]:
            r = await db.execute(select(model).where(model.user_id == current_user.id))
            p = r.scalar_one_or_none()
            if p:
                school_id = p.school_id
                break
        else:
            return []
    circulars = await list_circulars(current_user.role, school_id, db)
    return [CircularOut(id=c.id, title=c.title, category=c.category,
                        date=c.published_at, pinned=c.pinned, excerpt=c.excerpt)
            for c in circulars]


@router.get("/{circular_id}")
async def get_circular(circular_id: uuid.UUID, current_user: CurrentUser,
                        db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Circular).where(Circular.id == circular_id,
                                                      Circular.is_archived == False))  # noqa: E712
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Circular not found")
    return {"id": c.id, "title": c.title, "body": c.body, "category": c.category,
            "date": c.published_at, "pinned": c.pinned}


@router.post("", status_code=201)
async def create_circular(body: CircularCreateRequest, current_user: CurrentUser,
                           db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin"):
        raise HTTPException(status_code=403, detail="Teachers and admins only")
    school_id = await _get_school_id(current_user, db)
    circ = Circular(id=uuid.uuid4(), school_id=school_id, author_id=current_user.id,
                    title=body.title, body=body.body, category=body.category,
                    excerpt=body.excerpt, pinned=body.pinned)
    db.add(circ)
    await db.flush()
    for role in body.visible_to:
        cv = CircularVisibility(id=uuid.uuid4(), circular_id=circ.id, role=role)
        db.add(cv)
    await db.commit()
    return {"id": circ.id}


@router.put("/{circular_id}")
async def update_circular(circular_id: uuid.UUID, body: CircularUpdateRequest,
                           current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Circular not found")
    if body.title:
        c.title = body.title
    if body.body:
        c.body = body.body
    if body.excerpt is not None:
        c.excerpt = body.excerpt
    if body.pinned is not None:
        c.pinned = body.pinned
    await db.commit()
    return {"id": c.id}


@router.delete("/{circular_id}", status_code=204)
async def delete_circular(circular_id: uuid.UUID, current_user: CurrentUser,
                           db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Circular not found")
    c.is_archived = True
    await db.commit()
