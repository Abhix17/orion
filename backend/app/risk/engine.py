"""Interaction-Based Deterministic Risk Engine for ORION v2.

Computes fully traceable and auditable risk scores from normalized evidence items
combining base linear weights, non-linear interaction synergies, dampening factors,
and hard circuit-breaker floors.
"""

import os
from typing import Dict, List, Tuple
import yaml
from app.schemas.evidence import EvidenceItem, EvidenceStatus, EvidenceType, SeverityContribution
from app.schemas.threat import (
    InteractionContribution,
    RiskAssessment,
    RiskContribution,
    RiskLevel,
    ThreatAssessment,
    ThreatType,
)


class RiskEngine:
    """Evaluates evidence sets to compute deterministic risk scores and threat classifications."""

    POLICY_VERSION = "4.0"

    # Severity contribution baseline multipliers
    SEVERITY_MULTIPLIERS = {
        SeverityContribution.NONE: 0.0,
        SeverityContribution.LOW: 0.10,
        SeverityContribution.MEDIUM: 0.25,
        SeverityContribution.HIGH: 0.40,
        SeverityContribution.CRITICAL: 0.60,
    }

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), "risk_config.yaml")
        self.config = self._load_config(config_path)

    @staticmethod
    def _load_config(path: str) -> dict:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return yaml.safe_load(f) or {}
            except Exception:
                pass
        return {"policy_version": "4.0"}

    @staticmethod
    def _map_risk_level(score: float) -> RiskLevel:
        """Discretize continuous risk score into defined risk tiers.
        
        Boundary Specs:
          SAFE: score < 0.20
          LOW: 0.20 <= score < 0.40
          MEDIUM: 0.40 <= score < 0.70
          HIGH: 0.70 <= score < 0.85
          CRITICAL: score >= 0.85
        """
        if score < 0.20:
            return RiskLevel.SAFE
        elif score < 0.40:
            return RiskLevel.LOW
        elif score < 0.70:
            return RiskLevel.MEDIUM
        elif score < 0.85:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    @staticmethod
    def _determine_threat_type(evidence: List[EvidenceItem]) -> Tuple[ThreatType, List[ThreatType]]:
        """Determine primary and secondary threat classifications from evidence."""
        if not evidence:
            return ThreatType.BENIGN, []

        type_weights = {
            # Web
            EvidenceType.LOOKALIKE_DOMAIN: (ThreatType.PHISHING, 0.4),
            EvidenceType.CREDENTIAL_PATH: (ThreatType.CREDENTIAL_THEFT, 0.3),
            EvidenceType.URLBERT_MALICIOUS: (ThreatType.MALICIOUS_URL, 0.4),
            EvidenceType.THREAT_INTEL_MATCH: (ThreatType.MALICIOUS_URL, 0.5),
            
            # Message
            EvidenceType.PHISHING_LANGUAGE: (ThreatType.PHISHING, 0.4),
            EvidenceType.CREDENTIAL_HARVEST_INTENT: (ThreatType.CREDENTIAL_THEFT, 0.4),
            EvidenceType.FINANCIAL_DEMAND_INTENT: (ThreatType.IMPERSONATION, 0.35),
            
            # Audio / Deepfake
            EvidenceType.SYNTHETIC_SPEECH_DETECTED: (ThreatType.VOICE_CLONE, 0.45),
            EvidenceType.SPEAKER_SIMILARITY_MATCH: (ThreatType.IMPERSONATION, 0.4),
            EvidenceType.PROTECTED_IDENTITY_TARGETED: (ThreatType.IMPERSONATION, 0.4),
            EvidenceType.AI_GENERATED_MEDIA: (ThreatType.DEEPFAKE_IMAGE, 0.35),
            EvidenceType.FACE_TAMPERING_INDICATOR: (ThreatType.DEEPFAKE_IMAGE, 0.4),
            EvidenceType.TEMPORAL_VIDEO_FLICKER: (ThreatType.DEEPFAKE_VIDEO, 0.55),
            EvidenceType.DEEPFAKE_VIDEO: (ThreatType.DEEPFAKE_VIDEO, 0.55),
            EvidenceType.AUDIO_VISUAL_MISMATCH: (ThreatType.DEEPFAKE_VIDEO, 0.35),
            
            # Auth
            EvidenceType.FAILED_LOGIN_BURST: (ThreatType.AUTHENTICATION_ANOMALY, 0.35),
            EvidenceType.ISOLATION_FOREST_ANOMALY: (ThreatType.ACCOUNT_TAKEOVER, 0.45),
            EvidenceType.IMPOSSIBLE_TRAVEL: (ThreatType.ACCOUNT_TAKEOVER, 0.4),
            EvidenceType.ANOMALOUS_GEOLOCATION: (ThreatType.AUTHENTICATION_ANOMALY, 0.3),
            EvidenceType.NEW_DEVICE_FINGERPRINT: (ThreatType.AUTHENTICATION_ANOMALY, 0.25),
        }

        t_scores: dict[ThreatType, float] = {}
        for item in evidence:
            if item.type in type_weights:
                threat, w = type_weights[item.type]
                t_scores[threat] = t_scores.get(threat, 0.0) + (w * item.confidence)

        if not t_scores:
            return ThreatType.BENIGN, []

        sorted_threats = sorted(t_scores.items(), key=lambda x: x[1], reverse=True)
        primary = sorted_threats[0][0]
        secondary = [t[0] for t in sorted_threats[1:4]]
        return primary, secondary

    def evaluate(self, evidence: List[EvidenceItem]) -> RiskAssessment:
        """Run interaction-based deterministic risk assessment."""
        if not evidence:
            return RiskAssessment(
                score=0.0,
                level=RiskLevel.SAFE,
                confidence=1.0,
                assessment=ThreatAssessment.SAFE,
                primary_threat=ThreatType.BENIGN,
                secondary_threats=[],
                risk_drivers=["No suspicious indicators detected"],
                synergy_bonuses=0.0,
                dampening_reductions=0.0,
                mitre_techniques=[],
                base_score=0.0,
                contributions=[],
                interaction_contributions=[],
                policy_version=self.POLICY_VERSION,
            )

        # 1. Base Linear Sum & Contribution Breakdown
        base_score = 0.0
        active_types = set()
        evidence_driver_items = []
        contributions: List[RiskContribution] = []

        # Deduplication dampening check: track counts of each type to prevent duplicate escalation
        type_occurrences: Dict[EvidenceType, int] = {}

        for item in evidence:
            active_types.add(item.type)
            type_occurrences[item.type] = type_occurrences.get(item.type, 0) + 1
            count = type_occurrences[item.type]
            
            # Diminishing returns factor for duplicate evidence of same type
            duplicate_dampening = 1.0 if count == 1 else (0.5 ** (count - 1))

            # Status handling: UNAVAILABLE evidence yields 0 contribution; INCONCLUSIVE capped at 0.05
            if item.status == EvidenceStatus.UNAVAILABLE:
                contrib = 0.0
            elif item.status == EvidenceStatus.INCONCLUSIVE:
                sev_multiplier = self.SEVERITY_MULTIPLIERS.get(item.severity_contribution, 0.1)
                raw_contrib = item.weight * item.confidence * (1.0 + sev_multiplier) * duplicate_dampening
                contrib = min(0.05, raw_contrib)
            else:
                sev_multiplier = self.SEVERITY_MULTIPLIERS.get(item.severity_contribution, 0.1)
                contrib = item.weight * item.confidence * (1.0 + sev_multiplier) * duplicate_dampening

            contrib = round(contrib, 4)
            base_score += contrib

            reason = item.explanation or f"Evidence type {item.type.value if hasattr(item.type, 'value') else item.type}"
            contributions.append(
                RiskContribution(
                    evidence_id=item.id,
                    type=item.type.value if hasattr(item.type, "value") else str(item.type),
                    contribution=contrib,
                    reason=reason,
                )
            )
            evidence_driver_items.append((contrib, reason))

        base_score = round(base_score, 4)

        # 2. Non-linear Interaction Rules & Circuit Breakers
        synergy_bonus = 0.0
        dampening_reduction = 0.0
        circuit_breaker_floor = 0.0
        synergy_notes = []
        interaction_contributions: List[InteractionContribution] = []

        # Interaction Rule A: Voice Impersonation Synergy
        has_synthetic = EvidenceType.SYNTHETIC_SPEECH_DETECTED in active_types or (
            hasattr(EvidenceType, "SYNTHETIC_AUDIO_DETECTED") and EvidenceType.SYNTHETIC_AUDIO_DETECTED in active_types
        )
        has_speaker_match = EvidenceType.SPEAKER_SIMILARITY_MATCH in active_types
        has_financial = EvidenceType.FINANCIAL_DEMAND_INTENT in active_types
        has_protected_id = EvidenceType.PROTECTED_IDENTITY_TARGETED in active_types

        if has_synthetic and (has_speaker_match or has_protected_id) and has_financial:
            bonus = 0.25
            floor = 0.95
            reason = "Multiplicative synergy: Synthetic voice impersonating authorized identity with urgent financial demand."
            synergy_bonus += bonus
            circuit_breaker_floor = max(circuit_breaker_floor, floor)
            synergy_notes.append(reason)
            interaction_contributions.append(
                InteractionContribution(rule="VOICE_IMPERSONATION_CHAIN", contribution=bonus, reason=reason)
            )

        # Interaction Rule B: Lookalike Domain + Credential Harvesting Synergy
        has_lookalike = EvidenceType.LOOKALIKE_DOMAIN in active_types
        has_cred_path = EvidenceType.CREDENTIAL_PATH in active_types
        has_cred_intent = EvidenceType.CREDENTIAL_HARVEST_INTENT in active_types

        if has_lookalike and (has_cred_path or has_cred_intent):
            bonus = 0.20
            floor = 0.85
            reason = "Multiplicative synergy: Look-alike domain hosting active credential solicitation."
            synergy_bonus += bonus
            circuit_breaker_floor = max(circuit_breaker_floor, floor)
            synergy_notes.append(reason)
            interaction_contributions.append(
                InteractionContribution(rule="PHISHING_CHAIN", contribution=bonus, reason=reason)
            )

        # Interaction Rule C: Threat Intelligence Hard Circuit Breaker
        if EvidenceType.THREAT_INTEL_MATCH in active_types:
            floor = 0.90
            reason = "Circuit-breaker override: Active malicious IOC match in verified Threat Intelligence feeds."
            circuit_breaker_floor = max(circuit_breaker_floor, floor)
            synergy_notes.append(reason)
            interaction_contributions.append(
                InteractionContribution(rule="THREAT_INTEL_CIRCUIT_BREAKER", contribution=0.0, reason=reason)
            )

        # Interaction Rule D: ATO Anomaly Multi-Factor Synergy
        has_login_burst = EvidenceType.FAILED_LOGIN_BURST in active_types
        has_new_device = EvidenceType.NEW_DEVICE_FINGERPRINT in active_types
        has_geo_anomaly = EvidenceType.ANOMALOUS_GEOLOCATION in active_types
        has_iforest = EvidenceType.ISOLATION_FOREST_ANOMALY in active_types
        has_impossible_travel = EvidenceType.IMPOSSIBLE_TRAVEL in active_types

        if has_login_burst and (has_new_device or has_geo_anomaly or has_iforest or has_impossible_travel):
            bonus = 0.20
            floor = 0.85
            reason = "Multiplicative synergy: Failed authentication burst followed by anomalous device or geography."
            synergy_bonus += bonus
            circuit_breaker_floor = max(circuit_breaker_floor, floor)
            synergy_notes.append(reason)
            interaction_contributions.append(
                InteractionContribution(rule="ACCOUNT_TAKEOVER_CHAIN", contribution=bonus, reason=reason)
            )

        # Interaction Rule E: Impossible Travel Velocity Circuit Breaker
        if has_impossible_travel:
            floor = 0.88
            reason = "Circuit-breaker override: Physically impossible travel velocity detected between login locations."
            circuit_breaker_floor = max(circuit_breaker_floor, floor)
            synergy_notes.append(reason)
            interaction_contributions.append(
                InteractionContribution(rule="IMPOSSIBLE_TRAVEL_CIRCUIT_BREAKER", contribution=0.0, reason=reason)
            )

        # Interaction Rule F: Multimodal Video Impersonation Synergy
        has_video_deepfake = EvidenceType.DEEPFAKE_VIDEO in active_types
        has_temporal_flicker = EvidenceType.TEMPORAL_VIDEO_FLICKER in active_types
        has_av_mismatch = EvidenceType.AUDIO_VISUAL_MISMATCH in active_types

        if (has_video_deepfake or has_temporal_flicker) and (has_protected_id or has_speaker_match) and (has_financial or has_synthetic):
            bonus = 0.25
            floor = 0.95
            reason = "Multiplicative synergy: Synthetic video impersonating protected identity combined with synthetic audio or financial coercion."
            synergy_bonus += bonus
            circuit_breaker_floor = max(circuit_breaker_floor, floor)
            synergy_notes.append(reason)
            interaction_contributions.append(
                InteractionContribution(rule="MULTIMODAL_DEEPFAKE_COERCION", contribution=bonus, reason=reason)
            )
        elif (has_video_deepfake or has_temporal_flicker) and has_synthetic:
            bonus = 0.15
            floor = 0.85
            reason = "Multiplicative synergy: Concurrent visual deepfake indicators and synthetic audio generation."
            synergy_bonus += bonus
            circuit_breaker_floor = max(circuit_breaker_floor, floor)
            synergy_notes.append(reason)
            interaction_contributions.append(
                InteractionContribution(rule="MULTIMODAL_DEEPFAKE_AUDIOVISUAL", contribution=bonus, reason=reason)
            )
        elif has_av_mismatch and (has_protected_id or has_speaker_match):
            bonus = 0.10
            floor = 0.70
            reason = "Multiplicative synergy: Audio-visual desynchronization detected on targeted identity."
            synergy_bonus += bonus
            circuit_breaker_floor = max(circuit_breaker_floor, floor)
            synergy_notes.append(reason)
            interaction_contributions.append(
                InteractionContribution(rule="AUDIO_VISUAL_DESYNC", contribution=bonus, reason=reason)
            )

        # 3. Final Risk Score Computation & Strict Mathematical Boundary Clamping
        raw_score = base_score + synergy_bonus - dampening_reduction
        bounded_score = max(circuit_breaker_floor, raw_score)

        # Mathematical hard clamp [0.0, 1.0]
        final_score = min(1.0, max(0.0, bounded_score))
        final_score = round(final_score, 3)

        risk_level = self._map_risk_level(final_score)

        # 4. Operational Threat Assessment
        if risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            assessment = ThreatAssessment.MALICIOUS
        elif risk_level == RiskLevel.MEDIUM:
            assessment = ThreatAssessment.SUSPICIOUS
        else:
            assessment = ThreatAssessment.SAFE

        # 5. Compile Risk Drivers (Top 4 contributors)
        evidence_driver_items.sort(key=lambda x: x[0], reverse=True)
        top_drivers = [desc for _, desc in evidence_driver_items[:3]]
        top_drivers.extend(synergy_notes)

        # 6. Overall Confidence Calculation
        avg_confidence = sum(e.confidence for e in evidence) / len(evidence)
        confidence = round(avg_confidence, 2)

        # 7. Threat Classification
        primary_threat, secondary_threats = self._determine_threat_type(evidence)

        return RiskAssessment(
            score=final_score,
            level=risk_level,
            confidence=confidence,
            assessment=assessment,
            primary_threat=primary_threat,
            secondary_threats=secondary_threats,
            risk_drivers=top_drivers,
            synergy_bonuses=round(synergy_bonus, 2),
            dampening_reductions=round(dampening_reduction, 2),
            mitre_techniques=[],
            base_score=base_score,
            contributions=contributions,
            interaction_contributions=interaction_contributions,
            policy_version=self.POLICY_VERSION,
        )
