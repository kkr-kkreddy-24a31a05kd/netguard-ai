import logging
from typing import Dict, Any, List, Set
from datetime import datetime, timezone
from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.flow import NetworkFlow
from app.models.detection import Detection
from app.services.ml_engine import ml_engine
from app.services.detection_service import calculate_severity
from app.services.alert_service import trigger_alert_if_threat
from app.services.traffic_simulator import simulator

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections for live SOC streaming."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast live telemetry packet to all connected clients."""
        if not self.active_connections:
            return

        dead_connections = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error broadcasting to WebSocket: {e}")
                dead_connections.add(connection)

        for dead in dead_connections:
            self.active_connections.discard(dead)


# Global connection manager instance
ws_manager = ConnectionManager()


async def process_live_flow_pipeline(flow_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Complete end-to-end real-time processing pipeline:
    Flow Validation -> Feature Preprocessing -> ML Prediction -> Anomaly Detection ->
    Severity Rating -> Database Persistence -> Alert Trigger -> WebSocket Broadcast
    """
    # 1. Validation
    src_port = int(flow_data.get("source_port", 0))
    dst_port = int(flow_data.get("destination_port", 0))
    if not (0 <= src_port <= 65535 and 0 <= dst_port <= 65535):
        raise ValueError("Port out of bounds")

    duration = max(0.001, float(flow_data.get("flow_duration", 0.1)))
    packets = max(1, int(flow_data.get("packet_count", 1)))
    bytes_cnt = max(40, int(flow_data.get("byte_count", 40)))

    # 2. Preprocessing
    packet_rate = round(packets / duration, 2)
    byte_rate = round(bytes_cnt / duration, 2)

    db: Session = SessionLocal()
    try:
        # 3. Persist Network Flow
        flow = NetworkFlow(
            source_ip=str(flow_data.get("source_ip", "0.0.0.0")),
            destination_ip=str(flow_data.get("destination_ip", "0.0.0.0")),
            source_port=src_port,
            destination_port=dst_port,
            protocol=str(flow_data.get("protocol", "TCP")),
            flow_duration=duration,
            packet_count=packets,
            byte_count=bytes_cnt,
            packet_rate=packet_rate,
            byte_rate=byte_rate,
            flags=flow_data.get("flags"),
            label=flow_data.get("label", "Normal"),
            dataset_source="SIMULATED_TRAFFIC_ENGINE",
            timestamp=datetime.now(timezone.utc),
        )
        db.add(flow)
        db.commit()
        db.refresh(flow)

        # 4 & 5. ML Prediction + Anomaly Detection
        inference_dict = {
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
        pred_res = ml_engine.predict_flow(inference_dict)

        # 6. Severity Rating
        severity, reason = calculate_severity(
            pred_res["prediction"],
            pred_res["confidence"],
            pred_res["is_anomaly"],
            pred_res["anomaly_score"],
        )

        # 7. Persist Detection
        detection = Detection(
            flow_id=flow.id,
            predicted_attack=pred_res["prediction"],
            confidence=pred_res["confidence"],
            anomaly_score=pred_res["anomaly_score"],
            is_anomaly=pred_res["is_anomaly"],
            severity=severity,
            severity_reason=reason,
            model_version=pred_res["model_version"],
            timestamp=flow.timestamp,
        )
        db.add(detection)
        db.commit()
        db.refresh(detection)

        # 8. Alert Generation (if threat condition met)
        alert = trigger_alert_if_threat(db, detection)

        # 9. Format Live Telemetry Packet
        telemetry_event = {
            "type": "LIVE_FLOW_TELEMETRY",
            "is_simulated": True,
            "source": "SIMULATED_TRAFFIC_ENGINE",
            "flow": {
                "id": flow.id,
                "source_ip": flow.source_ip,
                "destination_ip": flow.destination_ip,
                "source_port": flow.source_port,
                "destination_port": flow.destination_port,
                "protocol": flow.protocol,
                "packets": flow.packet_count,
                "bytes": flow.byte_count,
                "duration": flow.flow_duration,
                "timestamp": flow.timestamp.isoformat(),
            },
            "detection": {
                "id": detection.id,
                "predicted_attack": detection.predicted_attack,
                "confidence": round(detection.confidence, 4),
                "anomaly_score": round(detection.anomaly_score, 4),
                "is_anomaly": detection.is_anomaly,
                "severity": detection.severity,
                "severity_reason": detection.severity_reason,
            },
            "alert": {
                "id": alert.id,
                "title": alert.title,
                "severity": alert.severity,
                "status": alert.status,
            } if alert else None,
        }

        # Broadcast asynchronously to WebSocket clients
        await ws_manager.broadcast(telemetry_event)
        return telemetry_event

    finally:
        db.close()


# Wire simulator callback to live pipeline
simulator.set_callback(process_live_flow_pipeline)
