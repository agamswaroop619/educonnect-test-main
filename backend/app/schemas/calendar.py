"""Pydantic schemas for the Calendar / Events domain."""

import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

VALID_EVENT_TYPES = {"Holiday", "Exam", "Event", "Meeting", "PTM"}


class CalendarEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    date: date
    type: str


class CalendarEventCreateRequest(BaseModel):
    title: str
    date: date
    type: str
    description: Optional[str] = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in VALID_EVENT_TYPES:
            raise ValueError(f"type must be one of {VALID_EVENT_TYPES}")
        return v

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or len(v) > 200:
            raise ValueError("title must be 1-200 characters")
        return v


class CalendarEventUpdateRequest(BaseModel):
    title: Optional[str] = None
    date: Optional[date] = None
    type: Optional[str] = None
    description: Optional[str] = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_EVENT_TYPES:
            raise ValueError(f"type must be one of {VALID_EVENT_TYPES}")
        return v
