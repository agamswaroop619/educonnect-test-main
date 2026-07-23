"""Achievements router — /api/v1/achievements"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.content import Achievement
from app.models.people import Student
from app.schemas.achievements import AchievementCreateRequest, AchievementOut

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("/me", response_model=list[AchievementOut])
async def my_achievements(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    ach_result = await db.execute(
        select(Achievement).where(Achievement.student_id == student.id)
        .order_by(Achievement.awarded_date.desc())
    )
    achievements = ach_result.scalars().all()
    return [AchievementOut(id=a.id, title=a.title, date=a.awarded_date, category=a.category)
            for a in achievements]


@router.get("/{student_id}", response_model=list[AchievementOut])
async def student_achievements(student_id: uuid.UUID, current_user: CurrentUser,
                                db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin", "parent"):
        raise HTTPException(status_code=403, detail="Access denied")
    result = await db.execute(
        select(Achievement).where(Achievement.student_id == student_id)
        .order_by(Achievement.awarded_date.desc())
    )
    achievements = result.scalars().all()
    return [AchievementOut(id=a.id, title=a.title, date=a.awarded_date, category=a.category)
            for a in achievements]


@router.post("", status_code=201)
async def create_achievement(body: AchievementCreateRequest, current_user: CurrentUser,
                              db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin"):
        raise HTTPException(status_code=403, detail="Teachers and admins only")
    ach = Achievement(
        id=uuid.uuid4(), student_id=body.student_id, title=body.title,
        category=body.category, awarded_date=body.date, description=body.description,
    )
    db.add(ach)
    await db.commit()
    return AchievementOut(id=ach.id, title=ach.title, date=ach.awarded_date, category=ach.category)


@router.delete("/{achievement_id}", status_code=204)
async def delete_achievement(achievement_id: uuid.UUID, current_user: CurrentUser,
                              db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(Achievement).where(Achievement.id == achievement_id))
    ach = result.scalar_one_or_none()
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")
    await db.delete(ach)
    await db.commit()
