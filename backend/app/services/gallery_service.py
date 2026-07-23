"""Gallery service — photo uploads to S3/R2."""

import uuid
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.content import GalleryPhoto


def _get_s3_client():
    kwargs = {
        "aws_access_key_id": settings.AWS_ACCESS_KEY_ID or None,
        "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY or None,
    }
    if settings.S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
    return boto3.client("s3", **{k: v for k, v in kwargs.items() if v})


async def upload_photo(
    album_id: uuid.UUID,
    file: UploadFile,
    uploader_id: uuid.UUID,
    caption: Optional[str],
    db: AsyncSession,
) -> GalleryPhoto:
    """Upload to S3/R2 and record the URL in the DB."""
    key = f"gallery/{album_id}/{uuid.uuid4()}_{file.filename}"
    try:
        s3 = _get_s3_client()
        content = await file.read()
        s3.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=content,
            ContentType=file.content_type or "image/jpeg",
        )
        photo_url = f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{key}"
        if settings.S3_ENDPOINT_URL:
            photo_url = f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET}/{key}"
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    photo = GalleryPhoto(
        id=uuid.uuid4(),
        album_id=album_id,
        photo_url=photo_url,
        caption=caption,
        uploaded_by=uploader_id,
    )
    db.add(photo)
    await db.flush()
    return photo
