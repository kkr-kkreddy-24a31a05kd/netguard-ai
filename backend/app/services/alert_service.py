import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.detection import Detection
from app.models.audit_log import AuditLog
from app.models.user import User

logger = logging.getLogger(__name__)


def log_audit_action(
    db: Session,
    user: Optional[User],
    action: str,
    target: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Record an administrative or security lifecycle action into audit_logs."""
    audit_entry = AuditLog(
        user_id=user.id if user else None,
        user_email=user.email if user else "SYSTEM",
        action=action,
        target=target,
        details=details,
        ip_address=ip_address,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry


def trigger_alert_if_threat(db: Session, detection: Detection) -> Optional[Alert]:
    """
    Evaluate threat conditions on a detection and automatically trigger an Alert if:
    1. Severity is CRITICAL or HIGH
    2. Anomaly score >= 0.35 with flagged anomaly
    """
    is_threat = (
        detection.severity in ["CRITICAL", "HIGH"]
        or (detection.is_anomaly and detection.anomaly_score >= 0.35)
    )

    if not is_threat:
        return None

    # Check if an alert already exists for this detection to avoid duplicates
    existing = db.query(Alert).filter(Alert.detection_id == detection.id).first()
    if existing:
        return existing

    # Format descriptive incident title
    flow = detection.flow
    src = flow.source_ip if flow else "External Host"
    dst = flow.destination_ip if flow else "Target"
    attack = detection.predicted_attack

    if detection.severity == "CRITICAL":
        title = f"[CRITICAL] {attack} Assault from {src} targeting {dst}"
    elif detection.severity == "HIGH":
        title = f"[HIGH] Malicious Traffic Pattern: {attack} from {src}"
    else:
        title = f"[ANOMALY] Outlier Flow Pattern Detected: {src} -> {dst}"

    description = (
        f"Automated threat condition triggered. Classifier predicted '{attack}' with "
        f"{detection.confidence*100:.1f}% confidence. Anomaly score: {detection.anomaly_score:.4f}. "
        f"Reason: {detection.severity_reason or 'Threat signature matched'}."
    )

    alert = Alert(
        detection_id=detection.id,
        severity=detection.severity,
        title=title,
        description=description,
        status="OPEN",
        created_at=datetime.now(timezone.utc),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Record automatic alert creation in audit log
    log_audit_action(
        db=db,
        user=None,
        action="ALERT_GENERATED",
        target=f"Alert #{alert.id}",
        details=f"Auto-generated alert for detection #{detection.id} ({detection.severity})",
    )

    return alert


def acknowledge_alert(db: Session, alert_id: int, user: User) -> Alert:
    """Transition alert to ACKNOWLEDGED state and log audit entry."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise ValueError(f"Alert #{alert_id} not found.")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.now(timezone.utc)
    alert.acknowledged_by = user.email
    db.commit()
    db.refresh(alert)

    log_audit_action(
        db=db,
        user=user,
        action="ALERT_ACKNOWLEDGED",
        target=f"Alert #{alert.id}",
        details=f"Acknowledged by {user.email} (Role: {user.role})",
    )
    return alert


def resolve_alert(db: Session, alert_id: int, user: User) -> Alert:
    """Transition alert to RESOLVED state and log audit entry."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise ValueError(f"Alert #{alert_id} not found.")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = user.email
    db.commit()
    db.refresh(alert)

    log_audit_action(
        db=db,
        user=user,
        action="ALERT_RESOLVED",
        target=f"Alert #{alert.id}",
        details=f"Resolved by {user.email} (Role: {user.role})",
    )
    return alert
