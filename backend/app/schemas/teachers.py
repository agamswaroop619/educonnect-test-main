"""Pydantic schemas for the Teachers domain."""

import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class StudentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    rollNo: str
    attendancePct: float
    cgpa: float
    trend: str          # "improving" | "stable" | "declining"
    performanceStatus: str  # "Excellent" | "Good" | "Average" | "Needs Attention"


class SubjectSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    classAverage: float
    periodsPerWeek: int
    performanceClassification: str  # "Excellent" | "Good" | "Average"
