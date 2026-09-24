import os
import pytest
from app.services.ml_engine import ml_engine, FeaturePipeline, MODEL_DIR
import pandas as pd


@pytest.fixture
def auth_header(client):
    email = "ml_test_user@netguard.ai"
    pwd = "TestPassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "ML Tester", "email": email, "password": pwd, "role": "analyst"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_feature_pipeline_transformation():
    pipeline = FeaturePipeline()
    sample_df = pd.DataFrame([
        {
            "flow_duration": 0.05,
            "packet_count": 12,
            "byte_count": 1400,
            "packet_rate": 240.0,
            "byte_rate": 28000.0,
            "source_port": 50000,
            "destination_port": 80,
            "protocol": "TCP",
        },
        {
            "flow_duration": 0.01,
            "packet_count": 2,
            "byte_count": 120,
            "packet_rate": 200.0,
            "byte_rate": 12000.0,
            "source_port": 51000,
            "destination_port": 53,
            "protocol": "UDP",
        },
    ])
    matrix = pipeline.transform_df(sample_df, fit=True)
    assert matrix.shape == (2, 10)  # 7 numeric + 3 protocol one-hot flags


def test_ml_train_models(client, auth_header):
    response = client.post(
        "/api/v1/ml/train",
        json={"version": "v1.0.0-test", "dataset_name": "Test Sample Dataset"},
        headers={**auth_header, "Content-Type": "application/json"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "success"
    metadata = data["metadata"]
    assert metadata["version"] == "v1.0.0-test"
    assert "metrics" in metadata
    metrics = metadata["metrics"]
    assert "accuracy" in metrics
    assert "f1_score" in metrics
    assert "confusion_matrix" in metrics
    assert metrics["accuracy"] >= 0.0

    # Verify joblib artifacts exist on disk
    assert os.path.exists(os.path.join(MODEL_DIR, "classifier_v1.0.0-test.joblib"))
    assert os.path.exists(os.path.join(MODEL_DIR, "anomaly_v1.0.0-test.joblib"))


def test_ml_status_endpoint(client, auth_header):
    response = client.get("/api/v1/ml/status", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["is_loaded"] is True
    assert "metrics" in data
    assert "classes" in data
    assert len(data["classes"]) >= 1


def test_list_registered_models(client, auth_header):
    response = client.get("/api/v1/ml/models", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["algorithm"] is not None


def test_predict_flow_normal(client, auth_header):
    payload = {
        "flow_duration": 0.05,
        "packet_count": 15,
        "byte_count": 1200,
        "source_port": 52100,
        "destination_port": 443,
        "protocol": "TCP",
    }
    response = client.post("/api/v1/ml/predict", json=payload, headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "confidence" in data
    assert "anomaly_score" in data
    assert "severity" in data
    assert data["confidence"] >= 0.0
    assert data["anomaly_score"] >= 0.0
    assert data["severity"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def test_predict_flow_volumetric_ddos(client, auth_header):
    # Flow representing volumetric DDoS attack
    payload = {
        "flow_duration": 0.001,
        "packet_count": 85000,
        "byte_count": 68000000,
        "source_port": 41200,
        "destination_port": 80,
        "protocol": "TCP",
    }
    response = client.post("/api/v1/ml/predict", json=payload, headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["severity"] in ["MEDIUM", "HIGH", "CRITICAL"]


def test_predict_unauthenticated_rejected(client):
    payload = {
        "flow_duration": 0.05,
        "packet_count": 15,
        "byte_count": 1200,
        "source_port": 52100,
        "destination_port": 443,
        "protocol": "TCP",
    }
    response = client.post("/api/v1/ml/predict", json=payload)
    assert response.status_code == 401
