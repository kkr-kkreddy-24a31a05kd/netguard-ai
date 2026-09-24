# NetGuard AI — Database & Schema Documentation

Engine: **PostgreSQL 16**  
Migration Tool: **Alembic**  
ORM: **SQLAlchemy 2.0**  

---

## 1. Alembic Migration History

| Revision ID | Description | Created Tables / Changes |
|---|---|---|
| `54285f278ef6` | create users table | `users` table with email unique index and role check constraint |
| `c708aff9a027` | create network_flows table | `network_flows` table with port constraints and IP indexes |
| `1890677b009e` | create models table | `models` (ModelRegistry) for Joblib metadata and training metrics |
| `f9ad4bdbf2c8` | create detections table | `detections` table linked to `network_flows.id` via foreign key |
| `6ec0a4b16ce4` | create alerts and audit_logs tables | `alerts` and `audit_logs` tables with status/severity indexes |

---

## 2. Table Specifications

### 2.1 `users`
- `id` (INTEGER, PK, SERIAL)
- `name` (VARCHAR(100), NOT NULL)
- `email` (VARCHAR(255), UNIQUE, NOT NULL, INDEX)
- `password_hash` (VARCHAR(255), NOT NULL)
- `role` (VARCHAR(50), NOT NULL, CHECK role IN ('admin', 'analyst'))
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)

### 2.2 `network_flows`
- `id` (BIGINT, PK, SERIAL)
- `timestamp` (TIMESTAMP WITH TIME ZONE, NOT NULL, INDEX DESC)
- `source_ip` (VARCHAR(45), NOT NULL, INDEX)
- `destination_ip` (VARCHAR(45), NOT NULL, INDEX)
- `source_port` (INTEGER, NOT NULL, CHECK 0 <= port <= 65535)
- `destination_port` (INTEGER, NOT NULL, CHECK 0 <= port <= 65535)
- `protocol` (VARCHAR(20), NOT NULL, INDEX)
- `flow_duration` (FLOAT, NOT NULL)
- `packet_count` (BIGINT, NOT NULL)
- `byte_count` (BIGINT, NOT NULL)
- `packet_rate` (FLOAT, NOT NULL)
- `byte_rate` (FLOAT, NOT NULL)
- `flags` (VARCHAR(50), NULLABLE)
- `label` (VARCHAR(100), NULLABLE, INDEX)
- `dataset_source` (VARCHAR(100), NOT NULL)
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)

### 2.3 `models`
- `id` (INTEGER, PK, SERIAL)
- `model_name` (VARCHAR(100), NOT NULL, INDEX)
- `model_type` (VARCHAR(50), NOT NULL)
- `version` (VARCHAR(50), NOT NULL)
- `algorithm` (VARCHAR(100), NOT NULL)
- `accuracy` (FLOAT, NOT NULL)
- `precision` (FLOAT, NOT NULL)
- `recall` (FLOAT, NOT NULL)
- `f1_score` (FLOAT, NOT NULL)
- `metrics_json` (TEXT, NOT NULL)
- `features_used` (TEXT, NOT NULL)
- `dataset_source` (VARCHAR(100), NOT NULL)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT TRUE)
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL)

### 2.4 `detections`
- `id` (INTEGER, PK, SERIAL)
- `flow_id` (BIGINT, FK -> network_flows.id ON DELETE CASCADE, NULLABLE, INDEX)
- `predicted_attack` (VARCHAR(100), NOT NULL, INDEX)
- `confidence` (FLOAT, NOT NULL)
- `anomaly_score` (FLOAT, NOT NULL)
- `is_anomaly` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `severity` (VARCHAR(20), NOT NULL, INDEX)
- `severity_reason` (VARCHAR(255), NULLABLE)
- `model_version` (VARCHAR(50), NOT NULL)
- `timestamp` (TIMESTAMP WITH TIME ZONE, NOT NULL, INDEX)

### 2.5 `alerts`
- `id` (INTEGER, PK, SERIAL)
- `detection_id` (INTEGER, FK -> detections.id ON DELETE SET NULL, NULLABLE, INDEX)
- `severity` (VARCHAR(20), NOT NULL, INDEX)
- `title` (VARCHAR(255), NOT NULL)
- `description` (TEXT, NULLABLE)
- `status` (VARCHAR(20), NOT NULL, INDEX, DEFAULT 'OPEN')
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, INDEX DESC)
- `acknowledged_at` (TIMESTAMP WITH TIME ZONE, NULLABLE)
- `acknowledged_by` (VARCHAR(100), NULLABLE)
- `resolved_at` (TIMESTAMP WITH TIME ZONE, NULLABLE)
- `resolved_by` (VARCHAR(100), NULLABLE)

### 2.6 `audit_logs`
- `id` (INTEGER, PK, SERIAL)
- `user_id` (INTEGER, FK -> users.id ON DELETE SET NULL, NULLABLE, INDEX)
- `user_email` (VARCHAR(255), NULLABLE)
- `action` (VARCHAR(100), NOT NULL, INDEX)
- `target` (VARCHAR(255), NULLABLE)
- `details` (TEXT, NULLABLE)
- `ip_address` (VARCHAR(50), NULLABLE)
- `timestamp` (TIMESTAMP WITH TIME ZONE, NOT NULL, INDEX)
