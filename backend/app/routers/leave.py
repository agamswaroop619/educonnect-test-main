"""Leave requests router — /api/v1/leaves"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Student, Teacher
from app.models.scheduling import LeaveRequest
from app.schemas.leave import LeaveCreateRequest, LeaveReviewRequest, LeaveRequestOut
from app.services.leave_service import create_leave, review_leave

router = APIRouter(prefix="/leaves", tags=["leave"])


@router.post("", status_code=201)
async def submit_leave(body: LeaveCreateRequest, current_user: CurrentUser,
                       db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    lr = await create_leave(student.id, body.model_dump(), db)
    await db.commit()
    return {"id": lr.id, "status": lr.status}


@router.get("/me")
async def my_leave_requests(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        return []
    lr_result = await db.execute(
        select(LeaveRequest).where(LeaveRequest.student_id == student.id)
        .order_by(LeaveRequest.applied_on.desc())
    )
    items = lr_result.scalars().all()
    return [
        {"id": lr.id, "from_date": lr.from_date, "to_date": lr.to_date,
         "reason": lr.reason, "status": lr.status, "appliedOn": lr.applied_on.date()}
        for lr in items
    ]


@router.put("/{leave_id}/approve")
async def approve_leave(leave_id: uuid.UUID, current_user: CurrentUser,
                         db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin"):
        raise HTTPException(status_code=403, detail="Teachers only")
    teacher_result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
    teacher = teacher_result.scalar_one_or_none()
    reviewer_id = teacher.id if teacher else current_user.id
    lr = await review_leave(leave_id, "approved", reviewer_id, db)
    await db.commit()
    return {"id": lr.id, "status": lr.status}


@router.put("/{leave_id}/reject")
async def reject_leave(leave_id: uuid.UUID, current_user: CurrentUser,
                        db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("teacher", "school_admin"):
        raise HTTPException(status_code=403, detail="Teachers only")
    teacher_result = await db.execute(select(Teacher).where(Teacher.user_id == current_user.id))
    teacher = teacher_result.scalar_one_or_none()
    reviewer_id = teacher.id if teacher else current_user.id
    lr = await review_leave(leave_id, "rejected", reviewer_id, db)
    await db.commit()
    return {"id": lr.id, "status": lr.status}
