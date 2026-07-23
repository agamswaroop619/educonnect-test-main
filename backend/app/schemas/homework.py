"""Pydantic schemas for the Homework domain."""

import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class HomeworkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    subject: str
    title: str
    assigned: date
    due: date
    status: str
    grade: Optional[float] = None
    resources: int = 0


class HomeworkCreateRequest(BaseModel):
    title: str
    subject_id: uuid.UUID
    class_id: uuid.UUID
    due_date: date
    description: Optional[str] = None
    max_marks: Optional[float] = None


class HomeworkUpdateRequest(BaseModel):
    title: Optional[str] = None
    subject_id: Optional[uuid.UUID] = None
    due_date: Optional[date] = None
    description: Optional[str] = None


class HomeworkGradeRequest(BaseModel):
    grade: float

    @field_validator("grade")
    @classmethod
    def validate_grade(cls, v: float) -> float:
        if not (0 <= v <= 100):
            raise ValueError("Grade must be between 0 and 100")
        return v


class SubmitHomeworkRequest(BaseModel):
    file_url: Optional[str] = None
