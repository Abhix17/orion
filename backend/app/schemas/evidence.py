"""Universal Evidence Schema for ORION v2.

Every detection provider, heuristic analyzer, and ML model outputs standardized
Evidence objects that feed the Deterministic Risk Engine.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field


class EvidenceSource(str, Enum):
    WEB = "web_intelligence"
    MESSAGE = "message_intelligence"
    IMAGE = "image_intelligence"
    VIDEO = "video_intelligence"
    AUDIO = "audio_intelligence"
    AUTH = "auth_intelligence"
    THREAT_INTEL = "threat_intel"
    SEMANTIC = "semantic_observer"
    HEURISTIC = "heuristic_rules"
    BEHAVIOURAL = "auth_intelligence"  # Alias for AUTH
    MULTIMODAL = "multimodal"


class SeverityContribution(str, Enum):
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class EvidenceType(str, Enum):
    # Web & Phishing
    LOOKALIKE_DOMAIN = "lookalike_domain"
    LEXICAL_LOOKALIKE_DOMAIN = "lookalike_domain"  # Alias
    SUSPICIOUS_TLD = "suspicious_tld"
    PUNYCODE_HOST = "punycode_host"
    CREDENTIAL_PATH = "credential_path"
    HIGH_URL_ENTROPY = "high_url_entropy"
    URLBERT_MALICIOUS = "urlbert_malicious"
    URLBERT_PHISHING_CONFIDENCE = "urlbert_malicious"  # Alias
    THREAT_INTEL_MATCH = "threat_intel_match"
    EXTERNAL_THREAT_INTEL_MATCH = "threat_intel_match"  # Alias

    # Message & NLP
    PHISHING_LANGUAGE = "phishing_language"
    URGENT_CALL_TO_ACTION = "urgent_call_to_action"
    CREDENTIAL_HARVEST_INTENT = "credential_harvest_intent"
    FINANCIAL_DEMAND_INTENT = "financial_demand_intent"
    SOCIAL_ENGINEERING_TACTIC = "social_engineering_tactic"

    # Identity & Media
    AI_GENERATED_MEDIA = "ai_generated_media"
    IMAGE_FORENSIC_ANOMALY = "image_forensic_anomaly"
    FACE_TAMPERING_INDICATOR = "face_tampering_indicator"
    FACIAL_MANIPULATION_DETECTED = "face_tampering_indicator"  # Alias
    SYNTHETIC_SPEECH_DETECTED = "synthetic_speech_detected"
    SPEAKER_SIMILARITY_MATCH = "speaker_similarity_match"
    PROTECTED_IDENTITY_TARGETED = "protected_identity_targeted"
    TEMPORAL_VIDEO_FLICKER = "temporal_video_flicker"
    AUDIO_VISUAL_MISMATCH = "audiovisual_mismatch"
    DEEPFAKE_VIDEO = "deepfake_video"

    # Behavioural & Technical
    FAILED_LOGIN_BURST = "failed_login_burst"
    AUTHENTICATION_BURST = "failed_login_burst"  # Alias
    ANOMALOUS_GEOLOCATION = "anomalous_geolocation"
    NEW_DEVICE_FINGERPRINT = "new_device_fingerprint"
    NEW_DEVICE_LOGIN = "new_device_fingerprint"  # Alias
    OFF_HOURS_ACTIVITY = "off_hours_activity"
    IMPOSSIBLE_TRAVEL = "impossible_travel"
    ISOLATION_FOREST_ANOMALY = "isolation_forest_anomaly"


class EvidenceStatus(str, Enum):
    OBSERVED = "observed"
    INCONCLUSIVE = "inconclusive"
    UNAVAILABLE = "unavailable"


class EvidenceItem(BaseModel):
    id: str = Field(default_factory=lambda: f"evi_{uuid4().hex[:12]}")
    type: EvidenceType
    source: EvidenceSource
    category: str = Field(default="general", description="Functional category (web, media, behaviour, message, threat_intel, identity)")
    provider: Optional[str] = Field(default=None, description="Detection provider identifier")
    model: Optional[str] = Field(default=None, description="Model identifier or checkpoint name")
    value: Any = Field(description="Normalized scalar value, boolean, or probability")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence of the detection provider")
    severity_contribution: SeverityContribution = Field(
        default=SeverityContribution.LOW,
        description="Severity weight contribution towards the risk engine"
    )
    weight: float = Field(default=0.1, ge=0.0, le=1.0, description="Base weight assigned in risk calculation")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: EvidenceStatus = Field(default=EvidenceStatus.OBSERVED, description="Observation status: observed, inconclusive, or unavailable")
    indicators: Dict[str, Any] = Field(default_factory=dict, description="Raw feature breakdown, metrics, and telemetry")
    entity_refs: List[str] = Field(default_factory=list, description="IDs of correlated entities")
    incident_refs: List[str] = Field(default_factory=list, description="IDs of correlated incidents")
    explanation: str = Field(description="Human-readable explanation of why this evidence was produced")

    model_config = ConfigDict(use_enum_values=True)
