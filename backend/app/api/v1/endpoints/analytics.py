from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_

from app.api.deps import get_current_user, require_analyst, get_db
from app.models.user import User
from app.models.flow import NetworkFlow
from app.models.detection import Detection
from app.services.detection_service import (
    process_batch_detections,
    classify_flow,
    calculate_severity,
)

router = APIRouter()

@router.post("/analyze-batch")
def analyze_pending_flows(
    limit: int = Query(500, ge=1, le=5000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst),
):
    """Run dual-stage ML classification & anomaly detection on pending flows."""
    count = process_batch_detections(db, limit=limit)
    return {
        "status": "success",
        "processed_count": count,
        "message": f"Successfully classified {count} network flows into detections."
    }

@router.get("/detections")
def list_detections(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = Query(None),
    attack_type: Optional[str] = Query(None),
    is_anomaly: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List security detections with filtering and pagination."""
    query = db.query(Detection).join(NetworkFlow, Detection.flow_id == NetworkFlow.id, isouter=True)

    if severity:
        query = query.filter(Detection.severity == severity.upper())
    if attack_type:
        query = query.filter(Detection.predicted_attack.ilike(f"%{attack_type}%"))
    if is_anomaly is not None:
        query = query.filter(Detection.is_anomaly == is_anomaly)

    total = query.count()
    items = (
        query.order_by(desc(Detection.timestamp), desc(Detection.id))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
        "detections": [item.to_dict() for item in items],
    }

@router.get("/detections/{detection_id}")
def get_detection_by_id(
    detection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve detailed information for a single detection."""
    detection = db.query(Detection).filter(Detection.id == detection_id).first()
    if not detection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Detection #{detection_id} not found."
        )
    return detection.to_dict()

@router.get("/overview")
def get_soc_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Provide aggregated SOC overview statistics for high-level dashboards."""
    total_flows = db.query(func.count(NetworkFlow.id)).scalar() or 0
    total_detections = db.query(func.count(Detection.id)).scalar() or 0

    attack_count = (
        db.query(func.count(Detection.id))
        .filter(Detection.predicted_attack != "BENIGN")
        .scalar() or 0
    )
    benign_count = (
        db.query(func.count(Detection.id))
        .filter(Detection.predicted_attack == "BENIGN")
        .scalar() or 0
    )
    anomaly_count = (
        db.query(func.count(Detection.id))
        .filter(Detection.is_anomaly == True)
        .scalar() or 0
    )
    critical_count = (
        db.query(func.count(Detection.id))
        .filter(Detection.severity == "CRITICAL")
        .scalar() or 0
    )
    high_count = (
        db.query(func.count(Detection.id))
        .filter(Detection.severity == "HIGH")
        .scalar() or 0
    )

    return {
        "total_flows": total_flows,
        "total_detections": total_detections,
        "attack_count": attack_count,
        "benign_count": benign_count,
        "anomaly_count": anomaly_count,
        "critical_count": critical_count,
        "high_count": high_count,
        "attack_rate": round(attack_count / total_detections, 4) if total_detections > 0 else 0.0,
        "anomaly_rate": round(anomaly_count / total_detections, 4) if total_detections > 0 else 0.0,
    }

@router.get("/attack-distribution")
def get_attack_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return distribution of detected attack categories."""
    results = (
        db.query(Detection.predicted_attack, func.count(Detection.id).label("count"))
        .group_by(Detection.predicted_attack)
        .order_by(desc("count"))
        .all()
    )

    total = sum(r[1] for r in results) or 1
    distribution = [
        {
            "category": r[0],
            "count": r[1],
            "percentage": round((r[1] / total) * 100, 2),
        }
        for r in results
    ]
    return {"total": total, "distribution": distribution}

