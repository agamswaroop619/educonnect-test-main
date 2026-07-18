"""
Authentication service — password hashing, JWT creation/decoding, token rotation.
"""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_TTL_SECONDS = 900        # 15 minutes
REFRESH_TOKEN_TTL_SECONDS = 604800    # 7 days


def hash_password(plain: str) -> str:
    """Return bcrypt hash of a plaintext password."""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify plaintext password against a bcrypt hash."""
    return _pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JWT access token
# ---------------------------------------------------------------------------

def create_access_token(user_id: uuid.UUID, role: str, school_id: uuid.UUID | None) -> str:
    """Create a signed HS256 access token with 15-minute expiry.

    Payload: sub, role, school_id, iat, exp
    Property 2: exp - iat == 900 seconds exactly.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "school_id": str(school_id) if school_id else None,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=ACCESS_TOKEN_TTL_SECONDS)).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    """Decode and validate an access token.

    Raises HTTPException(401) if the token is missing, malformed, or expired.
    Property 4: any invalid token → 401.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("sub") is None:
            raise credentials_exc
        return payload
    except JWTError:
        raise credentials_exc


# ---------------------------------------------------------------------------
# JWT refresh token
# ---------------------------------------------------------------------------

def create_refresh_token(user_id: uuid.UUID) -> tuple[str, str]:
    """Create a signed refresh token and return (raw_token, bcrypt_hash).

    Property 2: exp - iat == 604800 seconds exactly.
    The hash is stored in the DB; the raw token is sent to the client.
    """
    from passlib.context import CryptContext

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=REFRESH_TOKEN_TTL_SECONDS)).timestamp()),
        "jti": str(uuid.uuid4()),   # unique ID to prevent hash collisions
    }
    raw = jwt.encode(payload, settings.JWT_REFRESH_SECRET, algorithm="HS256")
    token_hash = _pwd_context.hash(raw)
    return raw, token_hash


def decode_refresh_token(token: str) -> dict:
    """Decode and validate a refresh token.

    Raises HTTPException(401) on failure.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=["HS256"])
        if payload.get("sub") is None:
            raise credentials_exc
        return payload
    except JWTError:
        raise credentials_exc


def verify_refresh_token(raw_token: str, stored_hash: str) -> bool:
    """Verify that a raw refresh token matches its stored bcrypt hash."""
    return _pwd_context.verify(raw_token, stored_hash)
