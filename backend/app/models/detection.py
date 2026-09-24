from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base

class Detection(Base):
    """
    Detection model recording ML attack predictions, anomaly scores,
    and computed severity for network flows.
    """
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    flow_id = Column(Integer, ForeignKey("network_flows.id", ondelete="CASCADE"), nullable=True, index=True)
    
    predicted_attack = Column(String(100), nullable=False, index=True, default="BENIGN")
    confidence = Column(Float, nullable=False, default=1.0)
    anomaly_score = Column(Float, nullable=False, default=0.0)
    is_anomaly = Column(Boolean, nullable=False, default=False)
    
    # Severity: LOW, MEDIUM, HIGH, CRITICAL
    severity = Column(String(20), nullable=False, index=True, default="LOW")
    severity_reason = Column(String(255), nullable=True)
    
    model_version = Column(String(50), nullable=False, default="v1.0.0")
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    # Relationships
    flow = relationship("NetworkFlow", backref="detections")

    __table_args__ = (
        Index("idx_detections_severity_timestamp", "severity", "timestamp"),
        Index("idx_detections_attack_timestamp", "predicted_attack", "timestamp"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "flow_id": self.flow_id,
            "predicted_attack": self.predicted_attack,
            "confidence": round(float(self.confidence), 4),
            "anomaly_score": round(float(self.anomaly_score), 4),
            "is_anomaly": self.is_anomaly,
            "severity": self.severity,
            "severity_reason": self.severity_reason,
            "model_version": self.model_version,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "flow": self.flow.to_dict() if self.flow else None,
        }
