from __future__ import annotations

from typing import Annotated, Sequence

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database.mongodb import db_manager
from app.models.user import UserResponse, UserRole
from app.security.auth import decode_token
from app.utils.logger import get_logger


logger = get_logger(__name__)

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)]
) -> UserResponse:
    """Extract, decode, and validate the JWT Bearer token from request headers."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing subject.",
        )

    users_coll = db_manager.get_collection("users")
    user_doc = users_coll.find_one({"email": email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token no longer exists.",
        )

    if not user_doc.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been disabled. Please contact the system administrator.",
        )

    return UserResponse.model_validate(user_doc)


def require_roles(allowed_roles: Sequence[UserRole]):
    """Dependency factory enforcing Role-Based Access Control (RBAC)."""

    def role_checker(current_user: Annotated[UserResponse, Depends(get_current_user)]) -> UserResponse:
        if current_user.role not in allowed_roles:
            logger.warning(
                "Access denied for user %s (role=%s) on role-restricted endpoint.",
                current_user.email,
                current_user.role,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required role: {list(allowed_roles)}. Your role: {current_user.role}",
            )
        return current_user

    return role_checker


def verify_region_access(user: UserResponse, target_region: str) -> None:
    """Enforce Region-Based Access Control for Stock Managers."""
    if user.role == "stock_manager":
        if user.region.lower() != target_region.lower():
            logger.warning(
                "Region access violation: user %s (assigned: %s) attempted action on region %s.",
                user.email,
                user.region,
                target_region,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden. Your account is restricted to region '{user.region}'. You cannot access or modify region '{target_region}'.",
            )
