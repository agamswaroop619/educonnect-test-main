"""Fee service — dynamic fee computation."""

import uuid
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.finance import FeeStructure, FeeTransaction
from app.models.people import Student


async def get_student_fees(student_id: uuid.UUID, db: AsyncSession) -> dict:
    # Get student's class
    s_result = await db.execute(select(Student).where(Student.id == student_id))
    student = s_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Fee structure for the class
    fs_result = await db.execute(
        select(FeeStructure).where(FeeStructure.class_id == student.class_id)
    )
    structures = fs_result.scalars().all()
    total_annual = float(sum(fs.amount for fs in structures))
    structure_out = [{"label": fs.label, "amount": float(fs.amount)} for fs in structures]

    # Transactions
    tx_result = await db.execute(
        select(FeeTransaction).where(FeeTransaction.student_id == student_id)
        .order_by(FeeTransaction.created_at.desc())
    )
    transactions = tx_result.scalars().all()
    paid = float(sum(tx.amount for tx in transactions if tx.status == "success"))
    due = total_annual - paid

    # Next due date
    today = date.today()
    future_due = [fs.due_date for fs in structures if fs.due_date and fs.due_date >= today]
    next_due = min(future_due) if future_due else None

    tx_out = [
        {
            "id": tx.id, "date": tx.paid_at or tx.created_at,
            "label": tx.label, "amount": float(tx.amount),
            "method": tx.payment_method, "status": tx.status,
        }
        for tx in transactions
    ]
    return {
        "totalAnnual": total_annual, "paid": paid, "due": due,
        "nextDueDate": next_due, "structure": structure_out, "transactions": tx_out,
    }
