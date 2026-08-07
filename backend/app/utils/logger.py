from __future__ import annotations

import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path


_LOGGER_CONFIGURED = False


def get_logger(name: str) -> logging.Logger:
    """Return a reusable application logger with centralized configuration."""
    _configure_logging()
    return logging.getLogger(name)


def _configure_logging() -> None:
    """Configure application-wide console and rotating file logging only once."""
    global _LOGGER_CONFIGURED
    if _LOGGER_CONFIGURED:
        return

    backend_root = Path(__file__).resolve().parents[2]
    logs_dir = backend_root / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    log_level_name = os.getenv("APP_LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_name, logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    file_handler = RotatingFileHandler(
        logs_dir / "networkiq.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)

    # Attach to root 'app' logger and enable propagation for sub-modules
    app_logger = logging.getLogger("app")
    app_logger.setLevel(log_level)

    if not app_logger.handlers:
        app_logger.addHandler(console_handler)
        app_logger.addHandler(file_handler)

    _LOGGER_CONFIGURED = True
