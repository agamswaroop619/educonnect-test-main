"""
FastAPI dependencies — current user resolution and RBAC enforcement.
"""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.auth import User
from app.services.auth_service import decode_access_token

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Decode the bearer token and return the corresponding User ORM object.

    Raises 401 if the token is missing, invalid, or the user does not exist.
    Property 4: no token / bad token → 401.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return user


# ---------------------------------------------------------------------------
# Role-based access helpers
# ---------------------------------------------------------------------------

def require_roles(roles: list[str]):
    """Return a FastAPI dependency that enforces that the current user has one of the given roles.

    Usage:
        @router.get("/admin/only", dependencies=[Depends(require_roles(["school_admin"]))])
    or as a parameter:
        current_user: User = Depends(require_roles(["teacher", "school_admin"]))
    """

    async def _check(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {roles}",
            )
        return current_user

    return _check


def require_own_or_roles(roles: list[str]):
    """Return a dependency factory that checks ownership OR role membership.

    The resulting dependency takes `resource_user_id: uuid.UUID` as an extra
    parameter to check against the current user's id.

    Usage (inject resource_user_id from path param):
        current_user: User = Depends(require_own_or_roles(["school_admin"])(resource_user_id=student_id))
    """

    def _factory(resource_user_id: uuid.UUID):
        async def _check(
            current_user: Annotated[User, Depends(get_current_user)],
        ) -> User:
            if current_user.role in roles:
                return current_user
            if current_user.id == resource_user_id:
                return current_user
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        return _check

    return _factory


# Convenience type aliases for common role guards
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_roles(["school_admin"]))]
TeacherOrAdminUser = Annotated[User, Depends(require_roles(["teacher", "school_admin"]))]
StudentUser = Annotated[User, Depends(require_roles(["student"]))]
ParentUser = Annotated[User, Depends(require_roles(["parent"]))]
