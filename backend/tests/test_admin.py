import pytest
from app.models.user import User
from app.models.audit_log import AuditLog


@pytest.fixture
def admin_token(client):
    email = "super_admin_test@netguard.ai"
    pwd = "AdminPassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Super Admin", "email": email, "password": pwd, "role": "admin"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture
def analyst_token(client):
    email = "standard_analyst_test@netguard.ai"
    pwd = "AnalystPassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Standard Analyst", "email": email, "password": pwd, "role": "analyst"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_admin_list_users_access_control(client, admin_token, analyst_token):
    # Admin allowed
    res_admin = client.get("/api/v1/admin/users", headers=admin_token)
    assert res_admin.status_code == 200
    assert "users" in res_admin.json()

    # Analyst forbidden (403)
    res_analyst = client.get("/api/v1/admin/users", headers=analyst_token)
    assert res_analyst.status_code == 403


def test_admin_update_user_role_and_audit(client, admin_token, db_session):
    import uuid
    unique_email = f"promote_{uuid.uuid4().hex[:8]}@netguard.ai"
    analyst_user = User(
        name="Target Analyst",
        email=unique_email,
        password_hash="hashed_placeholder",
        role="analyst",
    )
    db_session.add(analyst_user)
    db_session.commit()
    db_session.refresh(analyst_user)

    # Admin promotes to admin
    res = client.patch(
        f"/api/v1/admin/users/{analyst_user.id}/role",
        json={"role": "admin"},
        headers=admin_token,
    )
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "admin"

    # Verify audit log recorded the promotion
    audit_entry = (
        db_session.query(AuditLog)
        .filter(AuditLog.action == "ROLE_UPDATED")
        .order_by(AuditLog.id.desc())
        .first()
    )
    assert audit_entry is not None
    assert unique_email in audit_entry.target


def test_admin_audit_logs_and_system_config(client, admin_token):
    # 1. Audit logs
    res = client.get("/api/v1/admin/audit-logs", headers=admin_token)
    assert res.status_code == 200
    assert "logs" in res.json()

    # 2. Get system config
    res_cfg = client.get("/api/v1/admin/system-config", headers=admin_token)
    assert res_cfg.status_code == 200
    assert "anomaly_threshold" in res_cfg.json()

    # 3. Update system config
    update_payload = {
        "anomaly_threshold": 0.42,
        "critical_confidence_threshold": 0.85,
        "high_confidence_threshold": 0.65,
        "auto_alert_enabled": True,
    }
    res_upd = client.post("/api/v1/admin/system-config", json=update_payload, headers=admin_token)
    assert res_upd.status_code == 200
    assert res_upd.json()["config"]["anomaly_threshold"] == 0.42
