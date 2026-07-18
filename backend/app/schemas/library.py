"""Pydantic schemas for the Library domain."""

import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class IssuedBookOut(BaseModel):
    id: uuid.UUID
    title: str
    author: Optional[str] = None
    issued: date
    due: date


class OverdueBookOut(BaseModel):
    id: uuid.UUID
    title: str
    author: Optional[str] = None
    issued: date
    due: date
    fine: float


class ReturnedBookOut(BaseModel):
    id: uuid.UUID
    title: str
    author: Optional[str] = None
    issued: date
    returned: date


class LibrarySummary(BaseModel):
    issued: list[IssuedBookOut]
    overdue: list[OverdueBookOut]
    history: list[ReturnedBookOut]


class LibraryIssueRequest(BaseModel):
    student_id: uuid.UUID
    book_id: uuid.UUID


class LibraryReturnRequest(BaseModel):
    record_id: uuid.UUID


class BookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    author: Optional[str] = None
    isbn: Optional[str] = None
    category: Optional[str] = None
    available_copies: int
