"""Pydantic schemas for the Notifications domain."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    type: str
    title: str
    body: str
    read: bool
    created_at: datetime
    action_url: Optional[str] = None
