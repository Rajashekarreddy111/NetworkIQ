from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import ApiError
from app.routers.benchmark import router as benchmark_router
from app.routers.config import router as config_router
from app.routers.coordinator import agents_router as coordinator_router
from app.routers.coordinator import cost_router
from app.routers.guardrails import router as guardrails_router
from app.routers.health import router as health_router
from app.routers.plan import router as plan_router
from app.routers.plan import selfcheck_router
from app.routers.regional import router as regional_router
from app.utils.logger import get_logger


logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle with structured startup and shutdown logging."""
    logger.info("==================================================")
    logger.info(
        "Starting %s v%s (%s environment)",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.ENVIRONMENT,
    )
    logger.info("Loaded Gemini Model: %s", settings.GEMINI_MODEL)
    logger.info("==================================================")
    yield
    logger.info("==================================================")
    logger.info("Shutting down %s v%s", settings.APP_NAME, settings.APP_VERSION)
    logger.info("==================================================")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ApiError)
def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    logger.warning(
        "API error on %s %s: %s",
        request.method,
        request.url.path,
        exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# Register existing application routers
app.include_router(health_router)
app.include_router(regional_router)
app.include_router(coordinator_router)
app.include_router(cost_router)
app.include_router(guardrails_router)
app.include_router(selfcheck_router)
app.include_router(plan_router)
app.include_router(config_router)
app.include_router(benchmark_router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }
