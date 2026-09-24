import time
import io
import re
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, List, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.models.flow import NetworkFlow

# Protocol mappings for numeric protocol IDs commonly found in datasets
PROTOCOL_MAP = {
    6: "TCP",
    17: "UDP",
    1: "ICMP",
    0: "HOPOPT",
    2: "IGMP",
    47: "GRE",
    50: "ESP",
    51: "AH",
    58: "IPv6-ICMP",
    89: "OSPF",
}


def normalize_column_name(col: str) -> str:
    """Strip whitespace, lowercase, and remove special characters."""
    return re.sub(r"[^a-z0-9_]", "", col.strip().lower().replace(" ", "_").replace("/", "_").replace(".", "_"))


def detect_schema_and_map(df_columns: List[str]) -> Tuple[str, Dict[str, str]]:
    """
    Inspects actual CSV headers and builds a mapping dictionary
    from canonical field names to the actual dataset column names.
    Supports Canonical, CICIDS2017, and UNSW-NB15 schemas.
    """
    col_norm_map = {normalize_column_name(c): c for c in df_columns}
    norm_keys = set(col_norm_map.keys())

    mapping = {}

    # Check for UNSW-NB15 schema features
    if {"srcip", "dstip", "sport", "dsport"}.issubset(norm_keys):
        format_name = "UNSW-NB15"
        mapping["source_ip"] = col_norm_map["srcip"]
        mapping["destination_ip"] = col_norm_map["dstip"]
        mapping["source_port"] = col_norm_map["sport"]
        mapping["destination_port"] = col_norm_map["dsport"]
        mapping["protocol"] = col_norm_map.get("proto")
        mapping["flow_duration"] = col_norm_map.get("dur")
        mapping["packet_count"] = col_norm_map.get("spkts")
        mapping["byte_count"] = col_norm_map.get("sbytes")
        mapping["label"] = col_norm_map.get("attack_cat") or col_norm_map.get("label")

    # Check for CICIDS2017 schema features
    elif (
        any(k in norm_keys for k in ["source_ip", "sourceip"])
        and any(k in norm_keys for k in ["destination_ip", "destinationip", "destip"])
        and any(k in norm_keys for k in ["flow_duration", "flowduration"])
    ) or any("fwd_packets" in k for k in norm_keys):
        format_name = "CICIDS2017"
        mapping["source_ip"] = col_norm_map.get("source_ip") or col_norm_map.get("sourceip") or col_norm_map.get("src_ip")
        mapping["destination_ip"] = col_norm_map.get("destination_ip") or col_norm_map.get("destinationip") or col_norm_map.get("dst_ip")
        mapping["source_port"] = col_norm_map.get("source_port") or col_norm_map.get("sourceport") or col_norm_map.get("src_port")
        mapping["destination_port"] = col_norm_map.get("destination_port") or col_norm_map.get("destinationport") or col_norm_map.get("dst_port")
        mapping["protocol"] = col_norm_map.get("protocol") or col_norm_map.get("proto")
        mapping["flow_duration"] = col_norm_map.get("flow_duration") or col_norm_map.get("flowduration")
        mapping["packet_count"] = (
            col_norm_map.get("total_fwd_packets")
            or col_norm_map.get("tot_fwd_pkts")
            or col_norm_map.get("total_packets")
        )
        mapping["byte_count"] = (
            col_norm_map.get("total_length_of_fwd_packets")
            or col_norm_map.get("totlen_fwd_pkts")
            or col_norm_map.get("total_bytes")
        )
        mapping["label"] = col_norm_map.get("label")

    # Canonical / Generic schema
    else:
        format_name = "Canonical / Generic"
        for target, synonyms in [
            ("source_ip", ["source_ip", "src_ip", "srcip", "sip", "source"]),
            ("destination_ip", ["destination_ip", "dst_ip", "dstip", "dip", "destination", "dest_ip"]),
            ("source_port", ["source_port", "src_port", "sport", "s_port"]),
            ("destination_port", ["destination_port", "dst_port", "dport", "dsport", "d_port"]),
            ("protocol", ["protocol", "proto", "ip_proto"]),
            ("flow_duration", ["flow_duration", "duration", "dur", "time_duration"]),
            ("packet_count", ["packet_count", "packets", "pkts", "total_packets", "spkts"]),
            ("byte_count", ["byte_count", "bytes", "octets", "total_bytes", "sbytes"]),
            ("label", ["label", "attack", "attack_type", "attack_cat", "class", "target"]),
        ]:
            for syn in synonyms:
                if syn in norm_keys:
                    mapping[target] = col_norm_map[syn]
                    break

    # Clean missing key mappings
    clean_mapping = {k: v for k, v in mapping.items() if v is not None}

    # Minimum viable flow telemetry requirement: at least destination IP/port and protocol or source IP
    required = ["source_ip", "destination_ip", "destination_port"]
    missing = [req for req in required if req not in clean_mapping]
    if missing:
        raise ValueError(
            f"Unsupported dataset format. Missing essential network flow headers: {', '.join(missing)}. "
            f"Detected columns: {', '.join(df_columns[:10])}..."
        )

    return format_name, clean_mapping


