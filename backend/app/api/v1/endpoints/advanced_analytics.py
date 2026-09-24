import csv
import io
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_analyst, get_db
from app.models.user import User
from app.models.detection import Detection
from app.services.advanced_analytics import (
    get_threat_timeline,
    get_attack_heatmap,
    mine_recurring_patterns,
    get_host_relationships,
    generate_executive_report_data,
    DEMO_THREAT_INTEL,
)

router = APIRouter()


@router.get("/timeline")
def threat_timeline(
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve historical threat event timeline."""
    return get_threat_timeline(db, hours=hours)


@router.get("/heatmap")
def attack_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve diurnal attack intensity distribution."""
    return get_attack_heatmap(db)


@router.get("/patterns")
def recurring_patterns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Identify repeated reconnaissance and beaconing patterns."""
    return mine_recurring_patterns(db)


@router.get("/relationships")
def host_relationships(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Graph communication relationships between sources and destinations."""
    return get_host_relationships(db, limit=limit)


@router.get("/intel")
def threat_intelligence(current_user: User = Depends(get_current_user)):
    """
    Curated threat intelligence indicators.
    Explicitly labeled as DEMO / SYNTHETIC threat intel.
    """
    return {
        "source": "DEMO_SYNTHETIC_INTEL_FEED",
        "description": "Notice: Threat indicators below are synthetic demonstrations for cybersecurity simulation.",
        "indicators": DEMO_THREAT_INTEL,
    }


@router.get("/report/json")
def export_executive_report_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst),
):
    """Authorized analyst/admin report generation in JSON format."""
    return generate_executive_report_data(db)


@router.get("/report/csv")
def export_detections_csv(
    limit: int = Query(500, ge=1, le=5000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst),
):
    """Authorized export of recent detections in CSV format."""
    detections = (
        db.query(Detection)
        .order_by(Detection.timestamp.desc())
        .limit(limit)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "detection_id",
        "timestamp",
        "predicted_attack",
        "confidence",
        "anomaly_score",
        "is_anomaly",
        "severity",
        "severity_reason",
        "model_version",
    ])

    for d in detections:
        writer.writerow([
            d.id,
            d.timestamp.isoformat() if d.timestamp else "",
            d.predicted_attack,
            round(d.confidence, 4),
            round(d.anomaly_score, 4),
            d.is_anomaly,
            d.severity,
            d.severity_reason or "",
            d.model_version,
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=netguard_detections_report.csv"},
    )
