# Database Architecture & Core Data Model

This directory houses the PostgreSQL schema definitions, migration scripts, and seed data for NetGuard AI.

## Tables Defined in Core Data Model
1. **users**: User credentials, role (`analyst`, `admin`), timestamps.
2. **network_flows**: Raw and preprocessed network telemetry (IPs, ports, protocols, byte/packet rates, duration, flags).
3. **detections**: Machine learning attack classifications (attack type, confidence, severity, model version).
4. **anomalies**: Unsupervised / statistical anomaly scores and anomaly categories.
5. **alerts**: Incident notifications with priority status (`active`, `investigating`, `resolved`).
6. **models**: Model registry storing algorithm names, versions, accuracy, precision, recall, and F1-score.
7. **audit_logs**: Tamper-evident audit trail of user actions for security compliance.

*Note: Live PostgreSQL connections and migrations will be implemented in Phase 2.*
