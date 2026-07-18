"""Fees router — /api/v1/fees"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Student
from app.models.finance import FeeTransaction
from app.schemas.fees import FeeTransactionCreateRequest
from app.services.fee_service import get_student_fees

router = APIRouter(prefix="/fees", tags=["fees"])


@router.get("/me")
async def my_fees(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await get_student_fees(student.id, db)


@router.get("/{student_id}")
async def student_fees(student_id: uuid.UUID, current_user: CurrentUser,
                        db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("school_admin", "parent"):
        raise HTTPException(status_code=403, detail="Access denied")
    return await get_student_fees(student_id, db)


@router.post("/transactions", status_code=201)
async def record_payment(body: FeeTransactionCreateRequest, current_user: CurrentUser,
                          db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    from datetime import datetime, timezone
    tx = FeeTransaction(
        id=uuid.uuid4(),
        student_id=body.student_id,
        label=body.label,
        amount=body.amount,
        payment_method=body.method,
        status="success",
        paid_at=datetime.now(timezone.utc),
    )
    db.add(tx)
    await db.commit()
    return {"id": tx.id}
