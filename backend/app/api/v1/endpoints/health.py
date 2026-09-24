from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthCheckResponse(BaseModel):
    status: str


@router.get("/health", response_model=HealthCheckResponse, summary="System Health Check")
def health_check() -> HealthCheckResponse:
    """Return health status of the API."""
    return HealthCheckResponse(status="ok")
