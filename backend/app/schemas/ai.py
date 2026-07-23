"""Pydantic schemas for the AI Assistant domain."""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AIChatRequest(BaseModel):
    message: str


class AIChatResponse(BaseModel):
    response: str


class AIMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    role: str       # "user" | "assistant"
    text: str
    sent_at: datetime
