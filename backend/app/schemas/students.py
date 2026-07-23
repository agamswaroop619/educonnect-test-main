"""Pydantic schemas for the Students domain."""

import uuid
from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ParentInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    relation: str
    email: str
    phone: Optional[str] = None
    occupation: Optional[str] = None
    verified: bool = False


class StudentProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    grade: str
    rollNo: str
    admissionNo: str
    dob: Optional[date] = None
    bloodGroup: Optional[str] = None
    address: Optional[str] = None
    email: str
    phone: Optional[str] = None
    house: Optional[str] = None
    photo: Optional[str] = None
    attendancePct: float
    cgpa: float
    daysLeft: int
    parent: Optional[ParentInfo] = None
