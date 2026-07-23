"""Pydantic schemas for the Attendance domain."""

import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MonthlyAttendance(BaseModel):
    month: str
    pct: float


class RecentAttendance(BaseModel):
    date: date
    status: str


class AttendanceSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    present: int
    absent: int
    leave: int
    total: int
    streak: int
    monthly: list[MonthlyAttendance]
    recent: list[RecentAttendance]


class AttendanceMarkItem(BaseModel):
    student_id: uuid.UUID
    status: str  # present | absent | leave


class AttendanceMarkRequest(BaseModel):
    date: date
    records: list[AttendanceMarkItem]


class AttendanceRecordOut(BaseModel):
    student_id: uuid.UUID
    date: date
    status: str