def process_and_ingest_csv(
    file_bytes: bytes,
    filename: str,
    db: Session,
    dataset_source: str = "upload",
    chunk_size: int = 1000,
) -> Dict[str, Any]:
    """
    Validates, parses, normalizes, and ingests a network flow CSV dataset into PostgreSQL.
    """
    start_time = time.time()

    # Read CSV using pandas with low memory usage and safe type detection
    try:
        df = pd.read_csv(io.BytesIO(file_bytes), low_memory=False, nrows=50000)
    except Exception as e:
        raise ValueError(f"Failed to parse CSV file: {str(e)}")

    if df.empty:
        raise ValueError("The provided CSV file contains no data rows.")

    total_rows = len(df)
    format_name, mapping = detect_schema_and_map(list(df.columns))

    # Clean infinite / invalid values in numeric columns
    df = df.replace([np.inf, -np.inf], np.nan)

    records_to_insert = []
    skipped_rows = 0

    for idx, row in df.iterrows():
        try:
            # Extract source IP
            src_ip = str(row[mapping["source_ip"]]).strip() if "source_ip" in mapping else "192.168.1.100"
            if src_ip in ["nan", "", "None"]:
                src_ip = "192.168.1.100"

            # Extract destination IP
            dst_ip = str(row[mapping["destination_ip"]]).strip()
            if dst_ip in ["nan", "", "None"]:
                skipped_rows += 1
                continue

            # Extract Ports
            src_port = int(float(row[mapping["source_port"]])) if "source_port" in mapping and not pd.isna(row[mapping["source_port"]]) else 49152
            dst_port = int(float(row[mapping["destination_port"]])) if "destination_port" in mapping and not pd.isna(row[mapping["destination_port"]]) else 80

            # Clamp ports to valid TCP/UDP 0-65535 range
            src_port = max(0, min(65535, src_port))
            dst_port = max(0, min(65535, dst_port))

            # Protocol
            raw_proto = row[mapping["protocol"]] if "protocol" in mapping and not pd.isna(row[mapping["protocol"]]) else "TCP"
            if isinstance(raw_proto, (int, float)):
                proto_str = PROTOCOL_MAP.get(int(raw_proto), f"PROTO-{int(raw_proto)}")
            else:
                proto_str = str(raw_proto).strip().upper()
                if not proto_str or proto_str == "NAN":
                    proto_str = "TCP"

            # Duration
            duration = float(row[mapping["flow_duration"]]) if "flow_duration" in mapping and not pd.isna(row[mapping["flow_duration"]]) else 0.1
            duration = max(0.0, duration)

            # Packets & Bytes
            packets = int(float(row[mapping["packet_count"]])) if "packet_count" in mapping and not pd.isna(row[mapping["packet_count"]]) else 10
            bytes_val = int(float(row[mapping["byte_count"]])) if "byte_count" in mapping and not pd.isna(row[mapping["byte_count"]]) else 1024
            packets = max(1, packets)
            bytes_val = max(1, bytes_val)

            # Calculated Rates
            effective_dur = max(duration, 0.001)
            packet_rate = float(packets) / effective_dur
            byte_rate = float(bytes_val) / effective_dur

            # Label / Attack Type
            if "label" in mapping and not pd.isna(row[mapping["label"]]):
                raw_label = str(row[mapping["label"]]).strip()
                # Clean labels like "BENIGN" -> "Normal"
                if raw_label.upper() in ["BENIGN", "0", "NORMAL", "NONE"]:
                    label_str = "Normal"
                else:
                    label_str = raw_label
            else:
                label_str = "Normal"

            flow = NetworkFlow(
                timestamp=datetime.now(timezone.utc),
                source_ip=src_ip,
                destination_ip=dst_ip,
                source_port=src_port,
                destination_port=dst_port,
                protocol=proto_str,
                flow_duration=round(duration, 4),
                packet_count=packets,
                byte_count=bytes_val,
                packet_rate=round(packet_rate, 2),
                byte_rate=round(byte_rate, 2),
                label=label_str,
                dataset_source=dataset_source or filename,
            )
            records_to_insert.append(flow)

        except Exception:
            skipped_rows += 1
            continue

    # Bulk insert into PostgreSQL
    if records_to_insert:
        db.add_all(records_to_insert)
        db.commit()

    duration_sec = round(time.time() - start_time, 3)

    return {
        "status": "success",
        "filename": filename,
        "total_rows": total_rows,
        "inserted_rows": len(records_to_insert),
        "skipped_rows": skipped_rows,
        "detected_format": format_name,
        "processing_time_seconds": duration_sec,
        "columns_mapped": mapping,
    }
