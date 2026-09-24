import os
import io
import pytest
from app.models.flow import NetworkFlow

# Helper fixture to get an authenticated admin or analyst token
@pytest.fixture
def auth_header(client):
    email = "network_test_user@netguard.ai"
    pwd = "TestPassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Network Tester", "email": email, "password": pwd, "role": "analyst"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# 1. Dataset Upload Tests
def test_upload_canonical_csv_success(client, auth_header):
    csv_content = (
        "source_ip,destination_ip,source_port,destination_port,protocol,flow_duration,packet_count,byte_count,label\n"
        "192.168.1.10,10.0.0.1,50000,443,TCP,0.05,25,3200,Normal\n"
        "45.33.32.156,10.0.0.1,49152,22,TCP,0.01,150,12000,Brute Force\n"
    )
    files = {"file": ("canonical.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/v1/network/upload", files=files, headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["inserted_rows"] == 2
    assert "source_ip" in data["columns_mapped"]


def test_upload_cicids2017_csv_success(client, auth_header):
    cicids_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "ml", "data", "sample_cicids2017.csv")
    )
    with open(cicids_path, "rb") as f:
        file_bytes = f.read()

    files = {"file": ("cicids2017_sample.csv", io.BytesIO(file_bytes), "text/csv")}
    response = client.post("/api/v1/network/upload", files=files, headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["detected_format"] == "CICIDS2017"
    assert data["inserted_rows"] >= 8


def test_upload_unsw_nb15_csv_success(client, auth_header):
    unsw_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "ml", "data", "sample_unsw_nb15.csv")
    )
    with open(unsw_path, "rb") as f:
        file_bytes = f.read()

    files = {"file": ("unsw_sample.csv", io.BytesIO(file_bytes), "text/csv")}
    response = client.post("/api/v1/network/upload", files=files, headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["detected_format"] == "UNSW-NB15"
    assert data["inserted_rows"] >= 8


def test_upload_invalid_file_extension_rejected(client, auth_header):
    files = {"file": ("malicious.exe", io.BytesIO(b"MZ..."), "application/octet-stream")}
    response = client.post("/api/v1/network/upload", files=files, headers=auth_header)
    assert response.status_code == 400
    assert "Only CSV files are supported" in response.json()["detail"]


def test_upload_empty_csv_rejected(client, auth_header):
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    response = client.post("/api/v1/network/upload", files=files, headers=auth_header)
    assert response.status_code == 400


def test_upload_incompatible_headers_rejected(client, auth_header):
    incompatible = "animal_name,pet_age,vaccine_status\nDog,3,true\n"
    files = {"file": ("wrong_dataset.csv", io.BytesIO(incompatible.encode("utf-8")), "text/csv")}
    response = client.post("/api/v1/network/upload", files=files, headers=auth_header)
    assert response.status_code == 422
    assert "Missing essential network flow headers" in response.json()["detail"]


def test_upload_unauthenticated_rejected(client):
    csv_content = "source_ip,destination_ip,destination_port\n1.1.1.1,2.2.2.2,80\n"
    files = {"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/v1/network/upload", files=files)
    assert response.status_code == 401


# 2. Flow Querying, Pagination, and Filtering
def test_list_network_flows_pagination(client, auth_header):
    response = client.get("/api/v1/network/flows?page=1&page_size=5", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 5
    assert data["page"] == 1
    assert data["page_size"] == 5


def test_list_network_flows_filtering_by_protocol(client, auth_header):
    response = client.get("/api/v1/network/flows?protocol=TCP", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["protocol"].upper() == "TCP"


def test_list_network_flows_filtering_by_ip(client, auth_header):
    response = client.get("/api/v1/network/flows?source_ip=192.168", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert "192.168" in item["source_ip"]


def test_get_single_flow_by_id(client, auth_header):
    list_res = client.get("/api/v1/network/flows?page_size=1", headers=auth_header)
    items = list_res.json()["items"]
    assert len(items) > 0
    flow_id = items[0]["id"]

    res = client.get(f"/api/v1/network/flows/{flow_id}", headers=auth_header)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == flow_id
    assert "source_ip" in data
    assert "destination_ip" in data


def test_get_single_flow_not_found(client, auth_header):
    res = client.get("/api/v1/network/flows/99999999", headers=auth_header)
    assert res.status_code == 404


def test_traffic_statistics(client, auth_header):
    response = client.get("/api/v1/network/statistics", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["total_flows"] > 0
    assert data["total_packets"] > 0
    assert data["total_bytes"] > 0
    assert "protocol_distribution" in data
    assert "label_distribution" in data
    assert "top_sources" in data
    assert "top_destinations" in data
