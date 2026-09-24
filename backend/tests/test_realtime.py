import pytest
import asyncio
from starlette.websockets import WebSocketDisconnect
from app.services.traffic_simulator import simulator
from app.services.live_pipeline import process_live_flow_pipeline


@pytest.fixture
def auth_token(client):
    email = "realtime_user@netguard.ai"
    pwd = "TestPassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Realtime Analyst", "email": email, "password": pwd, "role": "analyst"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    return res.json()["access_token"]


def test_simulator_generation_and_labels():
    flow = simulator.generate_flow()
    assert flow["is_simulated"] is True
    assert flow["dataset_source"] == "SIMULATED_TRAFFIC_ENGINE"
    assert "source_ip" in flow
    assert "destination_ip" in flow
    assert flow["packet_count"] > 0
    assert flow["byte_count"] > 0
    assert flow["flow_duration"] > 0


def test_simulator_state_machine():
    simulator.stop()
    assert simulator.state == "STOPPED"

    simulator.start(flows_per_second=3.0)
    assert simulator.state == "RUNNING"
    assert simulator.flows_per_second == 3.0

    simulator.pause()
    assert simulator.state == "PAUSED"

    simulator.resume()
    assert simulator.state == "RUNNING"

    simulator.stop()
    assert simulator.state == "STOPPED"


@pytest.mark.asyncio
async def test_live_pipeline_processing():
    flow_dict = {
        "source_ip": "192.168.1.120",
        "destination_ip": "172.217.16.206",
        "source_port": 51234,
        "destination_port": 443,
        "protocol": "TCP",
        "flow_duration": 0.45,
        "packet_count": 25,
        "byte_count": 12000,
        "label": "Normal",
        "dataset_source": "SIMULATED_TRAFFIC_ENGINE",
    }

    event = await process_live_flow_pipeline(flow_dict)
    assert event["type"] == "LIVE_FLOW_TELEMETRY"
    assert event["is_simulated"] is True
    assert event["flow"]["source_ip"] == "192.168.1.120"
    assert event["detection"]["predicted_attack"] is not None
    assert event["detection"]["severity"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def test_realtime_rest_controls(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Status
    res = client.get("/api/v1/realtime/simulation/status", headers=headers)
    assert res.status_code == 200
    assert res.json()["is_simulated"] is True

    # 2. Start
    res = client.post("/api/v1/realtime/simulation/start", json={"flows_per_second": 2.5}, headers=headers)
    assert res.status_code == 200
    assert res.json()["simulation"]["state"] == "RUNNING"

    # 3. Pause
    res = client.post("/api/v1/realtime/simulation/pause", headers=headers)
    assert res.status_code == 200
    assert res.json()["simulation"]["state"] == "PAUSED"

    # 4. Resume
    res = client.post("/api/v1/realtime/simulation/resume", headers=headers)
    assert res.status_code == 200
    assert res.json()["simulation"]["state"] == "RUNNING"

    # 5. Stop
    res = client.post("/api/v1/realtime/simulation/stop", headers=headers)
    assert res.status_code == 200
    assert res.json()["simulation"]["state"] == "STOPPED"


def test_websocket_unauthenticated_rejected(client):
    with pytest.raises(Exception):
        with client.websocket_connect("/api/v1/realtime/ws/live-traffic") as ws:
            ws.receive_json()


def test_websocket_authenticated_streaming(client, auth_token):
    url = f"/api/v1/realtime/ws/live-traffic?token={auth_token}"
    with client.websocket_connect(url) as ws:
        msg = ws.receive_json()
        assert msg["type"] == "CONNECTION_ESTABLISHED"
        assert "Connected to NetGuard AI" in msg["message"]

        # Send ping action
        ws.send_json({"action": "ping"})
        resp1 = ws.receive_json()
        assert resp1["type"] in ["PONG", "SIMULATION_STATUS_UPDATE"]
