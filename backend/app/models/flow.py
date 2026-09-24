from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Integer, String, Float, DateTime, CheckConstraint, Index
from app.db.base import Base


class NetworkFlow(Base):
    __tablename__ = "network_flows"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    source_ip = Column(String(45), nullable=False, index=True)
    destination_ip = Column(String(45), nullable=False, index=True)
    source_port = Column(Integer, nullable=False)
    destination_port = Column(Integer, nullable=False)
    protocol = Column(String(20), nullable=False, index=True)
    flow_duration = Column(Float, nullable=False, default=0.0)
    packet_count = Column(BigInteger, nullable=False, default=0)
    byte_count = Column(BigInteger, nullable=False, default=0)
    packet_rate = Column(Float, nullable=False, default=0.0)
    byte_rate = Column(Float, nullable=False, default=0.0)
    flags = Column(String(50), nullable=True)
    label = Column(String(100), nullable=True, index=True, default="Normal")
    dataset_source = Column(String(100), nullable=False, default="manual_upload")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("source_port >= 0 AND source_port <= 65535", name="check_source_port_range"),
        CheckConstraint("destination_port >= 0 AND destination_port <= 65535", name="check_dest_port_range"),
        Index("idx_flows_timestamp_desc", timestamp.desc()),
        Index("idx_flows_src_dst", source_ip, destination_ip),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "source_ip": self.source_ip,
            "destination_ip": self.destination_ip,
            "source_port": self.source_port,
            "destination_port": self.destination_port,
            "protocol": self.protocol,
            "flow_duration": self.flow_duration,
            "packet_count": self.packet_count,
            "byte_count": self.byte_count,
            "packet_rate": self.packet_rate,
            "byte_rate": self.byte_rate,
            "flags": self.flags,
            "label": self.label,
            "dataset_source": self.dataset_source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<NetworkFlow id={self.id} {self.source_ip}:{self.source_port} -> {self.destination_ip}:{self.destination_port} [{self.protocol}] {self.label}>"
