"""Pydantic schemas for the Admin domain."""

import uuid
from pydantic import BaseModel, ConfigDict


class ClassSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    avgCgpa: float
    avgAttendancePct: float
    studentsNeedingAttention: int
