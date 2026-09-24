from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, network, ml, analytics, alerts, admin, realtime, advanced_analytics

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(network.router, prefix="/network", tags=["Network Telemetry Ingestion"])
api_router.include_router(ml.router, prefix="/ml", tags=["Machine Learning Engine"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Threat Detection & Analytics"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Security Alerts"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration & Audit"])
api_router.include_router(realtime.router, prefix="/realtime", tags=["Real-Time Monitoring & WebSocket"])
api_router.include_router(advanced_analytics.router, prefix="/advanced-analytics", tags=["Advanced Threat Intelligence & Reporting"])




