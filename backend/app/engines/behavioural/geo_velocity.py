"""Geo-Velocity & Impossible Travel Calculator for ORION v2."""

import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from app.engines.behavioural.profile_store import LoginRecord
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution


class GeoVelocityCalculator:
    """Calculates spatial movement velocities between logins to detect physically impossible travel."""

    EARTH_RADIUS_KM = 6371.0
    # Commercial airliner cruising speed with airport security buffer
    MAX_FEASIBLE_VELOCITY_KMH = 850.0
    # Minimum distance required before flagging impossible travel (filters local cellular tower hops)
    MIN_DISTANCE_THRESHOLD_KM = 150.0

    @classmethod
    def haversine_distance(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Compute the great-circle distance between two GPS coordinates using the Haversine formula."""
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
        )
        # Numerical guard against precision errors
        a = min(1.0, max(0.0, a))
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

        return cls.EARTH_RADIUS_KM * c

    @classmethod
    def calculate_velocity(
        cls,
        lat1: float,
        lon1: float,
        t1: datetime,
        lat2: float,
        lon2: float,
        t2: datetime,
    ) -> Dict[str, Any]:
        """Compute distance in km, elapsed time in hours, and velocity in km/h between two events."""
        dist_km = cls.haversine_distance(lat1, lon1, lat2, lon2)

        # Ensure tz-aware comparison
        if t1.tzinfo is None:
            t1 = t1.replace(tzinfo=timezone.utc)
        if t2.tzinfo is None:
            t2 = t2.replace(tzinfo=timezone.utc)

        time_delta_sec = abs((t2 - t1).total_seconds())
        time_delta_hours = max(time_delta_sec / 3600.0, 0.0001)  # avoid divide-by-zero

        velocity_kmh = dist_km / time_delta_hours

        is_impossible = (
            dist_km >= cls.MIN_DISTANCE_THRESHOLD_KM
            and velocity_kmh > cls.MAX_FEASIBLE_VELOCITY_KMH
        )

        return {
            "distance_km": round(dist_km, 2),
            "time_delta_hours": round(time_delta_hours, 4),
            "time_delta_minutes": round(time_delta_sec / 60.0, 1),
            "velocity_kmh": round(velocity_kmh, 1),
            "is_impossible": is_impossible,
        }

    @classmethod
    def evaluate_movement(
        cls,
        last_login: Optional[LoginRecord],
        current_lat: Optional[float],
        current_lon: Optional[float],
        current_time: datetime,
        current_country: Optional[str] = None,
        known_countries: Optional[set] = None,
    ) -> Tuple[List[EvidenceItem], Optional[Dict[str, Any]]]:
        """Evaluate current authentication location against previous login baseline."""
        evidence: List[EvidenceItem] = []
        metrics: Optional[Dict[str, Any]] = None

        if (
            last_login is None
            or last_login.latitude is None
            or last_login.longitude is None
            or current_lat is None
            or current_lon is None
        ):
            # No comparative geolocation available
            return evidence, metrics

        metrics = cls.calculate_velocity(
            lat1=last_login.latitude,
            lon1=last_login.longitude,
            t1=last_login.timestamp,
            lat2=current_lat,
            lon2=current_lon,
            t2=current_time,
        )

        if metrics["is_impossible"]:
            # Impossible Travel Detected
            vel = metrics["velocity_kmh"]
            conf = min(0.99, max(0.85, vel / 1500.0))
            evidence.append(
                EvidenceItem(
                    type=EvidenceType.IMPOSSIBLE_TRAVEL,
                    source=EvidenceSource.AUTH,
                    value=vel,
                    confidence=conf,
                    severity_contribution=SeverityContribution.CRITICAL,
                    weight=0.55,
                    indicators={
                        "distance_km": metrics["distance_km"],
                        "time_delta_minutes": metrics["time_delta_minutes"],
                        "velocity_kmh": metrics["velocity_kmh"],
                        "from_coords": [last_login.latitude, last_login.longitude],
                        "to_coords": [current_lat, current_lon],
                    },
                    explanation=(
                        f"Impossible travel detected: user traveled {metrics['distance_km']} km "
                        f"in {metrics['time_delta_minutes']} minutes (calculated speed: {metrics['velocity_kmh']} km/h), "
                        f"exceeding max commercial flight threshold of {cls.MAX_FEASIBLE_VELOCITY_KMH} km/h."
                    ),
                )
            )
        elif metrics["distance_km"] > 800.0:
            # Significant relocation within plausible flight time
            evidence.append(
                EvidenceItem(
                    type=EvidenceType.ANOMALOUS_GEOLOCATION,
                    source=EvidenceSource.AUTH,
                    value=metrics["distance_km"],
                    confidence=0.75,
                    severity_contribution=SeverityContribution.MEDIUM,
                    weight=0.25,
                    indicators={
                        "distance_km": metrics["distance_km"],
                        "velocity_kmh": metrics["velocity_kmh"],
                    },
                    explanation=(
                        f"User authenticated from a remote location {metrics['distance_km']} km away "
                        f"within plausible flight duration ({metrics['velocity_kmh']} km/h)."
                    ),
                )
            )

        # Check country anomaly
        if (
            current_country
            and known_countries
            and current_country not in known_countries
        ):
            evidence.append(
                EvidenceItem(
                    type=EvidenceType.ANOMALOUS_GEOLOCATION,
                    source=EvidenceSource.AUTH,
                    value=current_country,
                    confidence=0.80,
                    severity_contribution=SeverityContribution.HIGH,
                    weight=0.30,
                    indicators={
                        "observed_country": current_country,
                        "known_countries": list(known_countries),
                    },
                    explanation=f"Authentication originated from anomalous unrecorded country: '{current_country}'.",
                )
            )

        return evidence, metrics
