from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class FlowBase(BaseModel):
    source_ip: str
    destination_ip: str
    source_port: int = Field(..., ge=0, le=65535)
    destination_port: int = Field(..., ge=0, le=65535)
    protocol: str
    flow_duration: float = 0.0
    packet_count: int = 0
    byte_count: int = 0
    packet_rate: float = 0.0
    byte_rate: float = 0.0
    flags: Optional[str] = None
    label: Optional[str] = "Normal"
    dataset_source: Optional[str] = "manual_upload"


class FlowCreate(FlowBase):
    timestamp: Optional[datetime] = None


class FlowResponse(FlowBase):
    id: int
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FlowListResponse(BaseModel):
    items: List[FlowResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class FlowStatisticsResponse(BaseModel):
    total_flows: int
    total_packets: int
    total_bytes: int
    avg_duration: float
    protocol_distribution: Dict[str, int]
    label_distribution: Dict[str, int]
    top_sources: List[Dict[str, Any]]
    top_destinations: List[Dict[str, Any]]


class FlowUploadResponse(BaseModel):
    status: str
    filename: str
    total_rows: int
    inserted_rows: int
    skipped_rows: int
    detected_format: str
    processing_time_seconds: float
    columns_mapped: Dict[str, str]
