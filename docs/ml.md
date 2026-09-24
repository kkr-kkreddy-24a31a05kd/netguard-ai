# NetGuard AI — Machine Learning Architecture & Pipeline

## 1. Dual-Stage Architecture

NetGuard AI employs a hybrid dual-stage machine learning methodology:
1. **Stage 1: Supervised Attack Classification**
   - **Algorithm**: `RandomForestClassifier` (100 estimators, max_depth=15).
   - **Objective**: Multi-class classification into known attack families (`Normal`, `DDoS`, `PortScan`, `Botnet`, `Infiltration`, `Web Attack`, etc.).
   - **Outputs**: Discrete attack prediction and probability confidence vector.

2. **Stage 2: Unsupervised Statistical Anomaly Detection**
   - **Algorithm**: `IsolationForest` (contamination=0.10, 100 estimators).
   - **Objective**: Isolation of zero-day exploits, novel protocol anomalies, and stealthy volumetric deviations.
   - **Outputs**: Continuous anomaly score normalized between [0, 1] and binary outlier flag `is_anomaly`.

---

## 2. Feature Pipeline & Preprocessing

The `FeaturePipeline` extracts, normalizes, and scales 10 key network flow dimensions without assuming dataset-specific column names:

| Feature Name | Description | Transformation |
|---|---|---|
| `flow_duration` | Duration of the flow in seconds | `StandardScaler` (log-transformed) |
| `packet_count` | Number of packets in flow | `StandardScaler` (log1p) |
| `byte_count` | Total bytes transmitted | `StandardScaler` (log1p) |
| `packet_rate` | Packets per second | Calculated: `packet_count / flow_duration` |
| `byte_rate` | Bytes per second | Calculated: `byte_count / flow_duration` |
| `source_port` | Ephemeral or service source port | MinMax scaled [0, 1] |
| `destination_port` | Destination port | MinMax scaled [0, 1] |
| `is_well_known_port`| Indicator if port < 1024 | Binary [0, 1] |
| `is_tcp` | Flow uses TCP protocol | One-hot encoded |
| `is_udp` | Flow uses UDP protocol | One-hot encoded |

---

## 3. Data Leakage Prevention

- Transformations are fit strictly on the **training set split** (80%).
- Testing split (20%) is evaluated strictly with `transform()` without refitting.
- Stratified sampling is used when class representations allow; fallback to non-stratified split prevents crashes on rare edge classes.
- Target labels are completely excluded from the feature matrix $X$.

---

## 4. Evaluation Metrics & Confusion Matrix

Models are benchmarked using:
- **Accuracy**: Overall classification accuracy.
- **Precision (Macro & Weighted)**: False-positive mitigation.
- **Recall (Macro & Weighted)**: Detection sensitivity on critical threats.
- **F1-Score**: Harmonic mean of precision and recall.
- **Confusion Matrix**: Full true vs predicted matrix logged in PostgreSQL `models` table and visualized in the React dashboard.

---

## 5. Artifact Persistence

- Classifier and Anomaly Detector are serialized using **Joblib**:
  - `ml/models/classifier_v1.0.0.joblib`
  - `ml/models/anomaly_v1.0.0.joblib`
  - `ml/models/pipeline_v1.0.0.joblib`
- Metadata, hyperparameters, and test metrics are recorded in PostgreSQL table `models`.
