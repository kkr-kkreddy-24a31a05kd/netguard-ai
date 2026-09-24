import pytest
from app.models.flow import NetworkFlow
from app.models.detection import Detection
from app.models.alert import Alert
from app.services.alert_service import trigger_alert_if_threat, acknowledge_alert, resolve_alert


@pytest.fixture
def analyst_token(client):
    email = "alert_analyst@netguard.ai"
    pwd = "TestPassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Alert Analyst", "email": email, "password": pwd, "role": "analyst"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_auto_alert_generation_from_critical_detection(db_session):
    flow = NetworkFlow(
        source_ip="45.142.212.1",
        destination_ip="192.168.1.1",
        source_port=50123,
        destination_port=80,
        protocol="TCP",
        packet_count=50000,
        byte_count=25000000,
        flow_duration=0.5,
        packet_rate=100000.0,
        byte_rate=50000000.0,
    )
    db_session.add(flow)
    db_session.commit()

    detection = Detection(
        flow_id=flow.id,
        predicted_attack="DDoS",
        confidence=0.96,
        anomaly_score=0.88,
        is_anomaly=True,
        severity="CRITICAL",
        severity_reason="Volumetric DDoS assault pattern",
        model_version="v1.0.0",
    )
    db_session.add(detection)
    db_session.commit()

    alert = trigger_alert_if_threat(db_session, detection)
    assert alert is not None
    assert alert.status == "OPEN"
    assert alert.severity == "CRITICAL"
    assert "DDoS" in alert.title


def test_alerts_api_lifecycle(client, analyst_token, db_session):
    # Create an alert to test with
    detection = Detection(
        predicted_attack="PortScan",
        confidence=0.85,
        anomaly_score=0.45,
        is_anomaly=True,
        severity="HIGH",
        severity_reason="PortScan detected",
    )
    db_session.add(detection)
    db_session.commit()

    alert = Alert(
        detection_id=detection.id,
        severity="HIGH",
        title="[HIGH] PortScan Reconnaissance",
        description="Suspicious port sweeping detected",
        status="OPEN",
    )
    db_session.add(alert)
    db_session.commit()
    db_session.refresh(alert)

    # 1. List alerts
    res = client.get("/api/v1/alerts", headers=analyst_token)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert any(a["id"] == alert.id for a in data["alerts"])

    # 2. Get alert details
    res = client.get(f"/api/v1/alerts/{alert.id}", headers=analyst_token)
    assert res.status_code == 200
    assert res.json()["title"] == alert.title

    # 3. Acknowledge alert
    res = client.patch(f"/api/v1/alerts/{alert.id}/acknowledge", headers=analyst_token)
    assert res.status_code == 200
    assert res.json()["alert"]["status"] == "ACKNOWLEDGED"

    # 4. Resolve alert
    res = client.patch(f"/api/v1/alerts/{alert.id}/resolve", headers=analyst_token)
    assert res.status_code == 200
    assert res.json()["alert"]["status"] == "RESOLVED"

    # 5. Statistics
    res = client.get("/api/v1/alerts/statistics", headers=analyst_token)
    assert res.status_code == 200
    assert "total_alerts" in res.json()


def test_alerts_unauthorized(client):
    res = client.get("/api/v1/alerts")
    assert res.status_code == 401
