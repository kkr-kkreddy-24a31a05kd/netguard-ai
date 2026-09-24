import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.model_registry import ModelRegistry
from app.services.ml_engine import ml_engine

router = APIRouter()


class PredictRequest(BaseModel):
    flow_duration: float = Field(0.05, ge=0.0)
    packet_count: int = Field(100, ge=1)
    byte_count: int = Field(15000, ge=1)
    packet_rate: Optional[float] = None
    byte_rate: Optional[float] = None
    source_port: int = Field(49152, ge=0, le=65535)
    destination_port: int = Field(80, ge=0, le=65535)
    protocol: str = Field("TCP")


class PredictResponse(BaseModel):
    prediction: str
    attack_type: str
    confidence: float
    anomaly_score: float
    is_anomaly: bool
    severity: str
    model_version: str


class TrainRequest(BaseModel):
    version: Optional[str] = "v1.0.0"
    dataset_name: Optional[str] = "Ingested Flows Telemetry"


@router.post(
    "/train",
    summary="Train Supervised Attack Classifier and Anomaly Detector",
)
def train_models(
    request: TrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Train ML models using ingested flows or reference cybersecurity telemetry."""
    try:
        metadata = ml_engine.train_models(
            db=db,
            version=request.version or "v1.0.0",
            dataset_name=request.dataset_name or "Ingested Flows Telemetry",
        )
        return {
            "status": "success",
            "message": "Model training completed successfully.",
            "metadata": metadata,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training failed: {str(e)}",
        )


@router.get(
    "/status",
    summary="Get Active Machine Learning Model Status & Performance",
)
def get_ml_status(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return runtime status of loaded models, metrics, and capabilities."""
    return {
        "is_loaded": ml_engine.is_loaded,
        "active_version": ml_engine.model_version,
        "algorithm": "RandomForestClassifier + IsolationForest",
        "last_trained_at": ml_engine.last_trained_at.isoformat() if ml_engine.last_trained_at else None,
        "classes": ml_engine.classes_,
        "metrics": ml_engine.metrics,
    }


@router.get(
    "/models",
    summary="List Model Registry Records from PostgreSQL",
)
def list_registered_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Query model versions, accuracy, and F1-scores stored in PostgreSQL."""
    models = db.query(ModelRegistry).order_by(ModelRegistry.created_at.desc()).all()
    results = []
    for m in models:
        metrics_dict = json.loads(m.metrics_json) if m.metrics_json else {}
        results.append({
            "id": m.id,
            "name": m.name,
            "version": m.version,
            "algorithm": m.algorithm,
            "accuracy": m.accuracy,
            "precision": m.precision,
            "recall": m.recall,
            "f1_score": m.f1_score,
            "dataset_source": m.dataset_source,
            "created_at": m.created_at.isoformat(),
            "metrics": metrics_dict,
        })
    return results


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Real-Time Network Flow Threat Prediction",
)
def predict_flow(
    payload: PredictRequest,
    current_user: User = Depends(get_current_user),
) -> PredictResponse:
    """Classify an individual flow payload and compute threat severity score."""
    flow_dict = payload.model_dump()
    if flow_dict.get("packet_rate") is None:
        dur = max(flow_dict["flow_duration"], 0.001)
        flow_dict["packet_rate"] = flow_dict["packet_count"] / dur
    if flow_dict.get("byte_rate") is None:
        dur = max(flow_dict["flow_duration"], 0.001)
        flow_dict["byte_rate"] = flow_dict["byte_count"] / dur

    result = ml_engine.predict_flow(flow_dict)
    return PredictResponse(**result)
