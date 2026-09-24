from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.api.deps import get_current_user, require_analyst, get_db
from app.models.user import User
from app.models.alert import Alert
from app.services.alert_service import acknowledge_alert, resolve_alert

router = APIRouter()


@router.get("")
def list_alerts(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List security alerts with status and severity filters."""
    query = db.query(Alert)

    if status_filter:
        query = query.filter(Alert.status == status_filter.upper())
    if severity:
        query = query.filter(Alert.severity == severity.upper())

    total = query.count()
    alerts = (
        query.order_by(desc(Alert.created_at), desc(Alert.id))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
        "alerts": [a.to_dict() for a in alerts],
    }


@router.get("/statistics")
def get_alert_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregated alert metrics across lifecycle states and severities."""
    total = db.query(func.count(Alert.id)).scalar() or 0
    open_count = db.query(func.count(Alert.id)).filter(Alert.status == "OPEN").scalar() or 0
    acked_count = db.query(func.count(Alert.id)).filter(Alert.status == "ACKNOWLEDGED").scalar() or 0
    resolved_count = db.query(func.count(Alert.id)).filter(Alert.status == "RESOLVED").scalar() or 0

    critical_count = db.query(func.count(Alert.id)).filter(Alert.severity == "CRITICAL").scalar() or 0
    high_count = db.query(func.count(Alert.id)).filter(Alert.severity == "HIGH").scalar() or 0

    return {
        "total_alerts": total,
        "open_alerts": open_count,
        "acknowledged_alerts": acked_count,
        "resolved_alerts": resolved_count,
        "critical_alerts": critical_count,
        "high_alerts": high_count,
    }


@router.get("/{alert_id}")
def get_alert_details(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get complete incident details and underlying detection for an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert #{alert_id} not found."
        )
    return alert.to_dict()


@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert_endpoint(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst),
):
    """Analyst/Admin acknowledgment of an alert."""
    try:
        updated = acknowledge_alert(db=db, alert_id=alert_id, user=current_user)
        return {
            "status": "success",
            "message": f"Alert #{alert_id} acknowledged by {current_user.email}",
            "alert": updated.to_dict(),
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{alert_id}/resolve")
def resolve_alert_endpoint(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst),
):
    """Analyst/Admin resolution of an alert."""
    try:
        updated = resolve_alert(db=db, alert_id=alert_id, user=current_user)
        return {
            "status": "success",
            "message": f"Alert #{alert_id} resolved by {current_user.email}",
            "alert": updated.to_dict(),
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
