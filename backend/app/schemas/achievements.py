"""Pydantic schemas for the Achievements domain."""

import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

VALID_CATEGORIES = {"Academic", "Sports", "Debate", "Discipline", "Cultural"}


class AchievementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    date: date
    category: str


class AchievementCreateRequest(BaseModel):
    student_id: uuid.UUID
    title: str
    date: date
    category: str
    description: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {VALID_CATEGORIES}")
        return v

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or len(v) > 200:
            raise ValueError("title must be 1-200 characters")
        return v
