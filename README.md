# NetGuard AI

> **AI-powered network attack detection and forecasting platform using machine learning, anomaly detection, real-time monitoring, and security analytics.**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql&logoColor=white)](https://postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-65%20Passed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Modules & Implementation](#key-modules--implementation)
- [Technology Stack](#technology-stack)
- [Machine Learning Pipeline](#machine-learning-pipeline)
- [Real-Time Monitoring (Simulated Traffic Notice)](#real-time-monitoring-simulated-traffic-notice)
- [Project Directory Structure](#project-directory-structure)
- [Setup & Installation Instructions](#setup--installation-instructions)
- [API Reference](#api-reference)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Production Deployment](#production-deployment)
- [Current Limitations & Future Scope](#current-limitations--future-scope)

---

## Overview

**NetGuard AI** is a production-grade, AI-driven cybersecurity operations center (SOC) platform designed to ingest network flow telemetry, detect malicious and anomalous activity, classify multi-vector cyberattacks using supervised machine learning and unsupervised outlier detection, compute dynamic threat severity tiers, stream live telemetry over WebSockets, and provide security analysts with incident triage capabilities.

### Core Capabilities

- **Role-Based Security & Governance**: Strict JWT authentication with cryptographic Bcrypt hashing, role separation (`admin` vs `analyst`), and immutable system audit logging.
- **Multi-Format Telemetry Ingestion**: High-throughput CSV ingestion engine with automatic schema detection and column normalization for Canonical flow format, CICIDS2017, and UNSW-NB15 datasets.
- **Dual-Stage Machine Learning**: Supervised attack classification (Random Forest) combined with unsupervised statistical anomaly scoring (Isolation Forest).
- **Automated Incident Alerting**: Detections with high anomaly scores or severe classifications automatically generate triage-ready security alerts with full lifecycle management (`OPEN` → `ACKNOWLEDGED` → `RESOLVED`).
- **Live SOC Telemetry Streaming**: Bi-directional WebSocket stream with interactive simulator controls (`start`, `pause`, `resume`, `stop`).
- **Threat Analytics & Intelligence**: Interactive dashboards visualizing attack distributions, protocol trends, 24-hour threat timelines, diurnal activity heatmaps, source-to-destination relationship graphs, and one-click JSON/CSV executive reports.

---

## System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                       React 18 SPA (Vite + Tailwind)                   │
│  - SOC Dashboard   - Network Traffic   - ML Models  - Threat Analytics │
│  - Live Monitor    - Incident Alerts   - Admin Ops  - Advanced Intel   │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │ REST API (JSON)                │ WebSockets (Full Duplex)
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Application Gateway                     │
│  - JWT Bearer Authentication & RBAC Middleware                         │
│  - Telemetry Ingestion Pipeline (CICIDS2017 / UNSW-NB15 / Canonical)  │
│  - Live Pipeline Orchestrator & Connection Manager                     │
└───────────────▲──────────────────────────────▲─────────────────────────┘
                │                              │
                ▼                              ▼
┌───────────────────────────────┐ ┌──────────────────────────────────────┐
│     PostgreSQL 16 Database    │ │         ML & Inference Engine        │
│  - users                      │ │  - FeaturePipeline (StandardScaler)  │
│  - network_flows              │ │  - RandomForestClassifier (Multi-cls)│
│  - models (Registry)          │ │  - IsolationForest (Anomaly Detector)│
│  - detections                 │ │  - Joblib Artifact Serialization     │
│  - alerts                     │ │  - TrafficSimulator (Synthetic Flows)│
│  - audit_logs                 │ └──────────────────────────────────────┘
└───────────────────────────────┘
```

---

## Key Modules & Implementation

1. **Authentication & RBAC (`/api/v1/auth`)**:
   - Salted password hashing via Bcrypt.
   - Cryptographically signed HS256 JWT tokens.
   - Fine-grained role permissions: `analyst` (telemetry, triage, alerts) and `admin` (user governance, role elevation, audit logs).

2. **Network Telemetry Ingestion (`/api/v1/network`)**:
   - Supports files up to 50 MB with header auto-mapping.
   - Calculates packet rates, byte rates, duration bounds, and protocol flags.
   - Server-side paginated queries with IP, protocol, and classification filtering.

3. **Machine Learning Engine (`/api/v1/ml`)**:
   - Trains dual models on ingested database flows or reference benchmarks.
   - Model versions, accuracy, F1-scores, and hyperparameters logged to `models` table.
   - Sub-millisecond single-flow real-time inference via `/predict`.

4. **Threat Detection & Severity Rating (`/api/v1/analytics`)**:
   - Dual-stage classification: supervised prediction + isolation forest outlier score.
   - Transparent 4-tier severity assignment:
     - `CRITICAL`: Known destructive attacks (e.g., volumetric DDoS, Botnet C2) or high confidence + high anomaly.
     - `HIGH`: Active exploitation attempts (e.g., DoS, Brute Force, Web Attacks).
     - `MEDIUM`: Suspicious activity (e.g., PortScan, Reconnaissance, anomalous outliers).
     - `LOW`: Routine network flows with negligible threat probability.

5. **Security Incident Alerts (`/api/v1/alerts`)**:
   - Automated incident creation for detections flagged as `CRITICAL` or `HIGH`.
   - Complete analyst workflow: acknowledge alert with notes, resolve alert with resolution justification.

6. **Administration & Audit Trail (`/api/v1/admin`)**:
   - Admin-only access controls.
   - User account status management and role modifications.
   - Immutable audit logging tracking every administrative action.

7. **Advanced Threat Intelligence (`/api/v1/advanced-analytics`)**:
   - 24-hour threat timelines and hourly attack heatmaps.
   - Pattern mining for persistent reconnaissance, volumetric bursts, and C2 beaconing.
   - Host relationship graphs and executive report downloads.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18.3 | Reactive single-page user interface |
| **Build Tool** | Vite 5.4 | Next-generation frontend bundler and HMR dev server |
| **Styling** | Tailwind CSS 3.4 & Vanilla CSS | Custom dark cyber UI theme and responsive layout |
| **State & Data Fetching**| TanStack Query v5 | Server state caching, background refetching, and mutations |
| **Routing** | React Router DOM v6 | Client-side routing with route guards |
| **Visualization** | Recharts 2.15 | Responsive charts, area graphs, bar charts, and radar maps |
| **Icons** | Lucide React | Modern cybersecurity icon library |
| **Backend Framework** | FastAPI 0.115+ | High-performance asynchronous REST API |
| **ASGI Server** | Uvicorn | Lightning-fast asynchronous server gateway |
| **Database ORM** | SQLAlchemy 2.0 | Relational database mapping and session handling |
| **Schema Migrations** | Alembic 1.14+ | Version-controlled database schema migrations |
| **Database** | PostgreSQL 16 | ACID-compliant relational data store |
| **Machine Learning** | Scikit-learn 1.5+ | Random Forest classifier and Isolation Forest anomaly detector |
| **Data Processing** | Pandas 2.2+ & NumPy 2.0+ | Telemetry dataframes and vectorized matrix computations |
| **Model Persistence** | Joblib | Serialized model and pipeline storage |
| **Security & Auth** | Python-JOSE & Passlib (Bcrypt)| JWT tokens, claims verification, and password hashing |
| **Testing** | Pytest 9.1 & HTTPX | Automated unit, integration, and security test suites |

---

## Machine Learning Pipeline

```text
Raw Network Flow Dict / CSV
            │
            ▼
┌───────────────────────────────────────┐
│     app.services.ml_engine.py         │
│         FeaturePipeline               │
├───────────────────────────────────────┤
│ 1. Numeric Feature Extraction:        │
│    - flow_duration, packet_count,     │
│      byte_count, packet_rate,         │
│      byte_rate, source_port,          │
│      destination_port                 │
│ 2. Categorical One-Hot Encoding:      │
│    - is_tcp, is_udp, is_icmp          │
│ 3. StandardScaler Normalization       │
└───────────────────┬───────────────────┘
                    │
         Scaled Feature Matrix
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  Random Forest   │  │ Isolation Forest │
│    Classifier    │  │ Anomaly Detector │
├──────────────────┤  ├──────────────────┤
│ - Multi-Class    │  │ - Unsupervised   │
│ - 100 Estimators │  │ - Contamination  │
│ - Max Depth: 12  │  │   Factor: 0.10   │
│ - Predicts class │  │ - Computes       │
│   & confidence   │  │   anomaly score  │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
┌───────────────────────────────────────┐
│      Dynamic Severity Engine          │
│  - Evaluates Class + Anomaly Score    │
│  - Outputs: LOW / MEDIUM / HIGH /     │
│    CRITICAL with human reason         │
└───────────────────────────────────────┘
```

---

## Real-Time Monitoring (Simulated Traffic Notice)

> ### ⚠️ IMPORTANT OPERATIONAL NOTICE: SIMULATED TRAFFIC
>
> The real-time live monitoring module in NetGuard AI currently utilizes an internal **Simulated Traffic Engine** (`app.services.traffic_simulator.py`).
>
> - **Simulated Traffic**: Synthetic network flows modeling benign traffic, volumetric DDoS, port scans, and botnet beaconing are dynamically generated, fed through the live pipeline, classified by the ML models, stored in the database, and streamed over the authenticated WebSocket endpoint (`/ws/live-traffic`).
> - **Labeling**: Every generated flow and WebSocket packet is explicitly tagged with `"is_simulated": true` and `"source": "SIMULATED_TRAFFIC_ENGINE"`.
> - **Current Limitation**: **Direct live packet capture (e.g., libpcap, WinPcap/Npcap, raw socket sniffing, or network interface promiscuous mode) is NOT currently implemented.** Network telemetry must either be ingested via standard CSV exports or run through the built-in simulator.

---

## Project Directory Structure

```text
NetGuard AI/
├── backend/
│   ├── alembic/                      # Database schema migrations
│   │   ├── versions/                 # Version migration scripts
│   │   └── env.py                    # Alembic migration environment
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py               # Dependency injection (get_db, auth)
│   │   │   └── v1/
│   │   │       ├── api.py            # API router aggregator
│   │   │       └── endpoints/        # Modular API routes
│   │   │           ├── admin.py      # User governance & audit trail
│   │   │           ├── advanced_analytics.py # Threat heatmaps & timelines
│   │   │           ├── alerts.py     # Incident lifecycle management
│   │   │           ├── analytics.py  # Detections & overview metrics
│   │   │           ├── auth.py       # JWT login, registration & RBAC
│   │   │           ├── health.py     # Health checks & system probes
│   │   │           ├── ml.py         # Model training & prediction
│   │   │           ├── network.py    # CSV upload & flow search
│   │   │           └── realtime.py   # WebSocket live telemetry
│   │   ├── core/                     # Configuration, CORS, Security
│   │   ├── db/                       # SQLAlchemy engine & seed scripts
│   │   ├── models/                   # SQLAlchemy declarative ORM models
│   │   ├── schemas/                  # Pydantic validation schemas
│   │   └── services/                 # ML engine, ingestion, live pipeline
│   ├── tests/                        # 65 automated test suites
│   ├── alembic.ini                   # Alembic configuration
│   ├── pytest.ini                    # Pytest configuration
│   ├── requirements.txt              # Backend Python dependencies
│   └── .env.example                  # Environment configuration template
├── frontend/
│   ├── src/
│   │   ├── components/               # Atomic design UI components
│   │   │   ├── common/               # Buttons, Cards, Badges, Modals
│   │   │   ├── feedback/             # StatCards, Tables, Charts
│   │   │   └── layout/               # Navbar, Sidebar
│   │   ├── context/                  # AuthContext (JWT session state)
│   │   ├── pages/                    # 11 full-featured application pages
│   │   ├── styles/                   # Global CSS & Tailwind definitions
│   │   └── App.jsx                   # React Router route registry
│   ├── package.json                  # Frontend dependencies
│   ├── tailwind.config.js            # Cybersecurity theme configuration
│   └── vite.config.js                # Vite build configuration
├── ml/
│   ├── data/                         # Sample CICIDS2017 & UNSW-NB15 files
│   └── models/                       # Serialized Joblib model artifacts
├── database/
│   └── schema.sql                    # Initial SQL reference schema
└── docs/                             # Architecture & operational guides
```

---

## Setup & Installation Instructions

### Prerequisites

- **Python**: Version 3.11 or higher
- **Node.js**: Version 18.x or higher
- **PostgreSQL**: Version 16.x running locally or remotely

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/kkr-kkreddy-24a31a05kd/netguard-ai.git
cd netguard-ai
```

---

### Step 2: Database Configuration

1. Create a PostgreSQL database named `netguard_ai`:
   ```sql
   CREATE DATABASE netguard_ai;
   ```

---

### Step 3: Backend Setup

1. Navigate to the backend directory and set up a Python virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   ```

2. Activate the virtual environment:
   - **Windows**:
     ```bash
     .venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your local environment configuration file:
   ```bash
   cp .env.example .env
   ```
   Configure your database credentials in `.env`:
   ```ini
   DATABASE_URL="postgresql+psycopg2://postgres:YOUR_PASSWORD@127.0.0.1:5432/netguard_ai"
   SECRET_KEY="your-super-secret-jwt-key"
   ```

5. Run database migrations with Alembic:
   ```bash
   alembic upgrade head
   ```

6. Seed initial administrator and analyst credentials:
   ```bash
   python -m app.db.seed
   ```
   *Default Accounts Seeded:*
   - **Admin**: `admin@netguard.ai` / `Admin@NetGuard2026!`
   - **Analyst**: `analyst@netguard.ai` / `Analyst@NetGuard2026!`

7. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Root: `http://127.0.0.1:8000`
   - Interactive Docs: `http://127.0.0.1:8000/docs`

---

### Step 4: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the frontend environment file:
   ```bash
   cp .env.example .env
   ```

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## API Reference

The interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

### Primary Endpoints

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Application health check | No |
| `POST` | `/api/v1/auth/register` | Register new user account | No |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT token | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Bearer Token |
| `GET` | `/api/v1/auth/admin-only`| Admin privilege verification probe | Admin Role |
| `POST` | `/api/v1/network/upload` | Upload & ingest network flow CSV | Bearer Token |
| `GET` | `/api/v1/network/flows` | List paginated flows with filters | Bearer Token |
| `GET` | `/api/v1/network/statistics` | Aggregate telemetry metrics | Bearer Token |
| `POST` | `/api/v1/ml/train` | Train Random Forest & Isolation Forest | Bearer Token |
| `GET` | `/api/v1/ml/status` | Current active model version & metrics | Bearer Token |
| `GET` | `/api/v1/ml/models` | List persistent models in registry | Bearer Token |
| `POST` | `/api/v1/ml/predict` | Real-time flow prediction | Bearer Token |
| `POST` | `/api/v1/analytics/analyze-batch` | Batch process pending flows | Analyst Role |
| `GET` | `/api/v1/analytics/detections` | Query classified detections | Bearer Token |
| `GET` | `/api/v1/analytics/overview` | High-level SOC detection metrics | Bearer Token |
| `GET` | `/api/v1/alerts` | List incidents with lifecycle state | Bearer Token |
| `PATCH`| `/api/v1/alerts/{id}/acknowledge` | Acknowledge security alert | Analyst Role |
| `PATCH`| `/api/v1/alerts/{id}/resolve` | Resolve security alert with notes | Analyst Role |
| `WS` | `/api/v1/realtime/ws/live-traffic`| Full-duplex live telemetry stream | Token Query |
| `GET` | `/api/v1/advanced-analytics/threat-timeline`| 24-hour threat telemetry curve | Bearer Token |

---

## Testing & Quality Assurance

NetGuard AI includes an automated test suite covering unit, integration, database, and security layers.

### Run Backend Tests

```bash
cd backend
.venv\Scripts\pytest -v
```

**Verification Results: 65 passed in ~17 seconds**
- `test_auth.py`: Registration, Bcrypt hashing, token issuance, RBAC enforcement.
- `test_network.py`: Multi-format CSV ingestion, validation guards, pagination.
- `test_ml.py`: Feature pipeline scaling, model training, prediction, anomaly bounds.
- `test_analytics.py`: Batch classification, severity calculation rules.
- `test_alerts.py`: Automatic incident promotion and alert state transitions.
- `test_realtime.py`: Traffic simulator state transitions and WebSocket streaming.
- `test_advanced_analytics.py`: Timeline aggregations, report exports.

### Build Frontend for Production

```bash
cd frontend
npm run build
```
Generates a minified production bundle in `frontend/dist/`.

---

## Production Deployment

### Recommended Topology

1. **Web Reverse Proxy (Nginx / Cloudflare)**:
   - Terminates TLS/SSL.
   - Forwards `/api/*` to FastAPI on port 8000 with WebSocket upgrade headers (`Upgrade $http_upgrade`, `Connection "upgrade"`).
   - Serves static assets from `frontend/dist/`.
2. **Backend**:
   - Run multiple Uvicorn workers managed by systemd or Docker container:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
     ```
3. **Database**:
   - Managed PostgreSQL 16 instance with automated snapshots and connection pooling.

---

## Current Limitations & Future Scope

### Current Limitations

- **Simulated Traffic in Live Monitoring**: Live stream events are produced by the synthetic simulation engine. Direct promiscuous packet capture (PCAP) from network interfaces is not currently integrated.
- **Model Ingestion Formats**: Ingestion currently accepts structured flow records (NetFlow/IPFIX/CSV style) rather than raw binary pcap files.

### Future Scope

- **Native PCAP Ingestion**: Integration of Libpcap / Scapy workers to parse raw packet dumps into flow tuples.
- **Deep Learning Sequence Models**: Long Short-Term Memory (LSTM) or Transformer architectures for sequence-based anomaly forecasting.
- **Automated Active Defense**: Webhook triggers to push IP blocks directly to perimeter firewalls (iptables, pfSense, AWS Security Groups).
- **Distributed Ingestion Workers**: Apache Kafka / Celery task queues for high-velocity multi-gigabit SOC environments.

---

## License

This project is licensed under the MIT License.
