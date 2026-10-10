"""Threat Classification and Risk Assessment Schemas for ORION v2."""

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ThreatType(str, Enum):
    PHISHING = "phishing"
    MALICIOUS_URL = "malicious_url"
    IMPERSONATION = "impersonation"
    DEEPFAKE_IMAGE = "deepfake_image"
    DEEPFAKE_VIDEO = "deepfake_video"
    SYNTHETIC_AUDIO = "synthetic_audio"
    VOICE_CLONE = "voice_clone"
    CREDENTIAL_THEFT = "credential_theft"
    ACCOUNT_TAKEOVER = "account_takeover"
    AUTHENTICATION_ANOMALY = "authentication_anomaly"
    MALWARE_INDICATOR = "malware_indicator"
    SUSPICIOUS_NETWORK_ACTIVITY = "suspicious_network_activity"
    API_ABUSE = "api_abuse"
    ABNORMAL_USER_ACTIVITY = "abnormal_user_activity"
    INFORMATIONAL_AI_MEDIA = "informational_ai_media"
    BENIGN = "benign"


class ThreatAssessment(str, Enum):
    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    MALICIOUS = "MALICIOUS"
    INCONCLUSIVE = "INCONCLUSIVE"


class RiskLevel(str, Enum):
    SAFE = "SAFE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskContribution(BaseModel):
    evidence_id: str = Field(description="Supporting evidence item ID")
    type: str = Field(description="Evidence type name")
    contribution: float = Field(description="Calculated risk points contribution")
    reason: str = Field(description="Analyst-facing explanation of risk driver")

    model_config = ConfigDict(use_enum_values=True)


class InteractionContribution(BaseModel):
    rule: str = Field(description="Name/identifier of applied interaction or circuit breaker rule")
    contribution: float = Field(description="Numerical risk bonus or circuit breaker floor adjustment")
    reason: str = Field(description="Justification for interaction synergy or floor override")

    model_config = ConfigDict(use_enum_values=True)


class MitreTechnique(BaseModel):
    id: str = Field(description="MITRE ATT&CK Technique ID, e.g., T1566.002")
    name: str = Field(description="Technique name, e.g., Spearphishing Link")
    tactic: str = Field(description="Tactic phase, e.g., Initial Access")
    url: str = Field(description="URL to the official MITRE knowledge base entry")
    reason: Optional[str] = Field(default=None, description="Grounding justification for technique attribution")
    supporting_evidence_ids: List[str] = Field(default_factory=list, description="IDs of supporting evidence items")


class RiskAssessment(BaseModel):
    score: float = Field(ge=0.0, le=1.0, description="Normalized risk score between 0.0 and 1.0")
    level: RiskLevel = Field(description="Discretized risk tier")
    confidence: float = Field(ge=0.0, le=1.0, description="Overall confidence based on evidence reliability")
    assessment: ThreatAssessment = Field(description="Primary operational assessment")
    primary_threat: ThreatType = Field(description="Leading threat classification")
    secondary_threats: List[ThreatType] = Field(default_factory=list)
    risk_drivers: List[str] = Field(default_factory=list, description="Top evidence items driving the score")
    synergy_bonuses: float = Field(default=0.0, description="Additional risk contribution from interaction rules")
    dampening_reductions: float = Field(default=0.0, description="Risk dampening from trust/verification factors")
    mitre_techniques: List[MitreTechnique] = Field(default_factory=list)
    base_score: float = Field(default=0.0, description="Base score prior to interaction rules and circuit breakers")
    contributions: List[RiskContribution] = Field(default_factory=list, description="Individual evidence item risk contributions")
    interaction_contributions: List[InteractionContribution] = Field(default_factory=list, description="Non-linear interaction contributions")
    policy_version: str = Field(default="4.0", description="Risk policy version used for calculation")

    model_config = ConfigDict(use_enum_values=True)
