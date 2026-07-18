"""Circular service — audience-filtered list."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import Circular, CircularVisibility


async def list_circulars(user_role: str, school_id, db: AsyncSession) -> list[Circular]:
    """Return non-archived circulars visible to the given role, pinned first."""
    result = await db.execute(
        select(Circular)
        .join(CircularVisibility, CircularVisibility.circular_id == Circular.id)
        .where(
            Circular.school_id == school_id,
            Circular.is_archived == False,  # noqa: E712
            CircularVisibility.role == user_role,
        )
        .order_by(Circular.pinned.desc(), Circular.published_at.desc())
    )
    return result.scalars().all()
