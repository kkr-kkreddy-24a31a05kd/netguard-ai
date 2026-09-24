def test_root_endpoint(client):
    """Test root / endpoint returns service information and health link."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "NetGuard AI" in data["service"]


def test_root_health_check(client):
    """Test root health endpoint returns exact expected JSON payload."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_v1_health_check(client):
    """Test API v1 health endpoint returns status ok."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_headers_allowed_origin(client):
    """Test CORS headers are present for allowed origins."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_404_for_unknown_route(client):
    """Test unknown endpoints return 404 with proper JSON error structure."""
    response = client.get("/api/v1/nonexistent-endpoint")
    assert response.status_code == 404
    assert "detail" in response.json()
