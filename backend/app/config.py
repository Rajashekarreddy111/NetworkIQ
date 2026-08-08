from __future__ import annotations

import os
from pathlib import Path

from pydantic import BaseModel, ConfigDict


try:
    from pydantic_settings import BaseSettings, SettingsConfigDict

    class Settings(BaseSettings):
        """Centralized production configuration loaded from environment variables and .env file."""

        APP_NAME: str = os.getenv("APP_NAME", "NetworkIQ Backend")
        APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
        DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1")
        ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        GEMINI_MODEL: str = os.getenv("STRONG_MODEL") or os.getenv("CHEAP_MODEL") or "gemini-2.5-flash"
        CHEAP_MODEL: str = os.getenv("CHEAP_MODEL", "gemini-2.5-flash")
        STRONG_MODEL: str = os.getenv("STRONG_MODEL", "gemini-2.5-pro")

        HOST: str = os.getenv("HOST", "0.0.0.0")
        PORT: int = int(os.getenv("PORT", "8000"))

        APPROVAL_THRESHOLD: float = 0.9

        DEFAULT_HOLDING_COST_RATE: float = 1.5
        DEFAULT_LEAD_TIME_DAYS: int = 7

        SUPPORTED_REGIONS: list[str] = [
            "North",
            "South",
            "East",
            "West",
        ]

        APP_LOG_LEVEL: str = os.getenv("APP_LOG_LEVEL", "INFO")

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

except ImportError:
    class Settings(BaseModel):  # type: ignore[no-redef]
        """Fallback settings model if pydantic_settings is not installed."""

        APP_NAME: str = os.getenv("APP_NAME", "NetworkIQ Backend")
        APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
        DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1")
        ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        GEMINI_MODEL: str = os.getenv("STRONG_MODEL") or os.getenv("CHEAP_MODEL") or "gemini-2.5-flash"
        CHEAP_MODEL: str = os.getenv("CHEAP_MODEL", "gemini-2.5-flash")
        STRONG_MODEL: str = os.getenv("STRONG_MODEL", "gemini-2.5-pro")

        HOST: str = os.getenv("HOST", "0.0.0.0")
        PORT: int = int(os.getenv("PORT", "8000"))

        APPROVAL_THRESHOLD: float = 0.9

        DEFAULT_HOLDING_COST_RATE: float = 1.5
        DEFAULT_LEAD_TIME_DAYS: int = 7

        SUPPORTED_REGIONS: list[str] = [
            "North",
            "South",
            "East",
            "West",
        ]

        APP_LOG_LEVEL: str = os.getenv("APP_LOG_LEVEL", "INFO")

        ALLOWED_ORIGINS: list[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]

        model_config = ConfigDict(extra="ignore")


settings = Settings()
