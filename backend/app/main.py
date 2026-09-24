from fastapi import FastAPI
from app.core.config import settings
from app.core.cors import setup_cors
from app.api.v1.api import api_router
from app.api.v1.endpoints import auth, network, ml
from app.db.session import engine
from app.models import Base

# Initialize SQLAlchemy metadata tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Network Attack Detection & Forecasting Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Apply CORS middleware
setup_cors(app)

# Root level service info endpoint: GET / -> {"status": "ok", ...}
@app.get("/", tags=["Root"], summary="Root Service Information")
def root():
    return {
        "status": "ok",
        "service": "NetGuard AI Backend API",
        "version": "1.0.0",
        "health": "/health",
        "docs": "/docs",
    }


# Root level health endpoint: GET /health -> {"status": "ok"}
@app.get("/health", tags=["Health"], summary="Root Health Check")
def root_health():
    return {"status": "ok"}

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Direct compatibility prefixes matching brief specification
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(network.router, prefix="/api/network", tags=["Network Telemetry"])
app.include_router(ml.router, prefix="/api/ml", tags=["Machine Learning"])
app.include_router(ml.router, prefix="/api/detections", tags=["Detections Inference"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
