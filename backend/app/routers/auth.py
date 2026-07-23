"""
Auth router — login, refresh, logout, /me endpoints.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.auth import RefreshToken, User
from app.models.people import Admin, Parent, Student, Teacher
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
    verify_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_MAX_AGE = 604800  # 7 days in seconds


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    role: str
    name: str
    email: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------------------------
# Helper: resolve display name from role-specific profile
# ---------------------------------------------------------------------------

async def _get_display_name(user: User, db: AsyncSession) -> str:
    """Return the user's display name from their role-specific profile table."""
    if user.role == "student":
        r = await db.execute(select(Student).where(Student.user_id == user.id))
        s = r.scalar_one_or_none()
        return s.admission_no if s else user.email
    if user.role == "teacher":
        r = await db.execute(select(Teacher).where(Teacher.user_id == user.id))
        t = r.scalar_one_or_none()
        return t.employee_id if t else user.email
    if user.role == "parent":
        r = await db.execute(select(Parent).where(Parent.user_id == user.id))
        p = r.scalar_one_or_none()
        return user.email  # parents identified by email
    # admin
    r = await db.execute(select(Admin).where(Admin.user_id == user.id))
    a = r.scalar_one_or_none()
    return a.title if (a and a.title) else user.email


async def _get_school_id(user: User, db: AsyncSession) -> uuid.UUID | None:
    if user.role == "student":
        r = await db.execute(select(Student).where(Student.user_id == user.id))
        s = r.scalar_one_or_none()
        return s.school_id if s else None
    if user.role == "teacher":
        r = await db.execute(select(Teacher).where(Teacher.user_id == user.id))
        t = r.scalar_one_or_none()
        return t.school_id if t else None
    if user.role == "school_admin":
        r = await db.execute(select(Admin).where(Admin.user_id == user.id))
        a = r.scalar_one_or_none()
        return a.school_id if a else None
    return None


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate with email + password, return access token and set refresh cookie."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is inactive")

    school_id = await _get_school_id(user, db)
    access_token = create_access_token(user.id, user.role, school_id)
    raw_refresh, refresh_hash = create_refresh_token(user.id)

    # Persist refresh token hash
    rt = RefreshToken(
        user_id=user.id,
        token_hash=refresh_hash,
        expires_at=datetime.now(timezone.utc).replace(microsecond=0),
        revoked=False,
    )
    # Set correct expiry
    from datetime import timedelta
    rt.expires_at = datetime.now(timezone.utc) + timedelta(seconds=604800)
    db.add(rt)
    await db.commit()

    # Set httpOnly secure cookie
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_refresh,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=REFRESH_COOKIE_MAX_AGE,
        path="/api/v1/auth",
    )

    name = await _get_display_name(user, db)
    return LoginResponse(
        access_token=access_token,
        user=UserOut(id=user.id, role=user.role, name=name, email=user.email),
    )


# ---------------------------------------------------------------------------
# POST /auth/refresh
# ---------------------------------------------------------------------------

@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    """Rotate the refresh token and return a new access token."""
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    payload = decode_refresh_token(refresh_token)
    user_id = uuid.UUID(payload["sub"])

    # Find a non-revoked, non-expired token for this user
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,  # noqa: E712
            RefreshToken.expires_at > now,
        )
    )
    stored_tokens = result.scalars().all()
    valid_token = next(
        (t for t in stored_tokens if verify_refresh_token(refresh_token, t.token_hash)),
        None,
    )
    if valid_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or revoked refresh token")

    # Revoke old token
    valid_token.revoked = True

    # Get user
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    school_id = await _get_school_id(user, db)
    new_access = create_access_token(user.id, user.role, school_id)
    new_raw, new_hash = create_refresh_token(user.id)

    from datetime import timedelta
    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=new_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=604800),
        revoked=False,
    )
    db.add(new_rt)
    await db.commit()

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=new_raw,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=REFRESH_COOKIE_MAX_AGE,
        path="/api/v1/auth",
    )
    return RefreshResponse(access_token=new_access)


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    current_user: CurrentUser,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    """Revoke the current refresh token. Property 5: subsequent refresh with same token → 401."""
    if refresh_token:
        payload = decode_refresh_token(refresh_token)
        user_id = uuid.UUID(payload["sub"])
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,  # noqa: E712
            )
        )
        for token in result.scalars().all():
            if verify_refresh_token(refresh_token, token.token_hash):
                token.revoked = True
        await db.commit()

    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/v1/auth")


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserOut)
async def me(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Return the authenticated user's profile."""
    name = await _get_display_name(current_user, db)
    return UserOut(
        id=current_user.id,
        role=current_user.role,
        name=name,
        email=current_user.email,
    )
