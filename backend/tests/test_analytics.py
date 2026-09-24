import pytest
from app.models.flow import NetworkFlow
from app.models.detection import Detection
from app.services.detection_service import calculate_severity, classify_flow, process_batch_detections


@pytest.fixture
def analyst_token_headers(client):
    email = "analytics_analyst@netguard.ai"
    pwd = "TestPassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Analytics Analyst", "email": email, "password": pwd, "role": "analyst"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_severity_calculation_rules():
    # 1. Critical test
    sev, reason = calculate_severity("DDoS-SynFlood", 0.95, True, 0.6)
    assert sev == "CRITICAL"
    assert "High-confidence attack" in reason

    # 2. High test
    sev, reason = calculate_severity("PortScan", 0.75, False, 0.1)
    assert sev == "HIGH"

    # 3. Medium test
    sev, reason = calculate_severity("PortScan", 0.45, False, 0.1)
    assert sev == "MEDIUM"

    # 4. Low test
    sev, reason = calculate_severity("BENIGN", 0.99, False, 0.05)
    assert sev == "LOW"
    assert "Baseline" in reason


def test_classify_flow_and_persist(db_session):
    flow = NetworkFlow(
        source_ip="192.168.1.55",
        destination_ip="10.0.0.5",
        source_port=54000,
        destination_port=80,
        protocol="TCP",
        packet_count=1000,
        byte_count=500000,
        flow_duration=1.0,
        packet_rate=1000.0,
        byte_rate=500000.0,
    )
    db_session.add(flow)
    db_session.commit()
    db_session.refresh(flow)

    detection = classify_flow(flow, db_session)
    assert detection.id is not None
    assert detection.flow_id == flow.id
    assert detection.predicted_attack is not None
    assert 0.0 <= detection.confidence <= 1.0
    assert detection.severity in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def test_process_batch_detections(db_session):
    flows = [
        NetworkFlow(
            source_ip=f"10.0.0.{i}",
            destination_ip="192.168.1.1",
            source_port=1000 + i,
            destination_port=80,
            protocol="TCP",
            packet_count=100 * i,
            byte_count=5000 * i,
            flow_duration=0.5,
            packet_rate=200.0 * i,
            byte_rate=10000.0 * i,
        )
        for i in range(1, 4)
    ]
    db_session.add_all(flows)
    db_session.commit()

    processed_count = process_batch_detections(db_session, limit=10)
    assert processed_count >= 3


def test_analytics_endpoints(client, analyst_token_headers, db_session):
    # Ensure there is at least one detection
    flow = NetworkFlow(
        source_ip="192.168.100.1",
        destination_ip="10.0.0.99",
        source_port=44444,
        destination_port=443,
        protocol="TCP",
        packet_count=50,
        byte_count=2000,
        flow_duration=1.2,
        packet_rate=41.6,
        byte_rate=1666.6,
    )
    db_session.add(flow)
    db_session.commit()
    db_session.refresh(flow)

    detection = Detection(
        flow_id=flow.id,
        predicted_attack="PortScan",
        confidence=0.88,
        anomaly_score=0.45,
        is_anomaly=True,
        severity="HIGH",
        severity_reason="Known attack signature",
        model_version="v1.0.0",
    )
    db_session.add(detection)
    db_session.commit()
    db_session.refresh(detection)

    # 1. Overview
    res = client.get("/api/v1/analytics/overview", headers=analyst_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_detections" in data
    assert data["total_detections"] >= 1

    # 2. List Detections
    res = client.get("/api/v1/analytics/detections?severity=HIGH", headers=analyst_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert len(data["detections"]) >= 1

    # 3. Get Detection by ID
    res = client.get(f"/api/v1/analytics/detections/{detection.id}", headers=analyst_token_headers)
    assert res.status_code == 200
    assert res.json()["predicted_attack"] == "PortScan"

    # 4. Attack Distribution
    res = client.get("/api/v1/analytics/attack-distribution", headers=analyst_token_headers)
    assert res.status_code == 200
    assert "distribution" in res.json()

    # 5. Severity Breakdown
    res = client.get("/api/v1/analytics/severity-breakdown", headers=analyst_token_headers)
    assert res.status_code == 200
    assert "breakdown" in res.json()

    # 6. Attack Trends
    res = client.get("/api/v1/analytics/attack-trends", headers=analyst_token_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 7. Top Sources
    res = client.get("/api/v1/analytics/top-sources", headers=analyst_token_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 8. Top Destinations
    res = client.get("/api/v1/analytics/top-destinations", headers=analyst_token_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 9. Protocol Statistics
    res = client.get("/api/v1/analytics/protocol-statistics", headers=analyst_token_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 10. Anomaly Statistics
    res = client.get("/api/v1/analytics/anomaly-statistics", headers=analyst_token_headers)
    assert res.status_code == 200
    assert "average_anomaly_score" in res.json()


def test_analytics_unauthorized(client):
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 401
