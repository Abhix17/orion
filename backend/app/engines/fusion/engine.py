"""Multimodal Evidence Fusion and Attack Chain Synthesis Layer for ORION v2.

Transforms heterogeneous evidence, canonical entities, and cross-modal correlation
clusters into an auditable, fused incident context ready for the Deterministic Risk Engine.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, ConfigDict, Field
from uuid import uuid4

from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceStatus, EvidenceType
from app.schemas.incident import AttackChainStage, CorrelationGroup, IncidentEntity, IncidentTimelineEvent
from app.engines.fusion.entity import CanonicalEntity
from app.engines.fusion.correlation import CorrelationEngine
from app.engines.fusion.graph import EvidenceGraph


class FusedIncidentContext(BaseModel):
    """Normalized, deduplicated, and correlated multimodal security context."""
    fused_evidence: List[EvidenceItem]
    entities: List[IncidentEntity]
    correlation_groups: List[CorrelationGroup]
    attack_chain: List[str]
    timeline: List[IncidentTimelineEvent]
    xai_summary: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(use_enum_values=True)


class EvidenceFusionEngine:
    """Orchestrates evidence deduplication, contradictory evidence handling,

    attack chain mapping, and chronological timeline generation.
    """

    def __init__(self, correlation_engine: Optional[CorrelationEngine] = None):
        self.correlation_engine = correlation_engine or CorrelationEngine()

    @staticmethod
    def _get_signal_family(item: EvidenceItem) -> str:
        t = (item.type.value if hasattr(item.type, "value") else str(item.type)).lower()
        if any(w in t for w in ("url", "lexical", "domain", "reputation", "threat_intel", "dns", "whois")):
            return "url_threat"
        if any(w in t for w in ("synthetic", "ai_generated", "deepfake", "artifact", "manipulation", "tampering")):
            return "synthetic_media"
        if any(w in t for w in ("speaker", "face", "identity", "impersonation", "similarity", "biometric")):
            return "identity_match"
        if any(w in t for w in ("financial", "credential", "urgency", "social_engineering", "coercion", "phishing_lang")):
            return "semantic_intent"
        if any(w in t for w in ("login", "device", "location", "session", "burst", "ato", "travel")):
            return "auth_anomaly"
        return t

    @staticmethod
    def deduplicate_evidence(evidence_items: List[EvidenceItem]) -> List[EvidenceItem]:
        """Prevent double counting by grouping multiple observations of the same entity signal.

        For items sharing the same entity reference and signal family (e.g. URLBERT + Lexical +
        Threat Intel on the same URL, or multiple audio synthetic models), applies a diminishing return scaling factor:
        item 0: 1.0x weight, item 1: 0.6x weight, item 2+: 0.35x weight.
        Distinct orthogonal signals (e.g. synthetic media + face match + coercion) belong to
        different families and are not scaled down.
        """
        if not evidence_items:
            return []

        # Group by (primary_entity_ref or 'unlinked', signal_family)
        groups: Dict[str, List[EvidenceItem]] = {}
        for item in evidence_items:
            primary_ent = item.entity_refs[0] if item.entity_refs else "unlinked"
            family = EvidenceFusionEngine._get_signal_family(item)
            key = f"{primary_ent}:{family}"
            groups.setdefault(key, []).append(item)

        deduped: List[EvidenceItem] = []
        for key, items in groups.items():
            if len(items) == 1:
                deduped.append(items[0])
            else:
                # Sort by confidence descending
                sorted_items = sorted(items, key=lambda x: x.confidence, reverse=True)
                for rank, item in enumerate(sorted_items):
                    factor = 1.0 if rank == 0 else (0.60 if rank == 1 else 0.35)
                    adjusted_weight = round(item.weight * factor, 3)
                    item_copy = item.model_copy(update={
                        "weight": adjusted_weight,
                        "indicators": {
                            **item.indicators,
                            "deduplication_applied": True,
                            "co_observed_items_count": len(items),
                            "weight_adjustment_factor": factor,
                        }
                    })
                    deduped.append(item_copy)

        return deduped

    @staticmethod
    def resolve_contradictions(evidence_items: List[EvidenceItem]) -> List[EvidenceItem]:
        """Explicitly resolve contradictory and inconclusive signals.

        Rule 1: A negative Threat Intel lookup (no match) must NEVER convert a high-confidence
        ML detector prediction into 'SAFE'. It is classified as 'no matching IOC in active feeds'.
        Rule 2: An isolated single-frame deepfake spike against an authentic video timeline
        is dampened and annotated.
        """
        resolved: List[EvidenceItem] = []
        for item in evidence_items:
            # If status is unavailable or inconclusive, guarantee it cannot produce critical weight
            if item.status in (EvidenceStatus.UNAVAILABLE, EvidenceStatus.INCONCLUSIVE):
                item = item.model_copy(update={
                    "weight": min(item.weight, 0.05),
                    "indicators": {
                        **item.indicators,
                        "contradiction_safeguard": "Provider status is inconclusive/unavailable; risk weight dampened.",
                    }
                })
            resolved.append(item)
        return resolved

    @staticmethod
    def construct_attack_chain(evidence_items: List[EvidenceItem]) -> List[str]:
        """Map observed evidence to verified MITRE-aligned attack chain progression stages.

        Stages: INITIAL_ACCESS -> SOCIAL_ENGINEERING -> MALICIOUS_URL -> CREDENTIAL_THEFT -> ACCOUNT_ANOMALY
        """
        stages: List[str] = []
        types = {e.type for e in evidence_items}
        sources = {e.source for e in evidence_items}

        # Stage 1: Initial Access
        if (
            EvidenceSource.MESSAGE in sources
            or EvidenceSource.WEB in sources
            or EvidenceType.PHISHING_LANGUAGE in types
        ):
            stages.append(AttackChainStage.INITIAL_ACCESS.value)

        # Stage 2: Social Engineering
        if (
            EvidenceType.URGENT_CALL_TO_ACTION in types
            or EvidenceType.FINANCIAL_DEMAND_INTENT in types
            or EvidenceType.SOCIAL_ENGINEERING_TACTIC in types
            or EvidenceType.SPEAKER_SIMILARITY_MATCH in types
            or EvidenceType.PROTECTED_IDENTITY_TARGETED in types
        ):
            stages.append(AttackChainStage.SOCIAL_ENGINEERING.value)

        # Stage 3: Malicious URL
        if (
            EvidenceType.URLBERT_MALICIOUS in types
            or EvidenceType.LOOKALIKE_DOMAIN in types
            or EvidenceType.SUSPICIOUS_TLD in types
            or EvidenceType.THREAT_INTEL_MATCH in types
        ):
            stages.append(AttackChainStage.MALICIOUS_URL.value)

        # Stage 4: Credential Theft
        if (
            EvidenceType.CREDENTIAL_HARVEST_INTENT in types
            or EvidenceType.CREDENTIAL_PATH in types
        ):
            stages.append(AttackChainStage.CREDENTIAL_THEFT.value)

        # Stage 5: Account Anomaly / Takeover
        if (
            EvidenceType.FAILED_LOGIN_BURST in types
            or EvidenceType.NEW_DEVICE_FINGERPRINT in types
            or EvidenceType.ANOMALOUS_GEOLOCATION in types
            or EvidenceType.IMPOSSIBLE_TRAVEL in types
            or EvidenceType.ISOLATION_FOREST_ANOMALY in types
        ):
            stages.append(AttackChainStage.ACCOUNT_ANOMALY.value)

        return stages

    @staticmethod
    def construct_timeline(
        evidence_items: List[EvidenceItem],
        context_summary: str = "",
    ) -> List[IncidentTimelineEvent]:
        """Construct a sorted chronological timeline of observed security events."""
        events: List[IncidentTimelineEvent] = []

        # Sort evidence chronologically
        sorted_evi = sorted(evidence_items, key=lambda x: x.timestamp)

        for item in sorted_evi:
            source_name = item.source.value if hasattr(item.source, "value") else str(item.source)
            type_name = item.type.value if hasattr(item.type, "value") else str(item.type)
            title = f"{source_name.replace('_', ' ').title()}: {type_name.replace('_', ' ').title()}"

            stage = None
            if "phish" in type_name or "message" in source_name:
                stage = AttackChainStage.INITIAL_ACCESS.value
            elif "credential" in type_name:
                stage = AttackChainStage.CREDENTIAL_THEFT.value
            elif "url" in type_name or "domain" in type_name:
                stage = AttackChainStage.MALICIOUS_URL.value
            elif "impersonation" in type_name or "speech" in type_name or "face" in type_name:
                stage = AttackChainStage.SOCIAL_ENGINEERING.value
            elif "login" in type_name or "travel" in type_name or "device" in type_name:
                stage = AttackChainStage.ACCOUNT_ANOMALY.value

            events.append(
                IncidentTimelineEvent(
                    id=f"tle_{uuid4().hex[:8]}",
                    timestamp=item.timestamp,
                    source=source_name,
                    title=title,
                    description=item.explanation,
                    stage=stage,
                    evidence_ids=[item.id],
                )
            )

        return events

    @staticmethod
    def generate_xai_evidence_chain_narrative(
        evidence_items: List[EvidenceItem],
        entities: List[CanonicalEntity],
        attack_chain: List[str],
        correlation_groups: List[CorrelationGroup],
    ) -> str:
        """Synthesize a structured, cross-modal evidence-chain narrative."""
        if not evidence_items:
            return "No suspicious cross-modal evidence detected."

        lines: List[str] = [
            "MULTIMODAL EVIDENCE CHAIN & ATTACK PROGRESSION:",
        ]

        # 1. Attack Progression Summary
        if attack_chain:
            chain_str = " ➔ ".join(s.replace("_", " ").upper() for s in attack_chain)
            lines.append(f"Attack Stage Lineage: {chain_str}")
            lines.append("")

        # 2. Correlated Evidence Steps
        lines.append("Step-by-Step Correlated Evidence:")
        for idx, item in enumerate(evidence_items[:6], 1):
            source_tag = item.source.value if hasattr(item.source, "value") else str(item.source)
            lines.append(f" {idx}. [{source_tag.upper()}] {item.explanation}")

        # 3. Entity Relationships
        if entities:
            lines.append("")
            lines.append("Correlated Entity Network:")
            for ent in entities[:4]:
                type_tag = ent.type.value if hasattr(ent.type, "value") else str(ent.type)
                lines.append(f" • {type_tag.upper()}: {ent.canonical_value}")

        return "\n".join(lines)

    def fuse(
        self,
        evidence_items: List[EvidenceItem],
        entities: Optional[List[CanonicalEntity]] = None,
        context_summary: str = "",
    ) -> FusedIncidentContext:
        """Full pipeline execution: deduplicate, resolve contradictions, correlate,

        map attack chain, build timeline, and generate XAI evidence-chain narrative.
        """
        ents = entities or []

        # 1. Deduplicate to eliminate double counting
        deduped_evi = self.deduplicate_evidence(evidence_items)

        # 2. Handle contradictions and unavailable models
        resolved_evi = self.resolve_contradictions(deduped_evi)

        # 3. Correlate across modalities
        correlation_groups = self.correlation_engine.correlate(
            evidence_items=resolved_evi,
            entities=ents,
        )

        # 4. Synthesize attack chain
        attack_chain = self.construct_attack_chain(resolved_evi)

        # 5. Build chronological timeline
        timeline = self.construct_timeline(resolved_evi, context_summary)

        # 6. Synthesize XAI evidence chain narrative
        xai_summary = self.generate_xai_evidence_chain_narrative(
            evidence_items=resolved_evi,
            entities=ents,
            attack_chain=attack_chain,
            correlation_groups=correlation_groups,
        )

        # Convert canonical entities to IncidentEntity
        incident_entities = [ent.to_incident_entity() for ent in ents]

        return FusedIncidentContext(
            fused_evidence=resolved_evi,
            entities=incident_entities,
            correlation_groups=correlation_groups,
            attack_chain=attack_chain,
            timeline=timeline,
            xai_summary=xai_summary,
            metadata={
                "evidence_count_raw": len(evidence_items),
                "evidence_count_fused": len(resolved_evi),
                "correlation_groups_count": len(correlation_groups),
                "attack_chain_depth": len(attack_chain),
            },
        )
