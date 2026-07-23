"""Pydantic schemas for the Timetable domain."""

import uuid
from datetime import time
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PeriodSlot(BaseModel):
    time: str            # "HH:MM-HH:MM"
    slots: list[Optional[str]]  # subject names per day; None = free period


class TimetableOut(BaseModel):
    days: list[str]
    periods: list[PeriodSlot]


class TimetableSlotCreateRequest(BaseModel):
    class_id: uuid.UUID
    subject_id: uuid.UUID
    teacher_id: uuid.UUID
    day_of_week: int       # 0-5
    period_no: int         # 1-8
    start_time: time
    end_time: time
    academic_year_id: uuid.UUID


class TimetableSlotUpdateRequest(BaseModel):
    subject_id: Optional[uuid.UUID] = None
    teacher_id: Optional[uuid.UUID] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
