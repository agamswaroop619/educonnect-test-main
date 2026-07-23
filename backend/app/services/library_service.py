"""Library service."""

import uuid
from datetime import date, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.library import LibraryBook, LibraryIssue
from app.config import settings


async def get_student_library(student_id: uuid.UUID, db: AsyncSession) -> dict:
    today = date.today()
    result = await db.execute(
        select(LibraryIssue, LibraryBook)
        .join(LibraryBook, LibraryBook.id == LibraryIssue.book_id)
        .where(LibraryIssue.student_id == student_id)
        .order_by(LibraryIssue.issued_date.desc())
    )
    rows = result.all()

    issued, overdue, history = [], [], []
    for issue, book in rows:
        if issue.returned_date:
            history.append({"id": issue.id, "title": book.title, "author": book.author,
                             "issued": issue.issued_date, "returned": issue.returned_date})
        elif issue.due_date < today:
            days_over = (today - issue.due_date).days
            fine = float(Decimal(str(days_over)) * settings.DAILY_LIBRARY_FINE_RATE)
            overdue.append({"id": issue.id, "title": book.title, "author": book.author,
                            "issued": issue.issued_date, "due": issue.due_date, "fine": fine})
        else:
            issued.append({"id": issue.id, "title": book.title, "author": book.author,
                           "issued": issue.issued_date, "due": issue.due_date})

    return {"issued": issued, "overdue": overdue, "history": history}


async def issue_book(student_id: uuid.UUID, book_id: uuid.UUID, db: AsyncSession) -> LibraryIssue:
    book_result = await db.execute(select(LibraryBook).where(LibraryBook.id == book_id))
    book = book_result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies < 1:
        raise HTTPException(status_code=409, detail="No copies available")

    today = date.today()
    issue = LibraryIssue(
        id=uuid.uuid4(),
        book_id=book_id,
        student_id=student_id,
        issued_date=today,
        due_date=today + timedelta(days=14),
    )
    book.available_copies -= 1
    db.add(issue)
    await db.flush()
    return issue


async def return_book(record_id: uuid.UUID, db: AsyncSession) -> dict:
    result = await db.execute(select(LibraryIssue, LibraryBook)
                               .join(LibraryBook, LibraryBook.id == LibraryIssue.book_id)
                               .where(LibraryIssue.id == record_id))
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Issue record not found")
    issue, book = row
    if issue.returned_date:
        raise HTTPException(status_code=409, detail="Book already returned")

    today = date.today()
    issue.returned_date = today
    days_over = max(0, (today - issue.due_date).days)
    fine = float(Decimal(str(days_over)) * settings.DAILY_LIBRARY_FINE_RATE)
    issue.fine_amount = fine
    book.available_copies += 1
    await db.flush()
    return {"fine": fine}
