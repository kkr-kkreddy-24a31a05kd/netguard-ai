import pytest
from app.models.flow import NetworkFlow
from app.models.detection import Detection


@pytest.fixture
def analyst_token(client):
    email = "adv_analyst@netguard.ai"
    pwd = "TestPassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Adv Analyst", "email": email, "password": pwd, "role": "analyst"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_threat_timeline(client, analyst_token):
    res = client.get("/api/v1/advanced-analytics/timeline?hours=12", headers=analyst_token)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_attack_heatmap(client, analyst_token):
    res = client.get("/api/v1/advanced-analytics/heatmap", headers=analyst_token)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 24
    assert "intensity" in data[0]


def test_recurring_patterns(client, analyst_token):
    res = client.get("/api/v1/advanced-analytics/patterns", headers=analyst_token)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "pattern_type" in data[0]


def test_host_relationships(client, analyst_token):
    res = client.get("/api/v1/advanced-analytics/relationships", headers=analyst_token)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_threat_intel_disclosure(client, analyst_token):
    res = client.get("/api/v1/advanced-analytics/intel", headers=analyst_token)
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "DEMO_SYNTHETIC_INTEL_FEED"
    assert "synthetic" in data["description"].lower()
    assert len(data["indicators"]) >= 1


def test_export_executive_report_json(client, analyst_token):
    res = client.get("/api/v1/advanced-analytics/report/json", headers=analyst_token)
    assert res.status_code == 200
    data = res.json()
    assert "report_id" in data
    assert "executive_summary" in data


def test_export_detections_csv(client, analyst_token):
    res = client.get("/api/v1/advanced-analytics/report/csv?limit=10", headers=analyst_token)
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "detection_id,timestamp,predicted_attack" in res.text


def test_advanced_analytics_unauthorized(client):
    res = client.get("/api/v1/advanced-analytics/timeline")
    assert res.status_code == 401
