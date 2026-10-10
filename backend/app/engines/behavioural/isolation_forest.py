"""Isolation Forest Anomaly Detection Engine for User Authentication in ORION v2."""

import math
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from sklearn.ensemble import IsolationForest

from app.engines.behavioural.profile_store import UserBaselineProfile
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution


class IsolationForestAnomalyDetector:
    """Unsupervised multi-dimensional anomaly detection for user login behavior."""

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.model: IsolationForest = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=random_state,
        )
        self._fit_baseline_distribution()

    def _fit_baseline_distribution(self) -> None:
        """Fit the isolation forest on synthetic enterprise baseline behavior.
        
        Features:
        0: hour_of_day (0 - 23)
        1: day_of_week (0 - 6, 0=Mon)
        2: is_new_device (0.0 or 1.0)
        3: is_new_asn (0.0 or 1.0)
        4: is_new_country (0.0 or 1.0)
        5: failed_attempts (0 - 10)
        6: log_velocity (log1p(velocity_kmh))
        """
        rng = np.random.default_rng(self.random_state)
        n_samples = 1500

        # Normal business login patterns:
        # Hours: peak around 10am-4pm (mean 13, std 2.5), clipped to 7-20
        hours = np.clip(rng.normal(13.0, 2.5, n_samples), 7.0, 20.0)
        # Weekdays: Mon(0) to Fri(4)
        days = rng.choice([0, 1, 2, 3, 4], size=n_samples, p=[0.21, 0.22, 0.22, 0.21, 0.14])
        # Device novelty: 98% recognized devices
        new_device = rng.choice([0.0, 1.0], size=n_samples, p=[0.98, 0.02])
        # ASN novelty: 97% recognized enterprise/home ASNs
        new_asn = rng.choice([0.0, 1.0], size=n_samples, p=[0.97, 0.03])
        # Country novelty: 99% home country
        new_country = rng.choice([0.0, 1.0], size=n_samples, p=[0.99, 0.01])
        # Failed attempts: 94% 0 failures, 5% 1 failure, 1% 2 failures
        failed = rng.choice([0, 1, 2], size=n_samples, p=[0.94, 0.05, 0.01])
        # Velocity: mostly stationary or local commutes (0 to 60 km/h)
        velocities = rng.exponential(scale=10.0, size=n_samples)
        velocities = np.clip(velocities, 0.0, 120.0)
        log_vel = np.log1p(velocities)

        X_train = np.column_stack([
            hours,
            days,
            new_device,
            new_asn,
            new_country,
            failed,
            log_vel,
        ])

        self.model.fit(X_train)

    def extract_features(
        self,
        hour: int,
        day_of_week: int,
        is_new_device: bool,
        is_new_asn: bool,
        is_new_country: bool,
        failed_attempts: int,
        velocity_kmh: float,
    ) -> np.ndarray:
        """Construct the normalized feature vector for scoring."""
        log_vel = math.log1p(max(0.0, velocity_kmh))
        return np.array([
            float(hour),
            float(day_of_week),
            1.0 if is_new_device else 0.0,
            1.0 if is_new_asn else 0.0,
            1.0 if is_new_country else 0.0,
            float(failed_attempts),
            log_vel,
        ]).reshape(1, -1)

    def compute_anomaly_score(self, features: np.ndarray) -> Tuple[float, bool]:
        """Compute continuous anomaly score [0.0, 1.0] and binary outlier flag."""
        # decision_function yields higher values for inliers, negative for outliers
        dec_score = float(self.model.decision_function(features)[0])
        pred = int(self.model.predict(features)[0])  # -1 outlier, +1 inlier

        # Transform decision function to [0, 1] anomaly score:
        # Typical decision range: -0.3 to +0.25
        # Inliers: dec > 0.05 -> score < 0.35
        # Outliers: dec < -0.05 -> score > 0.65
        anomaly_score = 0.5 - (dec_score * 2.0)
        anomaly_score = round(min(1.0, max(0.0, anomaly_score)), 3)

        is_outlier = pred == -1 or anomaly_score >= 0.65
        return anomaly_score, is_outlier

    def evaluate_auth_event(
        self,
        user_id: str,
        profile: UserBaselineProfile,
        hour: int,
        day_of_week: int,
        is_new_device: bool,
        is_new_asn: bool,
        is_new_country: bool,
        failed_attempts: int,
        velocity_kmh: float,
    ) -> Tuple[List[EvidenceItem], float]:
        """Run anomaly detection and synthesize canonical EvidenceItems."""
        features = self.extract_features(
            hour=hour,
            day_of_week=day_of_week,
            is_new_device=is_new_device,
            is_new_asn=is_new_asn,
            is_new_country=is_new_country,
            failed_attempts=failed_attempts,
            velocity_kmh=velocity_kmh,
        )

        anomaly_score, is_outlier = self.compute_anomaly_score(features)
        evidence: List[EvidenceItem] = []

        # 1. Isolation Forest Anomaly Evidence
        if is_outlier or anomaly_score >= 0.60:
            sev = SeverityContribution.CRITICAL if anomaly_score >= 0.80 else SeverityContribution.HIGH
            evidence.append(
                EvidenceItem(
                    type=EvidenceType.ISOLATION_FOREST_ANOMALY,
                    source=EvidenceSource.AUTH,
                    value=anomaly_score,
                    confidence=min(0.95, 0.70 + (anomaly_score * 0.25)),
                    severity_contribution=sev,
                    weight=0.45,
                    indicators={
                        "anomaly_score": anomaly_score,
                        "hour": hour,
                        "day_of_week": day_of_week,
                        "is_new_device": is_new_device,
                        "is_new_asn": is_new_asn,
                        "is_new_country": is_new_country,
                        "failed_attempts": failed_attempts,
                        "velocity_kmh": round(velocity_kmh, 1),
                    },
                    explanation=(
                        f"Unsupervised Isolation Forest detected multi-feature behavioral anomaly "
                        f"(anomaly score: {anomaly_score}) for user '{user_id}' across time, network, and device vectors."
                    ),
                )
            )

        # 2. Specific Behavioral Deviations:
        # Off-hours activity check against user's specific baseline
        if hour not in profile.typical_hours or day_of_week not in profile.typical_days:
            evidence.append(
                EvidenceItem(
                    type=EvidenceType.OFF_HOURS_ACTIVITY,
                    source=EvidenceSource.AUTH,
                    value=f"Hour {hour:02d}:00 (Day {day_of_week})",
                    confidence=0.80,
                    severity_contribution=SeverityContribution.LOW,
                    weight=0.15,
                    indicators={"hour": hour, "typical_hours": sorted(list(profile.typical_hours))},
                    explanation=f"Authentication attempt occurred outside user's typical schedule (hour {hour:02d}:00).",
                )
            )

        # New device fingerprint
        if is_new_device:
            evidence.append(
                EvidenceItem(
                    type=EvidenceType.NEW_DEVICE_FINGERPRINT,
                    source=EvidenceSource.AUTH,
                    value=True,
                    confidence=0.85,
                    severity_contribution=SeverityContribution.MEDIUM,
                    weight=0.25,
                    indicators={"known_devices_count": len(profile.known_devices)},
                    explanation=f"Unrecognized device hardware fingerprint encountered for user '{user_id}'.",
                )
            )

        # Failed login burst
        if failed_attempts >= 3:
            evidence.append(
                EvidenceItem(
                    type=EvidenceType.FAILED_LOGIN_BURST,
                    source=EvidenceSource.AUTH,
                    value=failed_attempts,
                    confidence=min(0.98, 0.75 + (failed_attempts * 0.05)),
                    severity_contribution=SeverityContribution.HIGH if failed_attempts < 6 else SeverityContribution.CRITICAL,
                    weight=0.35,
                    indicators={"consecutive_failed_attempts": failed_attempts},
                    explanation=(
                        f"Detected burst of {failed_attempts} consecutive failed authentication attempts "
                        f"preceding current request (credential stuffing / brute force indicator)."
                    ),
                )
            )

        return evidence, anomaly_score
