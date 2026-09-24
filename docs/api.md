# NetGuard AI — Complete REST & WebSocket API Reference

Base URL: `http://localhost:8000/api/v1`

---

## 1. Authentication & RBAC (`/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new account (`analyst` or `admin`) |
| `POST` | `/auth/login` | Public | Authenticate credentials and receive JWT access token |
| `POST` | `/auth/logout` | Authenticated | Terminate session |
| `GET` | `/auth/me` | Authenticated | Retrieve current user profile and role |
| `GET` | `/auth/admin-only` | Admin Only | Protected route verifying admin role |

---

## 2. Network Flow Ingestion (`/network`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/network/upload` | Analyst/Admin | Upload CSV telemetry file (Auto-maps Canonical, CICIDS2017, UNSW-NB15) |
| `GET` | `/network/flows` | Authenticated | List ingested flows with pagination & filters (`protocol`, `ip`, `source`) |
| `GET` | `/network/flows/{id}` | Authenticated | Retrieve single flow by ID |
| `GET` | `/network/statistics` | Authenticated | Aggregate statistics on flow duration, packets, protocols, and volume |
| `DELETE`| `/network/flows` | Admin Only | Clear ingested telemetry records |

---

## 3. Machine Learning Engine (`/ml`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/ml/train` | Analyst/Admin | Retrain RandomForest classifier & Isolation Forest on flow data |
| `GET` | `/ml/status` | Authenticated | Active model versions, training timestamps, classes, and metrics |
| `GET` | `/ml/models` | Authenticated | Historical model registry log from PostgreSQL `models` table |
| `POST` | `/ml/predict` | Authenticated | Run instant inference on arbitrary network flow parameters |

---

## 4. Threat Detection & Analytics (`/analytics`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/analytics/analyze-batch` | Analyst/Admin | Batch classify pending un-analyzed network flows |
| `GET` | `/analytics/detections` | Authenticated | Paginated detections with filters (`severity`, `attack_type`, `is_anomaly`) |
| `GET` | `/analytics/detections/{id}`| Authenticated | Detailed detection record including underlying flow |
| `GET` | `/analytics/overview` | Authenticated | Key SOC KPIs: attack rate, anomaly rate, critical count |
| `GET` | `/analytics/attack-distribution` | Authenticated | Categorical attack distribution percentages |
| `GET` | `/analytics/attack-trends` | Authenticated | Time-binned flow rates for Recharts Area charts |
| `GET` | `/analytics/severity-breakdown` | Authenticated | Counts for CRITICAL, HIGH, MEDIUM, LOW |
| `GET` | `/analytics/top-sources` | Authenticated | Top malicious IP origins |
| `GET` | `/analytics/top-destinations` | Authenticated | Top targeted assets |
| `GET` | `/analytics/protocol-statistics` | Authenticated | Attack vs benign flow distribution by protocol |
| `GET` | `/analytics/anomaly-statistics` | Authenticated | Statistical anomaly score min, max, average |

---

## 5. Security Alerts (`/alerts`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/alerts` | Authenticated | List security alerts with filters (`status`, `severity`) |
| `GET` | `/alerts/statistics` | Authenticated | Counts by status (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`) and severity |
| `GET` | `/alerts/{id}` | Authenticated | Complete alert details with underlying detection context |
| `PATCH`| `/alerts/{id}/acknowledge` | Analyst/Admin | Transition alert to `ACKNOWLEDGED` with operator audit trail |
| `PATCH`| `/alerts/{id}/resolve` | Analyst/Admin | Transition alert to `RESOLVED` with operator audit trail |

---

## 6. Administration & Audit Logs (`/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/users` | Admin Only | List all registered user accounts |
| `PATCH`| `/admin/users/{id}/role` | Admin Only | Promote or demote user role (`admin` <-> `analyst`) |
| `DELETE`| `/admin/users/{id}` | Admin Only | Remove user account (cannot delete own account) |
| `GET` | `/admin/audit-logs` | Admin Only | Immutable security and administrative audit trail |
| `GET` | `/admin/system-config` | Admin Only | Active threat detection thresholds |
| `POST` | `/admin/system-config` | Admin Only | Dynamically adjust anomaly and confidence thresholds |

---

## 7. Real-Time WebSocket & Simulator (`/realtime`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `WS` | `/realtime/ws/live-traffic` | Authenticated (JWT query) | Real-time WebSocket streaming live telemetry events |
| `GET` | `/realtime/simulation/status` | Authenticated | Status of the synthetic traffic engine |
| `POST` | `/realtime/simulation/start` | Authenticated | Start simulation at specified flows per second |
| `POST` | `/realtime/simulation/pause` | Authenticated | Pause traffic generation |
| `POST` | `/realtime/simulation/resume` | Authenticated | Resume traffic generation |
| `POST` | `/realtime/simulation/stop` | Authenticated | Terminate traffic generator |

---

## 8. Advanced Analytics & Reporting (`/advanced-analytics`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/advanced-analytics/timeline` | Authenticated | 24-hour historical severity timeline |
| `GET` | `/advanced-analytics/heatmap` | Authenticated | Hourly diurnal attack frequency heatmap |
| `GET` | `/advanced-analytics/patterns` | Authenticated | Mined recurring patterns (Beaconing, Port Scans, Bursts) |
| `GET` | `/advanced-analytics/relationships`| Authenticated | Source-to-destination communication edges |
| `GET` | `/advanced-analytics/intel` | Authenticated | Curated threat intel feed (disclosed DEMO / SYNTHETIC) |
| `GET` | `/advanced-analytics/report/json` | Analyst/Admin | Download complete executive summary report in JSON |
| `GET` | `/advanced-analytics/report/csv` | Analyst/Admin | Download full detection records in CSV |
