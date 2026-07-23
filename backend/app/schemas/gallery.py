"""Pydantic schemas for the Gallery domain."""

import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class GalleryAlbumOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    count: int
    cover: Optional[str] = None


class GalleryAlbumDetail(BaseModel):
    id: uuid.UUID
    title: str
    photos: list[str]


class AlbumCreateRequest(BaseModel):
    title: str
