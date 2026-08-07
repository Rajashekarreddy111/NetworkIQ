from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized production configuration loaded from environment variables and .env file."""

    # Application
    APP_NAME: str = "NetworkIQ Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("STRONG_MODEL") or os.getenv("CHEAP_MODEL") or "gemini-2.5-flash"
    CHEAP_MODEL: str = os.getenv("CHEAP_MODEL", "gemini-2.5-flash")
    STRONG_MODEL: str = os.getenv("STRONG_MODEL", "gemini-2.5-pro")

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Planner
    APPROVAL_THRESHOLD: float = 0.9

    # Inventory
    DEFAULT_HOLDING_COST_RATE: float = 1.5
    DEFAULT_LEAD_TIME_DAYS: int = 7

    # Regions
    SUPPORTED_REGIONS: list[str] = [
        "South_Store",
        "North_Store",
        "East_Store",
        "West_Store",
        "Central_Store",
    ]

    # Logging
    APP_LOG_LEVEL: str = "INFO"

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
