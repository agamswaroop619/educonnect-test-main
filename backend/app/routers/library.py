"""Library router — /api/v1/library"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.library import LibraryBook
from app.models.people import Student
from app.schemas.library import LibraryIssueRequest, LibraryReturnRequest
from app.services.library_service import get_student_library, issue_book, return_book

router = APIRouter(prefix="/library", tags=["library"])


@router.get("/me")
async def my_library(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await get_student_library(student.id, db)


@router.get("/books")
async def search_books(current_user: CurrentUser, db: AsyncSession = Depends(get_db),
                        q: Optional[str] = Query(None), category: Optional[str] = Query(None)):
    query = select(LibraryBook)
    if q:
        query = query.where(LibraryBook.title.ilike(f"%{q}%"))
    if category:
        query = query.where(LibraryBook.category == category)
    result = await db.execute(query)
    books = result.scalars().all()
    return [{"id": b.id, "title": b.title, "author": b.author, "isbn": b.isbn,
             "category": b.category, "available_copies": b.available_copies} for b in books]


@router.get("/{student_id}")
async def student_library(student_id: uuid.UUID, current_user: CurrentUser,
                           db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("school_admin", "teacher"):
        raise HTTPException(status_code=403, detail="Admin/teacher only")
    return await get_student_library(student_id, db)


@router.post("/issue", status_code=201)
async def issue(body: LibraryIssueRequest, current_user: CurrentUser,
                db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("school_admin", "teacher"):
        raise HTTPException(status_code=403, detail="Admin/teacher only")
    record = await issue_book(body.student_id, body.book_id, db)
    await db.commit()
    return {"id": record.id, "due_date": record.due_date}


@router.post("/return")
async def return_book_route(body: LibraryReturnRequest, current_user: CurrentUser,
                             db: AsyncSession = Depends(get_db)):
    if current_user.role not in ("school_admin", "teacher"):
        raise HTTPException(status_code=403, detail="Admin/teacher only")
    result = await return_book(body.record_id, db)
    await db.commit()
    return result
