"""Pydantic schemas for the Leave Requests domain."""

import uuid
from datetime import date
from pydantic import BaseModel, ConfigDict


class LeaveRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    from_date: date
    to_date: date
    reason: str
    status: str
    appliedOn: date


class LeaveCreateRequest(BaseModel):
    from_date: date
    to_date: date
    reason: str


class LeaveReviewRequest(BaseModel):
    notes: str = ""
