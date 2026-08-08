from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import PasswordReset, UserCreate, UserResponse, UserUpdate
from app.security.auth import hash_password
from app.security.auth_provider import auth_provider
from app.security.dependencies import require_roles
from app.services.audit_service import AuditService
from app.storage.json_store import json_store
from app.utils.logger import get_logger


logger = get_logger(__name__)
router = APIRouter(prefix="/admin/users", tags=["admin_users"])
audit_service = AuditService()
admin_only = require_roles(["admin"])


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Create a new Stock Manager or user account",
)
def create_user(
    payload: UserCreate,
    admin: Annotated[UserResponse, Depends(admin_only)],
) -> UserResponse:
    """Create a new user account in JSON store (Admin only)."""
    auth_provider.sync_env_users()
    existing = json_store.find_one("users", {"email": payload.email.lower()})

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{payload.email}' already exists.",
        )

    user_id = f"usr_{payload.role}_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    now_iso = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "_id": user_id,
        "name": payload.name,
        "email": payload.email.lower(),
        "password": hash_password(payload.password),
        "role": payload.role,
        "region": payload.region,
        "isActive": payload.isActive,
        "createdBy": admin.email,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }

    json_store.append("users", user_doc)

    audit_service.log_action(
        action="USER_CREATED",
        sku="N/A",
        user=admin.email,
        details=f"Admin created user {payload.email} with role '{payload.role}' and region '{payload.region}'.",
    )

    logger.info("Admin %s created user %s (%s).", admin.email, payload.email, payload.role)
    return UserResponse.model_validate(user_doc)


@router.get(
    "",
    response_model=list[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Admin: List all registered user accounts",
)
def list_users(admin: Annotated[UserResponse, Depends(admin_only)]) -> list[UserResponse]:
    """Retrieve all users stored in JSON store (Admin only)."""
    docs = auth_provider.list_all_users()
    return [UserResponse.model_validate(doc) for doc in docs]


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin: Get specific user details by ID",
)
def get_user_by_id(
    user_id: str,
    admin: Annotated[UserResponse, Depends(admin_only)],
) -> UserResponse:
    """Get single user document by ID (Admin only)."""
    user_doc = auth_provider.get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )
    return UserResponse.model_validate(user_doc)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin: Update user profile",
)
def update_user(
    user_id: str,
    payload: UserUpdate,
    admin: Annotated[UserResponse, Depends(admin_only)],
) -> UserResponse:
    """Update fields of an existing user document (Admin only)."""
    user_doc = auth_provider.get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    update_fields = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    update_fields["updatedAt"] = datetime.now(timezone.utc).isoformat()

    json_store.update_one("users", {"_id": user_id}, update_fields)
    updated_doc = auth_provider.get_user_by_id(user_id)

    audit_service.log_action(
        action="USER_UPDATED",
        sku="N/A",
        user=admin.email,
        details=f"Admin updated user {user_doc.get('email')} fields: {list(update_fields.keys())}.",
    )

    return UserResponse.model_validate(updated_doc)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin: Delete user account",
)
def delete_user(
    user_id: str,
    admin: Annotated[UserResponse, Depends(admin_only)],
) -> dict[str, str]:
    """Delete a user account from JSON store (Admin only)."""
    user_doc = auth_provider.get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    if user_doc.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The Admin account cannot be deleted.",
        )

    json_store.delete_one("users", {"_id": user_id})

    audit_service.log_action(
        action="USER_DELETED",
        sku="N/A",
        user=admin.email,
        details=f"Admin deleted user account {user_doc.get('email')}.",
    )

    return {"message": f"User {user_doc.get('email')} successfully deleted."}


@router.put(
    "/{user_id}/disable",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin: Disable user account",
)
def disable_user(
    user_id: str,
    admin: Annotated[UserResponse, Depends(admin_only)],
) -> UserResponse:
    """Disable user account (Admin only)."""
    user_doc = auth_provider.get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    json_store.update_one(
        "users",
        {"_id": user_id},
        {"isActive": False, "updatedAt": datetime.now(timezone.utc).isoformat()},
    )
    updated_doc = auth_provider.get_user_by_id(user_id)

    audit_service.log_action(
        action="USER_DISABLED",
        sku="N/A",
        user=admin.email,
        details=f"Admin disabled user account {user_doc.get('email')}.",
    )

    return UserResponse.model_validate(updated_doc)


@router.put(
    "/{user_id}/enable",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin: Enable user account",
)
def enable_user(
    user_id: str,
    admin: Annotated[UserResponse, Depends(admin_only)],
) -> UserResponse:
    """Enable user account (Admin only)."""
    user_doc = auth_provider.get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    json_store.update_one(
        "users",
        {"_id": user_id},
        {"isActive": True, "updatedAt": datetime.now(timezone.utc).isoformat()},
    )
    updated_doc = auth_provider.get_user_by_id(user_id)

    audit_service.log_action(
        action="USER_ENABLED",
        sku="N/A",
        user=admin.email,
        details=f"Admin enabled user account {user_doc.get('email')}.",
    )

    return UserResponse.model_validate(updated_doc)


@router.put(
    "/{user_id}/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Admin: Reset user password",
)
def reset_password(
    user_id: str,
    payload: PasswordReset,
    admin: Annotated[UserResponse, Depends(admin_only)],
) -> dict[str, str]:
    """Reset user password with bcrypt hashing (Admin only)."""
    user_doc = auth_provider.get_user_by_id(user_id)
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    hashed = hash_password(payload.new_password)
    json_store.update_one(
        "users",
        {"_id": user_id},
        {"password": hashed, "updatedAt": datetime.now(timezone.utc).isoformat()},
    )

    audit_service.log_action(
        action="PASSWORD_RESET",
        sku="N/A",
        user=admin.email,
        details=f"Admin reset password for user {user_doc.get('email')}.",
    )

    return {"message": f"Password for user {user_doc.get('email')} has been reset successfully."}
