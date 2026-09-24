from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from app.api.deps import get_db, get_current_user
from app.models.flow import NetworkFlow
from app.models.user import User
from app.schemas.flow import (
    FlowResponse,
    FlowListResponse,
    FlowStatisticsResponse,
    FlowUploadResponse,
)
from app.services.ingestion import process_and_ingest_csv

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB limit


@router.post(
    "/upload",
    response_model=FlowUploadResponse,
    summary="Upload and Ingest Network Flow CSV Dataset",
)
async def upload_network_dataset(
    file: UploadFile = File(..., description="CSV network traffic telemetry file"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FlowUploadResponse:
    """
    Ingest a network flow dataset (CICIDS2017, UNSW-NB15, or Canonical format).
    Performs header inspection, column normalization, data cleaning, and bulk persistence into PostgreSQL.
    """
    filename = file.filename or "unknown.csv"
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV files are supported (.csv).",
        )

    # Read bytes with file size guard
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed upload size of {MAX_FILE_SIZE // (1024*1024)} MB.",
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    try:
        result = process_and_ingest_csv(
            file_bytes=contents,
            filename=filename,
            db=db,
            dataset_source=f"upload_by_{current_user.email}",
        )
        return FlowUploadResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Ingestion failed: {str(e)}")


@router.get(
    "/flows",
    response_model=FlowListResponse,
    summary="List Network Flows with Server-Side Filtering and Pagination",
)
def list_network_flows(
    page: int = Query(1, ge=1, description="Page index (1-based)"),
    page_size: int = Query(25, ge=1, le=500, description="Items per page"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    destination_ip: Optional[str] = Query(None, description="Filter by destination IP"),
    protocol: Optional[str] = Query(None, description="Filter by protocol (e.g. TCP, UDP, ICMP)"),
    label: Optional[str] = Query(None, description="Filter by classification label"),
    sort_by: str = Query("timestamp", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order ('asc' or 'desc')"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FlowListResponse:
    """Retrieve paginated network flows with dynamic filtering and sorting."""
    query = db.query(NetworkFlow)

    if source_ip:
        query = query.filter(NetworkFlow.source_ip.ilike(f"%{source_ip.strip()}%"))
    if destination_ip:
        query = query.filter(NetworkFlow.destination_ip.ilike(f"%{destination_ip.strip()}%"))
    if protocol:
        query = query.filter(NetworkFlow.protocol.ilike(protocol.strip()))
    if label:
        query = query.filter(NetworkFlow.label.ilike(f"%{label.strip()}%"))

    total = query.count()

    # Dynamic sorting
    sort_col = getattr(NetworkFlow, sort_by, NetworkFlow.timestamp)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    total_pages = max(1, (total + page_size - 1) // page_size)

    return FlowListResponse(
        items=[FlowResponse.model_validate(f) for f in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/flows/{flow_id}",
    response_model=FlowResponse,
    summary="Get Specific Network Flow by ID",
)
def get_flow_by_id(
    flow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FlowResponse:
    """Fetch individual flow telemetry record."""
    flow = db.query(NetworkFlow).filter(NetworkFlow.id == flow_id).first()
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Network flow record #{flow_id} not found.",
        )
    return FlowResponse.model_validate(flow)


@router.get(
    "/statistics",
    response_model=FlowStatisticsResponse,
    summary="Aggregate Network Traffic Telemetry Statistics",
)
def get_traffic_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FlowStatisticsResponse:
    """Generate aggregate statistics across all ingested network flows."""
    total_flows = db.query(func.count(NetworkFlow.id)).scalar() or 0
    total_packets = db.query(func.sum(NetworkFlow.packet_count)).scalar() or 0
    total_bytes = db.query(func.sum(NetworkFlow.byte_count)).scalar() or 0
    avg_duration = db.query(func.avg(NetworkFlow.flow_duration)).scalar() or 0.0

    # Protocol Distribution
    proto_rows = (
        db.query(NetworkFlow.protocol, func.count(NetworkFlow.id))
        .group_by(NetworkFlow.protocol)
        .all()
    )
    protocol_distribution = {p: count for p, count in proto_rows}

    # Label / Attack Distribution
    label_rows = (
        db.query(NetworkFlow.label, func.count(NetworkFlow.id))
        .group_by(NetworkFlow.label)
        .all()
    )
    label_distribution = {str(lbl): count for lbl, count in label_rows}

    # Top Source IPs
    src_rows = (
        db.query(NetworkFlow.source_ip, func.count(NetworkFlow.id).label("flow_count"))
        .group_by(NetworkFlow.source_ip)
        .order_by(desc("flow_count"))
        .limit(5)
        .all()
    )
    top_sources = [{"ip": r[0], "count": r[1]} for r in src_rows]

    # Top Destination IPs
    dst_rows = (
        db.query(NetworkFlow.destination_ip, func.count(NetworkFlow.id).label("flow_count"))
        .group_by(NetworkFlow.destination_ip)
        .order_by(desc("flow_count"))
        .limit(5)
        .all()
    )
    top_destinations = [{"ip": r[0], "count": r[1]} for r in dst_rows]

    return FlowStatisticsResponse(
        total_flows=total_flows,
        total_packets=total_packets,
        total_bytes=total_bytes,
        avg_duration=round(float(avg_duration), 4),
        protocol_distribution=protocol_distribution,
        label_distribution=label_distribution,
        top_sources=top_sources,
        top_destinations=top_destinations,
    )


@router.delete(
    "/flows",
    summary="Clear Ingested Network Flows",
)
def clear_network_flows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Reset telemetry flows buffer."""
    deleted_count = db.query(NetworkFlow).delete()
    db.commit()
    return {"status": "ok", "deleted_rows": deleted_count}
