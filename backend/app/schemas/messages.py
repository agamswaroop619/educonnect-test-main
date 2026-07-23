"""Pydantic schemas for the Messages domain."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MessageThreadPreview(BaseModel):
    id: uuid.UUID
    sender_name: str
    sender_role: str
    subject: Optional[str] = None
    preview: str
    time: datetime
    unread: bool
    avatar: str


class MessageDetail(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    sender_name: str
    sender_role: str
    body: str
    sent_at: datetime
    read: bool


class MessageThread(BaseModel):
    thread_id: uuid.UUID
    subject: Optional[str] = None
    messages: list[MessageDetail]


class MessageCreateRequest(BaseModel):
    to_user_id: uuid.UUID
    subject: Optional[str] = None
    body: str


class MessageReplyRequest(BaseModel):
    body: str
