"""Advisory Response Playbook Generator for ORION v2."""

from typing import List, Optional
from app.schemas.evidence import EvidenceItem, EvidenceType
from app.schemas.response import ActionCategory, ActionPriority, ActionRecommendation
from app.schemas.threat import RiskLevel, ThreatType


class ResponsePlaybookGenerator:
    """Generates context-aware, advisory mitigation actions for detected threats."""

    @staticmethod
    def generate(
        threat_type: ThreatType,
        risk_level: RiskLevel,
        evidence: List[EvidenceItem],
        target_entity: Optional[str] = None,
    ) -> List[ActionRecommendation]:
        """Produce advisory response recommendations based on threat type and active evidence."""
        actions: List[ActionRecommendation] = []
        active_evidence_ids = [e.id for e in evidence]
        active_types = {e.type for e in evidence}

        # Safe baseline
        if risk_level == RiskLevel.SAFE:
            actions.append(
                ActionRecommendation(
                    title="No Action Required",
                    description="The entity or signal shows no indicators of compromise or malicious manipulation.",
                    category=ActionCategory.VERIFICATION,
                    priority=ActionPriority.P3_ADVISORY,
                    target_entity=target_entity,
                    mode="ADVISORY",
                    reason="Signal evaluated as safe by deterministic risk engine.",
                    supporting_evidence_ids=active_evidence_ids,
                )
            )
            return actions

        # 1. Phishing & Malicious URL Playbooks
        if threat_type in (ThreatType.PHISHING, ThreatType.MALICIOUS_URL, ThreatType.CREDENTIAL_THEFT):
            if risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
                actions.append(
                    ActionRecommendation(
                        title="Block Malicious URL at DNS / Web Gateway",
                        description="Immediately blacklist the malicious domain/URL across enterprise perimeter filters and endpoint proxies.",
                        category=ActionCategory.BLOCK,
                        priority=ActionPriority.P0_IMMEDIATE,
                        target_entity=target_entity,
                        mode="ADVISORY",
                        reason="High malicious URL probability correlated with credential harvesting intent.",
                        supporting_evidence_ids=active_evidence_ids,
                    )
                )
                actions.append(
                    ActionRecommendation(
                        title="Display Browser Shield Warning",
                        description="Intercept navigation and alert the user to an active credential harvesting and domain spoofing threat.",
                        category=ActionCategory.WARN,
                        priority=ActionPriority.P0_IMMEDIATE,
                        target_entity=target_entity,
                        mode="ADVISORY",
                        reason="Active lookalike domain or credential solicitation detected.",
                        supporting_evidence_ids=active_evidence_ids,
                    )
                )
            else:
                actions.append(
                    ActionRecommendation(
                        title="Warn User of Suspicious Link",
                        description="Advise the recipient to avoid entering credentials or downloading attachments from unverified senders.",
                        category=ActionCategory.WARN,
                        priority=ActionPriority.P2_MEDIUM,
                        target_entity=target_entity,
                        mode="ADVISORY",
                        reason="Suspicious lexical or language patterns detected in message or URL.",
                        supporting_evidence_ids=active_evidence_ids,
                    )
                )

        # 2. Impersonation, Voice Cloning & Deepfake Playbooks
        if threat_type in (ThreatType.IMPERSONATION, ThreatType.VOICE_CLONE, ThreatType.SYNTHETIC_AUDIO, ThreatType.DEEPFAKE_IMAGE, ThreatType.DEEPFAKE_VIDEO):
            actions.append(
                ActionRecommendation(
                    title="Verify Identity Through Out-of-Band Channel",
                    description="Do not execute requested financial transactions, wire transfers, or credential submissions until verified via a known trusted channel.",
                    category=ActionCategory.VERIFICATION,
                    priority=ActionPriority.P0_IMMEDIATE,
                    target_entity=target_entity,
                    mode="ADVISORY",
                    reason="Synthetic media or speaker mismatch detected targeting protected corporate identity.",
                    supporting_evidence_ids=active_evidence_ids,
                )
            )
            actions.append(
                ActionRecommendation(
                    title="Flag Media for Forensic Verification",
                    description="Preserve original raw audio/video and file container for deeper timeline and spectral analysis.",
                    category=ActionCategory.INVESTIGATION,
                    priority=ActionPriority.P1_HIGH,
                    target_entity=target_entity,
                    mode="ADVISORY",
                    reason="High synthetic speech probability or visual deepfake indicators present.",
                    supporting_evidence_ids=active_evidence_ids,
                )
            )
            actions.append(
                ActionRecommendation(
                    title="Report Executive Impersonation to SOC",
                    description="Notify the cybersecurity incident response team of targeted digital impersonation activity.",
                    category=ActionCategory.NOTIFICATION,
                    priority=ActionPriority.P1_HIGH,
                    target_entity=target_entity,
                    mode="ADVISORY",
                    reason="Targeted executive impersonation attempt detected.",
                    supporting_evidence_ids=active_evidence_ids,
                )
            )

        # 3. Account Takeover (ATO) & Authentication Anomaly Playbooks
        if threat_type in (ThreatType.ACCOUNT_TAKEOVER, ThreatType.AUTHENTICATION_ANOMALY):
            if risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
                actions.append(
                    ActionRecommendation(
                        title="Revoke Active User Sessions",
                        description="Immediately terminate all active web and API tokens associated with the compromised identity.",
                        category=ActionCategory.SESSION,
                        priority=ActionPriority.P0_IMMEDIATE,
                        target_entity=target_entity,
                        mode="ADVISORY",
                        reason="Multi-factor authentication anomaly and impossible travel correlated with account takeover attempt.",
                        supporting_evidence_ids=active_evidence_ids,
                    )
                )
                actions.append(
                    ActionRecommendation(
                        title="Require Step-Up Multi-Factor Authentication",
                        description="Force a biometric or hardware token MFA challenge before allowing further access.",
                        category=ActionCategory.AUTHENTICATION,
                        priority=ActionPriority.P0_IMMEDIATE,
                        target_entity=target_entity,
                        mode="ADVISORY",
                        reason="New-device authentication anomaly correlated with login burst or impossible travel.",
                        supporting_evidence_ids=active_evidence_ids,
                    )
                )
            else:
                actions.append(
                    ActionRecommendation(
                        title="Notify User of Unusual Sign-In",
                        description="Send an automated security alert to the user's registered recovery email or device.",
                        category=ActionCategory.NOTIFICATION,
                        priority=ActionPriority.P2_MEDIUM,
                        target_entity=target_entity,
                        mode="ADVISORY",
                        reason="Unusual login location or device fingerprint observed.",
                        supporting_evidence_ids=active_evidence_ids,
                    )
                )

        # 4. Universal Threat Intelligence Action
        if EvidenceType.THREAT_INTEL_MATCH in active_types:
            actions.append(
                ActionRecommendation(
                    title="Correlate Across Enterprise SIEM",
                    description="Query firewall and proxy logs for any other internal hosts that communicated with this confirmed threat indicator.",
                    category=ActionCategory.INVESTIGATION,
                    priority=ActionPriority.P1_HIGH,
                    target_entity=target_entity,
                    mode="ADVISORY",
                    reason="Confirmed malicious indicator match in threat intelligence feeds.",
                    supporting_evidence_ids=active_evidence_ids,
                )
            )

        return actions
