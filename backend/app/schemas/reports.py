"""Pydantic schemas for the Reports domain."""

import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SubjectReport(BaseModel):
    name: str
    marks: float
    grade: Optional[str] = None
    remark: Optional[str] = None


class TermTrend(BaseModel):
    term: str
    cgpa: float


class Remarks(BaseModel):
    positive: list[str] = []
    constructive: list[str] = []


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    overallGrade: str
    cgpa: float
    rank: int
    totalStudents: int
    subjects: list[SubjectReport]
    trend: list[TermTrend]
    remarks: Remarks


class GradeCreateRequest(BaseModel):
    student_id: uuid.UUID
    subject_id: uuid.UUID
    term_id: uuid.UUID
    marks_obtained: float
    max_marks: float = 100.0
    grade_letter: Optional[str] = None
    remarks: Optional[str] = None


class ClassReportOut(BaseModel):
    class_id: uuid.UUID
    term: str
    avg_cgpa: float
    subjects: list[dict]
