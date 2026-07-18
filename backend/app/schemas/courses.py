"""Pydantic schemas for the Courses / Subject Progress domain."""

import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    chapters: dict  # {"completed": int, "total": int}
    quizzes: int
    dpp: int
    progress: int   # 0-100
    color: Optional[str] = None
    icon: Optional[str] = None


class CourseClassOut(CourseOut):
    classAverage: float = 0.0


class CourseProgressUpdate(BaseModel):
    chapters_completed: Optional[int] = None
    total_chapters: Optional[int] = None
    quizzes_done: Optional[int] = None
    dpp_done: Optional[int] = None