@router.get("/severity-breakdown")
def get_severity_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return breakdown by threat severity: CRITICAL, HIGH, MEDIUM, LOW."""
    results = (
        db.query(Detection.severity, func.count(Detection.id).label("count"))
        .group_by(Detection.severity)
        .all()
    )

    counts = {s: 0 for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]}
    for s, c in results:
        counts[s.upper()] = c

    total = sum(counts.values()) or 1
    return {
        "total": total,
        "breakdown": [
            {"severity": k, "count": v, "percentage": round((v / total) * 100, 2)}
            for k, v in counts.items()
        ]
    }

@router.get("/attack-trends")
def get_attack_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return time-series trend of attacks vs benign traffic."""
    detections = (
        db.query(Detection.timestamp, Detection.predicted_attack, Detection.is_anomaly)
        .order_by(Detection.timestamp.asc())
        .limit(1000)
        .all()
    )

    if not detections:
        # Return fallback demo data if DB is empty so Recharts renders gracefully
        now = datetime.utcnow()
        return [
            {"time": (now - timedelta(minutes=i*10)).strftime("%H:%M"), "attacks": 0, "benign": 0, "anomalies": 0}
            for i in reversed(range(6))
        ]

    # Group into intervals of 10 points for smooth charting
    step = max(1, len(detections) // 10)
    trend_points = []
    
    for i in range(0, len(detections), step):
        chunk = detections[i : i + step]
        if not chunk:
            continue
        time_label = chunk[-1][0].strftime("%H:%M") if chunk[-1][0] else "00:00"
        attacks = sum(1 for d in chunk if d[1] != "BENIGN")
        benign = sum(1 for d in chunk if d[1] == "BENIGN")
        anomalies = sum(1 for d in chunk if d[2])
        trend_points.append({
            "time": time_label,
            "attacks": attacks,
            "benign": benign,
            "anomalies": anomalies,
        })

    return trend_points

@router.get("/top-sources")
def get_top_sources(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return top source IP addresses generating anomalous or attack traffic."""
    results = (
        db.query(
            NetworkFlow.source_ip,
            func.count(Detection.id).label("total_detections"),
            func.sum(case_attack()).label("attacks_count"),
        )
        .join(Detection, Detection.flow_id == NetworkFlow.id)
        .group_by(NetworkFlow.source_ip)
        .order_by(desc("attacks_count"), desc("total_detections"))
        .limit(limit)
        .all()
    )

    return [
        {
            "source_ip": r[0],
            "total_flows": r[1],
            "attacks_count": int(r[2] or 0),
        }
        for r in results
    ]

@router.get("/top-destinations")
def get_top_destinations(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return top targeted destination IP addresses."""
    results = (
        db.query(
            NetworkFlow.destination_ip,
            func.count(Detection.id).label("total_detections"),
            func.sum(case_attack()).label("attacks_count"),
        )
        .join(Detection, Detection.flow_id == NetworkFlow.id)
        .group_by(NetworkFlow.destination_ip)
        .order_by(desc("attacks_count"), desc("total_detections"))
        .limit(limit)
        .all()
    )

    return [
        {
            "destination_ip": r[0],
            "total_flows": r[1],
            "attacks_count": int(r[2] or 0),
        }
        for r in results
    ]

@router.get("/protocol-statistics")
def get_protocol_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return protocol distribution among attacks and normal traffic."""
    results = (
        db.query(
            NetworkFlow.protocol,
            func.count(Detection.id).label("total"),
            func.sum(case_attack()).label("attacks"),
        )
        .join(Detection, Detection.flow_id == NetworkFlow.id)
        .group_by(NetworkFlow.protocol)
        .all()
    )

    return [
        {
            "protocol": r[0] or "UNKNOWN",
            "total_flows": r[1],
            "attack_flows": int(r[2] or 0),
            "benign_flows": r[1] - int(r[2] or 0),
        }
        for r in results
    ]

@router.get("/anomaly-statistics")
def get_anomaly_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return aggregate anomaly statistics."""
    stats = (
        db.query(
            func.avg(Detection.anomaly_score).label("avg_score"),
            func.max(Detection.anomaly_score).label("max_score"),
            func.min(Detection.anomaly_score).label("min_score"),
            func.count(Detection.id).label("total"),
        )
        .first()
    )

    anomaly_count = (
        db.query(func.count(Detection.id))
        .filter(Detection.is_anomaly == True)
        .scalar() or 0
    )

    total = stats[3] or 0
    return {
        "total_detections": total,
        "anomaly_count": anomaly_count,
        "anomaly_percentage": round((anomaly_count / total * 100), 2) if total > 0 else 0.0,
        "average_anomaly_score": round(float(stats[0] or 0.0), 4),
        "max_anomaly_score": round(float(stats[1] or 0.0), 4),
        "min_anomaly_score": round(float(stats[2] or 0.0), 4),
    }

def case_attack():
    """Helper SQL case statement to count non-benign detections."""
    from sqlalchemy import case
    return case((Detection.predicted_attack != "BENIGN", 1), else_=0)
