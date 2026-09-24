import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends, status, HTTPException
from pydantic import BaseModel

from app.core.security import decode_access_token
from app.services.traffic_simulator import simulator
from app.services.live_pipeline import ws_manager
from app.api.deps import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


class SimulationControlRequest(BaseModel):
    flows_per_second: Optional[float] = 2.0


@router.websocket("/ws/live-traffic")
async def websocket_live_traffic_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    Authenticated WebSocket endpoint streaming real-time network flow telemetry,
    ML detections, anomaly flags, and security alerts.
    Requires a valid JWT Bearer token passed in the query parameter '?token=<jwt>'.
    """
    if not token:
        logger.warning("WebSocket rejected: No authentication token provided.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        logger.warning("WebSocket rejected: Invalid or expired JWT token.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Valid user authenticated
    await ws_manager.connect(websocket)

    # Send initial welcome & status message
    await websocket.send_json({
        "type": "CONNECTION_ESTABLISHED",
        "message": "Connected to NetGuard AI Live Telemetry Stream.",
        "simulator_status": simulator.get_status(),
        "authenticated_user": payload.get("sub"),
    })

    try:
        while True:
            # Listen for client control commands or heartbeats
            data = await websocket.receive_json()
            action = data.get("action", "").lower()
            if action == "start":
                fps = float(data.get("fps", 2.0))
                simulator.start(flows_per_second=fps)
            elif action == "pause":
                simulator.pause()
            elif action == "resume":
                simulator.resume()
            elif action == "stop":
                simulator.stop()
            elif action == "ping":
                await websocket.send_json({"type": "PONG"})

            await websocket.send_json({
                "type": "SIMULATION_STATUS_UPDATE",
                "status": simulator.get_status(),
            })
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)


@router.get("/simulation/status")
def get_simulation_status(current_user: User = Depends(get_current_user)):
    """Retrieve current state of the simulated traffic generator."""
    return simulator.get_status()


@router.post("/simulation/start")
def start_simulation(
    req: SimulationControlRequest = SimulationControlRequest(),
    current_user: User = Depends(get_current_user),
):
    """Start generating realistic simulated traffic into the live pipeline."""
    fps = req.flows_per_second or 2.0
    simulator.start(flows_per_second=fps)
    return {
        "status": "success",
        "message": f"Simulation engine started at {fps} flows/sec.",
        "simulation": simulator.get_status(),
    }


@router.post("/simulation/pause")
def pause_simulation(current_user: User = Depends(get_current_user)):
    """Pause live traffic generation."""
    simulator.pause()
    return {"status": "success", "simulation": simulator.get_status()}


@router.post("/simulation/resume")
def resume_simulation(current_user: User = Depends(get_current_user)):
    """Resume live traffic generation."""
    simulator.resume()
    return {"status": "success", "simulation": simulator.get_status()}


@router.post("/simulation/stop")
def stop_simulation(current_user: User = Depends(get_current_user)):
    """Stop the live simulation engine."""
    simulator.stop()
    return {"status": "success", "simulation": simulator.get_status()}
