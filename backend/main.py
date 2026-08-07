from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.routers import ApiError
from app.routers.coordinator import agents_router as coordinator_router
from app.routers.coordinator import cost_router
from app.routers.guardrails import router as guardrails_router
from app.routers.plan import router as plan_router
from app.routers.plan import selfcheck_router
from app.routers.regional import router as regional_router
from app.utils.logger import get_logger


logger = get_logger(__name__)

app = FastAPI(
    title="NetworkIQ Backend",
    version="1.0.0"
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


app.include_router(regional_router)
app.include_router(coordinator_router)
app.include_router(cost_router)
app.include_router(guardrails_router)
app.include_router(selfcheck_router)
app.include_router(plan_router)

@app.get("/")
def root():
    return {
        "message": "NetworkIQ Backend Running"
    }

@app.get("/health")
def health():
    return {
        "status": "ok"
    }
