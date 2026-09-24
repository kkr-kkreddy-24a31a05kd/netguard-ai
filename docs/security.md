# NetGuard AI — Security Architecture & Threat Model

## 1. Authentication & Session Management
- **Password Storage**: Passwords are never stored in plaintext. They are hashed using `bcrypt` via `passlib[bcrypt]` with dynamic salt generation.
- **Session Tokens**: Stateless JSON Web Tokens (JWT) signed with `HS256`. Tokens carry expiration timestamps (`exp`) and user identifiers (`sub`).
- **Token Transport**: In HTTP requests, tokens are passed via standard `Authorization: Bearer <token>` headers. In WebSocket streams, tokens are validated on initial handshake via query parameter.

---

## 2. Role-Based Access Control (RBAC)

The system enforces two strict roles:
1. `analyst`:
   - View telemetry, upload datasets, run ML inferences, review detections.
   - Acknowledge and resolve security alerts.
   - Export security compliance reports.
2. `admin`:
   - All analyst capabilities.
   - Full user lifecycle management (list users, elevate roles, deactivate/delete).
   - View comprehensive security audit logs (`/api/v1/admin/audit-logs`).
   - Dynamically adjust system anomaly and alert thresholds.

---

## 3. Threat Model & Defenses

| Threat Vector | Mitigation Strategy |
|---|---|
| **SQL Injection** | SQLAlchemy ORM parameterized queries; raw SQL concatenation strictly forbidden. |
| **Cross-Origin Resource Sharing (CORS)** | Explicit allowed origins configured in FastAPI middleware (`http://localhost:5173`, `http://127.0.0.1:5173`). |
| **Credential & Secret Exposure** | Credentials kept in `backend/.env`. Excluded from Git tracking via `.gitignore`. Real passwords never logged. |
| **Malformed Ingestion DoS** | Strict file size and extension checks on CSV upload; validation of numeric bounds on ports and flow durations. |
| **Unauthorized Privilege Escalation** | `require_admin` dependency inspects verified JWT claims from database session before granting access. |
| **Accountability & Non-Repudiation** | Immutable `audit_logs` table records actor identity, action type, target resource, details, and timestamp. |
