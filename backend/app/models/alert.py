from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class Alert(Base):
    """
    Security Alert model representing high-priority threats requiring
    SOC analyst or administrator triage, acknowledgment, and resolution.
    """
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    detection_id = Column(Integer, ForeignKey("detections.id", ondelete="SET NULL"), nullable=True, index=True)
    
    severity = Column(String(20), nullable=False, index=True, default="HIGH")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Status: OPEN, ACKNOWLEDGED, RESOLVED
    status = Column(String(20), nullable=False, index=True, default="OPEN")
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(100), nullable=True)

    detection = relationship("Detection", backref="alerts")

    __table_args__ = (
        Index("idx_alerts_status_severity", "status", "severity"),
        Index("idx_alerts_created_desc", created_at.desc()),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "detection_id": self.detection_id,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "acknowledged_by": self.acknowledged_by,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolved_by": self.resolved_by,
            "detection": self.detection.to_dict() if self.detection else None,
        }
