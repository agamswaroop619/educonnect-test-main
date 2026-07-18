"""Pydantic schemas for the Circulars domain."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CircularOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    category: Optional[str] = None
    date: datetime
    pinned: bool
    excerpt: Optional[str] = None


class CircularCreateRequest(BaseModel):
    title: str
    category: Optional[str] = None
    body: str
    excerpt: Optional[str] = None
    pinned: bool = False
    visible_to: list[str]  # e.g. ["student", "parent", "teacher", "school_admin"]


class CircularUpdateRequest(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    excerpt: Optional[str] = None
    category: Optional[str] = None
    pinned: Optional[bool] = None
