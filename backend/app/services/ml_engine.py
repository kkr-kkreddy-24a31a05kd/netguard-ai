import os
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)
from sqlalchemy.orm import Session
from app.models.flow import NetworkFlow
from app.models.model_registry import ModelRegistry

# Default feature definitions
NUMERIC_FEATURES = [
    "flow_duration",
    "packet_count",
    "byte_count",
    "packet_rate",
    "byte_rate",
    "source_port",
    "destination_port",
]
CATEGORICAL_FEATURES = ["protocol"]
ALL_FEATURES = NUMERIC_FEATURES + ["is_tcp", "is_udp", "is_icmp"]

MODEL_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models")
)
os.makedirs(MODEL_DIR, exist_ok=True)


class FeaturePipeline:
    """Preprocesses raw network flow dictionaries/DataFrames into model-ready tensors."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.fitted = False

    def transform_df(self, df: pd.DataFrame, fit: bool = False) -> np.ndarray:
        df = df.copy()

        # Handle numeric features and sanitize infinities/NaNs
        for col in NUMERIC_FEATURES:
            if col not in df.columns:
                df[col] = 0.0
            else:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

        df = df.replace([np.inf, -np.inf], 0.0)

        # One-hot encode protocol
        proto_series = df["protocol"].astype(str).str.upper() if "protocol" in df.columns else pd.Series(["TCP"] * len(df))
        df["is_tcp"] = (proto_series == "TCP").astype(float)
        df["is_udp"] = (proto_series == "UDP").astype(float)
        df["is_icmp"] = (proto_series == "ICMP").astype(float)

        feature_matrix = df[ALL_FEATURES].values

        if fit:
            scaled = self.scaler.fit_transform(feature_matrix)
            self.fitted = True
            return scaled
        else:
            if not self.fitted:
                return feature_matrix
            return self.scaler.transform(feature_matrix)


class MLEngine:
    """Core Machine Learning Detection and Anomaly Engine for NetGuard AI."""

    _instance = None

    def __init__(self):
        self.pipeline = FeaturePipeline()
        self.classifier: Optional[RandomForestClassifier] = None
        self.anomaly_detector: Optional[IsolationForest] = None
        self.classes_: List[str] = ["Normal"]
        self.model_version: str = "v1.0.0"
        self.last_trained_at: Optional[datetime] = None
        self.metrics: Dict[str, Any] = {}
        self.is_loaded: bool = False
        self.load_models()

    @classmethod
    def get_instance(cls) -> "MLEngine":
        if cls._instance is None:
            cls._instance = MLEngine()
        return cls._instance

    def load_models(self) -> bool:
        """Load persistent model artifacts from disk if available."""
        clf_path = os.path.join(MODEL_DIR, f"classifier_{self.model_version}.joblib")
        iso_path = os.path.join(MODEL_DIR, f"anomaly_{self.model_version}.joblib")
        pipe_path = os.path.join(MODEL_DIR, f"pipeline_{self.model_version}.joblib")
        meta_path = os.path.join(MODEL_DIR, f"metadata_{self.model_version}.json")

        if os.path.exists(clf_path) and os.path.exists(iso_path) and os.path.exists(pipe_path):
            try:
                self.classifier = joblib.load(clf_path)
                self.anomaly_detector = joblib.load(iso_path)
                self.pipeline = joblib.load(pipe_path)
                if os.path.exists(meta_path):
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                        self.classes_ = meta.get("classes", ["Normal"])
                        self.metrics = meta.get("metrics", {})
                        if meta.get("trained_at"):
                            self.last_trained_at = datetime.fromisoformat(meta["trained_at"])
                self.is_loaded = True
                return True
            except Exception as e:
                print(f"Warning: Failed to load existing model artifacts: {e}")
                self.is_loaded = False
        return False

    def train_models(
        self,
        db: Session,
        version: str = "v1.0.0",
        dataset_name: str = "Ingested Flows Telemetry",
    ) -> Dict[str, Any]:
        """Train both Supervised Attack Classifier and Unsupervised Isolation Forest."""
        start_time = time.time()

        # Query ingested flows from PostgreSQL
        flows = db.query(NetworkFlow).limit(20000).all()

        # Fallback to local sample dataset if DB has insufficient rows
        if len(flows) < 20:
            sample_path = os.path.abspath(
                os.path.join(
                    os.path.dirname(__file__),
                    "..",
                    "..",
                    "..",
                    "ml",
                    "data",
                    "sample_network_flows.csv",
                )
            )
            if os.path.exists(sample_path):
                df = pd.read_csv(sample_path)
            else:
                raise ValueError("Insufficient flow data to train models. Upload a dataset first.")
        else:
            data_dicts = [
                {
                    "flow_duration": f.flow_duration,
                    "packet_count": f.packet_count,
                    "byte_count": f.byte_count,
                    "packet_rate": f.packet_rate,
                    "byte_rate": f.byte_rate,
                    "source_port": f.source_port,
                    "destination_port": f.destination_port,
                    "protocol": f.protocol,
                    "label": f.label or "Normal",
                }
                for f in flows
            ]
            df = pd.DataFrame(data_dicts)

        # Standardize target labels
        df["label"] = df["label"].fillna("Normal").astype(str).str.strip()
        y = df["label"].values

        # Preprocess features
        X = self.pipeline.transform_df(df, fit=True)

        # Train / Test split with safety for small datasets or rare classes
        unique_classes = list(set(y))
        class_counts = pd.Series(y).value_counts()
        can_stratify = (len(class_counts) > 1) and (class_counts.min() >= 2) and (len(X) >= len(class_counts) * 4)
        stratify = y if can_stratify else None

        if len(X) < 20:
            X_train, X_test, y_train, y_test = X, X, y, y
        else:
            test_ratio = 0.25 if len(X) >= 40 else 0.2
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_ratio, random_state=42, stratify=stratify
            )

        # 1. Supervised Attack Classifier (Random Forest)
        clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            random_state=42,
            class_weight="balanced" if len(unique_classes) > 1 else None,
        )
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

        labels_order = sorted(list(set(np.concatenate([y_test, y_pred]))))
        cm = confusion_matrix(y_test, y_pred, labels=labels_order).tolist()

        # 2. Unsupervised Anomaly Detector (Isolation Forest)
        iso = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
        )
        iso.fit(X)

        self.classifier = clf
        self.anomaly_detector = iso
        self.classes_ = list(clf.classes_)
        self.model_version = version
        self.last_trained_at = datetime.now(timezone.utc)

        self.metrics = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": cm,
            "classes": labels_order,
            "training_samples": len(X_train),
            "testing_samples": len(X_test),
            "training_duration_seconds": round(time.time() - start_time, 3),
        }

        # Save artifacts via Joblib
        joblib.dump(clf, os.path.join(MODEL_DIR, f"classifier_{version}.joblib"))
        joblib.dump(iso, os.path.join(MODEL_DIR, f"anomaly_{version}.joblib"))
        joblib.dump(self.pipeline, os.path.join(MODEL_DIR, f"pipeline_{version}.joblib"))

        metadata = {
            "version": version,
            "algorithm": "RandomForest + IsolationForest",
            "features": ALL_FEATURES,
            "classes": self.classes_,
            "metrics": self.metrics,
            "dataset": dataset_name,
            "trained_at": self.last_trained_at.isoformat(),
        }
        with open(os.path.join(MODEL_DIR, f"metadata_{version}.json"), "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        self.is_loaded = True

        # Save / update in PostgreSQL model registry
        existing_model = db.query(ModelRegistry).filter(ModelRegistry.version == version).first()
        if existing_model:
            existing_model.accuracy = acc
            existing_model.precision = prec
            existing_model.recall = rec
            existing_model.f1_score = f1
            existing_model.metrics_json = json.dumps(self.metrics)
            existing_model.features_used = json.dumps(ALL_FEATURES)
            existing_model.dataset_source = dataset_name
        else:
            reg = ModelRegistry(
                name="NetGuard Dual-Stage Attack Classifier",
                version=version,
                algorithm="RandomForest + IsolationForest",
                accuracy=acc,
                precision=prec,
                recall=rec,
                f1_score=f1,
                metrics_json=json.dumps(self.metrics),
                features_used=json.dumps(ALL_FEATURES),
                dataset_source=dataset_name,
            )
            db.add(reg)
        db.commit()

        return metadata

    def predict_flow(self, flow_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run real-time inference on a network flow.
        Returns: predicted attack class, confidence, anomaly score, and threat severity.
        """
        pkt_cnt = flow_data.get("packet_count", 0) or 0
        byte_cnt = flow_data.get("byte_count", 0) or 0
        is_volumetric = (pkt_cnt > 10000) or (byte_cnt > 5000000)

        if not self.is_loaded or self.classifier is None:
            # Fallback heuristic if models haven't been trained yet
            return {
                "prediction": "Volumetric Threat" if is_volumetric else "Normal",
                "attack_type": "Volumetric Threat" if is_volumetric else "Normal",
                "confidence": 0.95,
                "anomaly_score": 0.90 if is_volumetric else 0.05,
                "is_anomaly": is_volumetric,
                "severity": "CRITICAL" if is_volumetric else "LOW",
                "model_version": "heuristic_fallback",
            }

        df = pd.DataFrame([flow_data])
        X = self.pipeline.transform_df(df, fit=False)

        # 1. Supervised prediction
        pred_label = str(self.classifier.predict(X)[0])
        probas = self.classifier.predict_proba(X)[0]
        max_idx = np.argmax(probas)
        confidence = float(probas[max_idx])

        # 2. Unsupervised anomaly scoring (-0.5 to 0.5 mapped to 0.0 to 1.0)
        raw_score = float(self.anomaly_detector.decision_function(X)[0])
        anomaly_score = float(np.clip(1.0 - (raw_score + 0.5), 0.0, 1.0))
        if is_volumetric:
            anomaly_score = max(anomaly_score, 0.90)
        is_anomaly = bool(anomaly_score > 0.65 or is_volumetric or pred_label.lower() != "normal")

        # 3. Transparent threat severity calculation
        norm_pred = pred_label.lower()
        if is_volumetric or any(k in norm_pred for k in ["ddos", "botnet", "exploit", "backdoor", "flood"]):
            severity = "CRITICAL"
        elif any(k in norm_pred for k in ["dos", "patator", "brute", "portscan"]):
            severity = "HIGH"
        elif is_anomaly or norm_pred != "normal":
            severity = "MEDIUM"
        else:
            severity = "LOW"

        return {
            "prediction": pred_label,
            "attack_type": pred_label,
            "confidence": round(confidence, 4),
            "anomaly_score": round(anomaly_score, 4),
            "is_anomaly": is_anomaly,
            "severity": severity,
            "model_version": self.model_version,
        }


ml_engine = MLEngine.get_instance()
