import uuid
import pytest
from app.core.security import verify_password, get_password_hash


def unique_email(prefix="user"):
    return f"{prefix}_{uuid.uuid4().hex[:8]}@netguard.ai"


# 1. Registration Tests
def test_user_registration_success(client):
    email = unique_email("analyst")
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alex Mercer",
            "email": email,
            "password": "StrongPassword2026!",
            "role": "analyst",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email
    assert data["name"] == "Alex Mercer"
    assert data["role"] == "analyst"
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data


def test_duplicate_email_registration_rejected(client):
    email = unique_email("dup")
    payload = {
        "name": "Duplicate User",
        "email": email,
        "password": "Password1234!",
        "role": "analyst",
    }
    # First registration
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    # Second registration with same email -> 409 Conflict
    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409
    assert "already registered" in r2.json()["detail"]


def test_registration_invalid_email_format(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Invalid Email",
            "email": "not-an-email",
            "password": "Password1234!",
        },
    )
    assert response.status_code == 422


def test_registration_weak_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Weak Pass User",
            "email": unique_email("weak"),
            "password": "short",
        },
    )
    assert response.status_code == 422


# 2. Password Hashing Verification
def test_bcrypt_password_hashing():
    raw_pass = "MySecretNetGuardKey2026!"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


# 3. Login Tests
def test_user_login_success(client):
    email = unique_email("login_test")
    pwd = "ValidPassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Login Tester", "email": email, "password": pwd, "role": "analyst"},
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "analyst"


def test_login_invalid_password(client):
    email = unique_email("bad_pwd")
    client.post(
        "/api/v1/auth/register",
        json={"name": "Bad Pass Tester", "email": email, "password": "CorrectPassword123!"},
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPassword123!"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_nonexistent_user(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ghost_user@netguard.ai", "password": "AnyPassword123!"},
    )
    assert response.status_code == 401


# 4. Profile (GET /api/v1/auth/me) Tests
def test_get_me_with_valid_token(client):
    email = unique_email("me_test")
    pwd = "MePassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Profile Owner", "email": email, "password": pwd, "role": "analyst"},
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["name"] == "Profile Owner"
    assert data["role"] == "analyst"


def test_get_me_unauthorized_no_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_get_me_invalid_token(client):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_gibberish_token_string"},
    )
    assert response.status_code == 401


# 5. Role-Based Access Control (Admin vs Analyst) Tests
def test_admin_only_access_granted_for_admin(client):
    email = unique_email("admin_user")
    pwd = "AdminSecurePassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Admin Chief", "email": email, "password": pwd, "role": "admin"},
    )
    token = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    ).json()["access_token"]

    response = client.get(
        "/api/v1/auth/admin-only",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["access"] == "granted"


def test_admin_only_access_forbidden_for_analyst(client):
    email = unique_email("analyst_user")
    pwd = "AnalystSecurePassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Analyst Jim", "email": email, "password": pwd, "role": "analyst"},
    )
    token = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    ).json()["access_token"]

    response = client.get(
        "/api/v1/auth/admin-only",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert "Insufficient privileges" in response.json()["detail"]


# 6. Logout Test
def test_logout_endpoint(client):
    email = unique_email("logout_test")
    pwd = "LogoutPassword2026!"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Logout User", "email": email, "password": pwd},
    )
    token = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    ).json()["access_token"]

    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
