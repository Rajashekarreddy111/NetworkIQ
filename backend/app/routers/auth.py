from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Header, status

from app.models.user import LoginPayload, TokenResponse, UserResponse
from app.security.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.security.auth_provider import auth_provider
from app.security.dependencies import get_current_user
from app.services.audit_service import AuditService
from app.utils.logger import get_logger


logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
audit_service = AuditService()


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and return JWT tokens",
)
def login(payload: LoginPayload) -> TokenResponse:
    """Verify credentials and issue signed JWT access & refresh tokens."""
    user_doc = auth_provider.authenticate_user(payload.email, payload.password)

    if not user_doc:
        logger.warning("Failed login attempt for email: %s", payload.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user_doc.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact the administrator.",
        )

    user = UserResponse.model_validate(user_doc)
    token_claims = {"sub": user.email, "role": user.role, "region": user.region, "id": user.id}

    access_token = create_access_token(token_claims)
    refresh_token = create_refresh_token(token_claims)

    audit_service.log_action(
        action="USER_LOGIN",
        sku="N/A",
        user=user.email,
        details=f"User {user.name} logged in successfully with role '{user.role}'.",
    )

    logger.info("User %s (%s) logged in successfully.", user.email, user.role)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=user)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve profile of currently authenticated user",
)
def get_me(current_user: Annotated[UserResponse, Depends(get_current_user)]) -> UserResponse:
    """Return profile details for current token holder."""
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user and log audit trail",
)
def logout(current_user: Annotated[UserResponse, Depends(get_current_user)]) -> dict[str, str]:
    """Logout current user."""
    audit_service.log_action(
        action="USER_LOGOUT",
        sku="N/A",
        user=current_user.email,
        details=f"User {current_user.name} logged out.",
    )
    return {"message": f"User {current_user.email} successfully logged out."}


@router.post(
    "/refresh",
    response_model=dict[str, str],
    status_code=status.HTTP_200_OK,
    summary="Refresh access token using refresh token",
)
def refresh_token(x_refresh_token: Annotated[str | None, Header(alias="X-Refresh-Token")] = None) -> dict[str, str]:
    """Issue a new access token using a valid refresh token."""
    if not x_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Refresh-Token header.",
        )

    try:
        payload = decode_token(x_refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Token is not a refresh token.")

        email = payload.get("sub")
        user_doc = auth_provider.get_user_by_email(email) if email else None
        if not user_doc or not user_doc.get("isActive", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account inactive or missing.",
            )

        user = UserResponse.model_validate(user_doc)
        token_claims = {"sub": user.email, "role": user.role, "region": user.region, "id": user.id}
        new_access_token = create_access_token(token_claims)

        return {"access_token": new_access_token, "token_type": "bearer"}
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Refresh token error: {exc}",
        )
