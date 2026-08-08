from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


UserRole = Literal["admin", "planner", "stock_manager"]
UserRegion = Literal["North", "South", "East", "West", "all"]


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, description="Full name of the user")
    email: str = Field(..., min_length=3, description="Unique email address")
    role: UserRole = Field(..., description="Role: admin, planner, or stock_manager")
    region: UserRegion = Field(..., description="Assigned region: North, South, East, West, or all")
    isActive: bool = Field(True, description="Account active status")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Plaintext password to be hashed")


class UserUpdate(BaseModel):
    name: str | None = None
    role: UserRole | None = None
    region: UserRegion | None = None
    isActive: bool | None = None


class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=6, description="New password for user")


class UserResponse(UserBase):
    id: str = Field(..., alias="_id")
    createdBy: str = "system"
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore",
        json_schema_extra={
            "example": {
                "_id": "usr_1001",
                "name": "Ananya Kulkarni",
                "email": "admin@networkiq.com",
                "role": "admin",
                "region": "all",
                "isActive": True,
                "createdBy": "system",
                "createdAt": "2026-08-08T09:45:00Z",
                "updatedAt": "2026-08-08T09:45:00Z",
            }
        },
    )


class LoginPayload(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
