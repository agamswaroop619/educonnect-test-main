"""Leave request service."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheduling import LeaveRequest


async def create_leave(student_id: uuid.UUID, data: dict, db: AsyncSession) -> LeaveRequest:
    lr = LeaveRequest(
        id=uuid.uuid4(),
        student_id=student_id,
        from_date=data["from_date"],
        to_date=data["to_date"],
        reason=data["reason"],
        status="pending",
    )
    db.add(lr)
    await db.flush()
    return lr


async def review_leave(leave_id: uuid.UUID, new_status: str, reviewer_id: uuid.UUID,
                       db: AsyncSession) -> LeaveRequest:
    result = await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))
    lr = result.scalar_one_or_none()
    if not lr:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if lr.status in ("approved", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Leave request is already in terminal state: {lr.status}",
        )
    lr.status = new_status
    lr.reviewed_by = reviewer_id
    lr.reviewed_at = datetime.now(timezone.utc)
    await db.flush()
    return lr
