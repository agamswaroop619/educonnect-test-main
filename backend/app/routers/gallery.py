"""Gallery router — /api/v1/gallery"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.content import GalleryAlbum, GalleryPhoto
from app.models.people import Admin
from app.schemas.gallery import AlbumCreateRequest, GalleryAlbumDetail, GalleryAlbumOut
from app.services.gallery_service import upload_photo

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.get("", response_model=list[GalleryAlbumOut])
async def list_albums(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GalleryAlbum, func.count(GalleryPhoto.id).label("count"))
        .outerjoin(GalleryPhoto, GalleryPhoto.album_id == GalleryAlbum.id)
        .group_by(GalleryAlbum.id)
        .order_by(GalleryAlbum.created_at.desc())
    )
    rows = result.all()
    return [GalleryAlbumOut(id=album.id, title=album.title, count=count, cover=album.cover_url)
            for album, count in rows]


@router.get("/{album_id}", response_model=GalleryAlbumDetail)
async def get_album(album_id: uuid.UUID, current_user: CurrentUser,
                     db: AsyncSession = Depends(get_db)):
    album_result = await db.execute(select(GalleryAlbum).where(GalleryAlbum.id == album_id))
    album = album_result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    photos_result = await db.execute(
        select(GalleryPhoto).where(GalleryPhoto.album_id == album_id)
        .order_by(GalleryPhoto.uploaded_at)
    )
    photos = photos_result.scalars().all()
    return GalleryAlbumDetail(id=album.id, title=album.title,
                               photos=[p.photo_url for p in photos])


@router.post("/albums", status_code=201)
async def create_album(body: AlbumCreateRequest, current_user: CurrentUser,
                        db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    admin_result = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
    admin = admin_result.scalar_one_or_none()
    album = GalleryAlbum(id=uuid.uuid4(), school_id=admin.school_id if admin else uuid.uuid4(),
                          title=body.title)
    db.add(album)
    await db.commit()
    return {"id": album.id, "title": album.title}


@router.post("/albums/{album_id}/photos", status_code=201)
async def add_photo(album_id: uuid.UUID, current_user: CurrentUser,
                     db: AsyncSession = Depends(get_db),
                     file: UploadFile = File(...),
                     caption: Optional[str] = Form(None)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    photo = await upload_photo(album_id, file, current_user.id, caption, db)
    await db.commit()
    return {"id": photo.id, "photo_url": photo.photo_url}


@router.delete("/albums/{album_id}", status_code=204)
async def delete_album(album_id: uuid.UUID, current_user: CurrentUser,
                        db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(GalleryAlbum).where(GalleryAlbum.id == album_id))
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    await db.delete(album)
    await db.commit()
