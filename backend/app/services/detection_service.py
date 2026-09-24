import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.flow import NetworkFlow
from app.models.detection import Detection
from app.services.ml_engine import ml_engine

logger = logging.getLogger(__name__)

CRITICAL_ATTACKS = {
    "DDoS", "Botnet", "Infiltration", "Heartbleed", "DDoS-SynFlood",
    "DoS Hulk", "DoS GoldenEye", "PortScan"
}

def calculate_severity(
    predicted_attack: str,
    confidence: float,
    is_anomaly: bool,
    anomaly_score: float
) -> tuple[str, str]:
    """
    Calculate severity level (CRITICAL, HIGH, MEDIUM, LOW) with transparent explanation.
    
    Rules:
    - CRITICAL:
        1. High-impact attack category with confidence >= 0.80
        2. High anomaly score >= 0.50 combined with any detected attack
    - HIGH:
        1. Known attack signature with confidence >= 0.60
        2. Anomaly with score >= 0.30
    - MEDIUM:
        1. Known attack signature with confidence < 0.60
        2. Outlier/anomaly flagged on classified benign traffic
    - LOW:
        1. Normal traffic (BENIGN) with no anomaly
    """
    pred_upper = predicted_attack.strip().upper()
    is_benign = pred_upper == "BENIGN"

    if (not is_benign and any(c.upper() in pred_upper for c in CRITICAL_ATTACKS) and confidence >= 0.80) or \
       (not is_benign and is_anomaly and anomaly_score >= 0.40):
        return "CRITICAL", f"High-confidence attack '{predicted_attack}' ({confidence*100:.1f}%) or critical anomaly ({anomaly_score:.2f})"

    if (not is_benign and confidence >= 0.60) or (is_anomaly and anomaly_score >= 0.25):
        return "HIGH", f"Attack classification '{predicted_attack}' with confidence {confidence*100:.1f}% or elevated anomaly score ({anomaly_score:.2f})"

    if not is_benign or is_anomaly:
        reason = f"Low-confidence attack '{predicted_attack}'" if not is_benign else f"Behavioral statistical anomaly ({anomaly_score:.2f})"
        return "MEDIUM", reason

    return "LOW", "Baseline traffic within expected distribution thresholds"


def classify_flow(flow: NetworkFlow, db: Session) -> Detection:
    """Classify a single NetworkFlow using ML engine and persist Detection record."""
    flow_dict = {
        "source_ip": flow.source_ip,
        "destination_ip": flow.destination_ip,
        "source_port": flow.source_port,
        "destination_port": flow.destination_port,
        "protocol": flow.protocol,
        "packet_count": flow.packet_count,
        "byte_count": flow.byte_count,
        "flow_duration": flow.flow_duration,
        "packet_rate": flow.packet_rate,
        "byte_rate": flow.byte_rate,
    }

    pred_res = ml_engine.predict_flow(flow_dict)
    predicted_attack = pred_res["prediction"]
    confidence = pred_res["confidence"]
    is_anomaly = pred_res["is_anomaly"]
    anomaly_score = pred_res["anomaly_score"]
    model_version = pred_res["model_version"]

    severity, reason = calculate_severity(
        predicted_attack, confidence, is_anomaly, anomaly_score
    )

    detection = Detection(
        flow_id=flow.id,
        predicted_attack=predicted_attack,
        confidence=confidence,
        anomaly_score=anomaly_score,
        is_anomaly=is_anomaly,
        severity=severity,
        severity_reason=reason,
        model_version=model_version,
        timestamp=flow.timestamp or datetime.utcnow(),
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)

    # Automatically generate security alert if threat condition matches
    try:
        from app.services.alert_service import trigger_alert_if_threat
        trigger_alert_if_threat(db, detection)
    except Exception as e:
        logger.error(f"Failed to auto-generate alert: {e}")

    return detection


def process_batch_detections(db: Session, limit: int = 500) -> int:
    """
    Find NetworkFlow records without detections and run ML classification on them.
    Returns count of processed records.
    """
    pending_flows = (
        db.query(NetworkFlow)
        .outerjoin(Detection, NetworkFlow.id == Detection.flow_id)
        .filter(Detection.id.is_(None))
        .order_by(NetworkFlow.id.asc())
        .limit(limit)
        .all()
    )

    if not pending_flows:
        return 0

    from app.services.alert_service import trigger_alert_if_threat

    processed_count = 0
    for flow in pending_flows:
        flow_dict = {
            "source_ip": flow.source_ip,
            "destination_ip": flow.destination_ip,
            "source_port": flow.source_port,
            "destination_port": flow.destination_port,
            "protocol": flow.protocol,
            "packet_count": flow.packet_count,
            "byte_count": flow.byte_count,
            "flow_duration": flow.flow_duration,
            "packet_rate": flow.packet_rate,
            "byte_rate": flow.byte_rate,
        }
        pred_res = ml_engine.predict_flow(flow_dict)
        severity, reason = calculate_severity(
            pred_res["prediction"],
            pred_res["confidence"],
            pred_res["is_anomaly"],
            pred_res["anomaly_score"],
        )
        d = Detection(
            flow_id=flow.id,
            predicted_attack=pred_res["prediction"],
            confidence=pred_res["confidence"],
            anomaly_score=pred_res["anomaly_score"],
            is_anomaly=pred_res["is_anomaly"],
            severity=severity,
            severity_reason=reason,
            model_version=pred_res["model_version"],
            timestamp=flow.timestamp or datetime.utcnow(),
        )
        db.add(d)
        db.commit()
        db.refresh(d)
        
        try:
            trigger_alert_if_threat(db, d)
        except Exception:
            pass
        processed_count += 1

    return processed_count
