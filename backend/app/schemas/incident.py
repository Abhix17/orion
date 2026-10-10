"""Canonical Incident Schema for ORION v2."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.evidence import EvidenceItem, EvidenceSource
from app.schemas.threat import MitreTechnique, RiskLevel, ThreatAssessment, ThreatType
from app.schemas.response import ActionRecommendation


class IncidentStatus(str, Enum):
    NEW = "NEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    INVESTIGATING = "INVESTIGATING"
    CONTAINED = "CONTAINED"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class EntityType(str, Enum):
    USER = "user"
    ORGANIZATION = "organization"
    DOMAIN = "domain"
    URL = "url"
    IP = "ip"
    DEVICE = "device"
    EMAIL = "email"
    PHONE = "phone"
    PERSON = "person"
    ACCOUNT = "account"
    SESSION = "session"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    INCIDENT = "incident"
    MEDIA_HASH = "media_hash"


class AttackChainStage(str, Enum):
    INITIAL_ACCESS = "initial_access"
    SOCIAL_ENGINEERING = "social_engineering"
    MALICIOUS_URL = "malicious_url"
    CREDENTIAL_THEFT = "credential_theft"
    ACCOUNT_ANOMALY = "account_anomaly"


class IncidentTimelineEvent(BaseModel):
    id: str = Field(default_factory=lambda: f"tle_{uuid4().hex[:8]}")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: str = Field(description="Subsystem or observer generating event")
    title: str = Field(description="Brief headline of the event")
    description: str = Field(description="Detailed context of the occurrence")
    stage: Optional[str] = Field(default=None, description="Attack chain stage if applicable")
    evidence_ids: List[str] = Field(default_factory=list, description="IDs of supporting evidence")

    model_config = ConfigDict(use_enum_values=True)


class CorrelationGroup(BaseModel):
    id: str = Field(default_factory=lambda: f"grp_{uuid4().hex[:8]}")
    name: str = Field(description="Descriptive name of correlated cluster")
    entity_ids: List[str] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    correlation_confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    relationships: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(use_enum_values=True)


class IncidentEntity(BaseModel):
    id: str = Field(default_factory=lambda: f"ent_{uuid4().hex[:8]}")
    name: str
    type: EntityType
    attributes: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(use_enum_values=True)


class AnalystNote(BaseModel):
    id: str = Field(default_factory=lambda: f"note_{uuid4().hex[:8]}")
    text: str = Field(description="Analyst commentary or investigation update")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    author: str = Field(default="Security Analyst", description="Identity or role of analyst adding note")

    model_config = ConfigDict(use_enum_values=True)


class Incident(BaseModel):
    id: str = Field(default_factory=lambda: f"inc_{uuid4().hex[:12]}")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    title: str = Field(description="Descriptive title of the security incident")
    source: EvidenceSource = Field(description="Originating subsystem (web, message, audio, etc.)")
    input_type: str = Field(description="Input modality: 'url', 'text', 'audio', 'image', 'video', 'auth_event'")
    input_summary: str = Field(description="Redacted/safe snippet or preview description of input payload")
    
    # Classification & Risk
    threat_type: ThreatType
    assessment: ThreatAssessment
    risk_level: RiskLevel
    risk_score: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    policy_version: str = Field(default="4.0", description="Risk policy version used when incident was generated")
    
    # Lineage & Grounding
    evidence: List[EvidenceItem] = Field(default_factory=list)
    explanation: str = Field(description="Grounded human-readable explanation of why this incident was triggered")
    xai_summary: Optional[str] = Field(default=None, description="Synthesized cross-modal evidence chain narrative")
    risk_drivers: List[str] = Field(default_factory=list)
    mitre_techniques: List[MitreTechnique] = Field(default_factory=list)
    
    # Operations
    recommended_actions: List[ActionRecommendation] = Field(default_factory=list)
    entities: List[IncidentEntity] = Field(default_factory=list)
    timeline: List[IncidentTimelineEvent] = Field(default_factory=list, description="Chronological event progression")
    correlation_groups: List[Dict[str, Any]] = Field(default_factory=list, description="Correlated entity/evidence clusters")
    attack_chain: List[str] = Field(default_factory=list, description="Ordered attack chain stages supported by evidence")
    status: IncidentStatus = Field(default=IncidentStatus.NEW)
    notes: List[AnalystNote] = Field(default_factory=list, description="Append-only analyst commentary log")
    analysis_run_id: str = Field(default_factory=lambda: f"run_{uuid4().hex[:10]}")
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(use_enum_values=True)
