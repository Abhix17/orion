"""Evidence-Grounded XAI Generator for ORION v2."""

from typing import Any, List, Optional
from app.schemas.evidence import EvidenceItem, EvidenceStatus
from app.schemas.threat import RiskAssessment, RiskLevel, ThreatAssessment, ThreatType


class ExplainabilityGenerator:
    """Generates fully traceable, evidence-grounded human explanations for incidents."""

    @staticmethod
    def generate(
        assessment: RiskAssessment,
        evidence: List[EvidenceItem],
        input_summary: str = "",
        attack_chain: Optional[List[str]] = None,
        entities: Optional[List[Any]] = None,
    ) -> str:
        """Synthesize a structured, evidence-grounded cross-modal explanation."""
        level_str = assessment.level.value if hasattr(assessment.level, "value") else str(assessment.level)
        threat_str = (
            assessment.primary_threat.value
            if hasattr(assessment.primary_threat, "value")
            else str(assessment.primary_threat)
        )

        has_synthetic_image = any(
            (getattr(e.type, "value", str(e.type)) in ("ai_generated_media", "deepfake_image"))
            for e in (evidence or [])
        )
        has_synthetic_audio = any(
            (getattr(e.type, "value", str(e.type)) in ("synthetic_speech_detected", "synthetic_audio_detected"))
            for e in (evidence or [])
        )

        if not evidence or level_str == "SAFE":
            if has_synthetic_image:
                synth_item = next(
                    (e for e in evidence if getattr(e.type, "value", str(e.type)) in ("ai_generated_media", "deepfake_image")),
                    None
                )
                prob_str = f" ({synth_item.confidence:.0%} AI confidence)" if synth_item and synth_item.confidence else ""
                return (
                    f"SAFE (AI-GENERATED CONTENT) — Analysis identified visual AI generation{prob_str}, "
                    "but found no malicious scam patterns, executive impersonation, or phishing threats."
                )
            elif has_synthetic_audio:
                synth_item = next(
                    (e for e in evidence if getattr(e.type, "value", str(e.type)) in ("synthetic_speech_detected", "synthetic_audio_detected")),
                    None
                )
                prob_str = f" ({synth_item.confidence:.0%} AI confidence)" if synth_item and synth_item.confidence else ""
                return (
                    f"SAFE (AI-GENERATED CONTENT) — Analysis identified synthetic voice generation{prob_str}, "
                    "but found no malicious scam patterns, identity impersonation, or financial coercion."
                )
            return (
                "SAFE — Analysis found no significant malicious patterns, deceptive domain characteristics, "
                "synthetic artifacts, or abnormal authentication indicators."
            )

        formatted_threat = threat_str.replace("_", " ").title()
        lines: List[str] = [
            f"Assessment: {level_str} RISK — Suspected {formatted_threat}.",
            f"Target/Signal: {input_summary}" if input_summary else "",
            "",
            "WHY ORION FLAGGED THIS INCIDENT:",
        ]

        # 1. Numbered step-by-step evidence observations with Evidence ID traceability
        sorted_evi = sorted(evidence, key=lambda e: (e.weight * e.confidence), reverse=True)
        for idx, item in enumerate(sorted_evi[:6], 1):
            source_val = item.source.value if hasattr(item.source, "value") else str(item.source)
            lines.append(f" {idx}. [{source_val.upper()}] {item.explanation} (Evidence ID: {item.id})")

        # 2. Attack Chain Lineage if available
        if attack_chain:
            chain_str = " ➔ ".join(s.replace("_", " ").upper() for s in attack_chain)
            lines.append("")
            lines.append(f"Attack Stage Lineage: {chain_str}")

        # 3. Structured Risk Breakdown
        lines.append("")
        lines.append("RISK BREAKDOWN:")
        lines.append(f"Base evidence score: {getattr(assessment, 'base_score', assessment.score)}")

        if getattr(assessment, "contributions", None):
            for c in assessment.contributions[:4]:
                lines.append(f"  • {c.type}: +{c.contribution:.2f} ({c.reason}) [ID: {c.evidence_id}]")

        if assessment.synergy_bonuses > 0 or getattr(assessment, "interaction_contributions", None):
            lines.append(f"Interaction synergy bonus: +{assessment.synergy_bonuses:.2f}")
            if getattr(assessment, "interaction_contributions", None):
                for ic in assessment.interaction_contributions:
                    lines.append(f"  • {ic.rule}: +{ic.contribution:.2f} ({ic.reason})")

        if assessment.dampening_reductions > 0:
            lines.append(f"Dampening reduction: -{assessment.dampening_reductions:.2f}")

        lines.append(f"Final Score: {assessment.score} ({level_str}) [Policy Version: {getattr(assessment, 'policy_version', '4.0')}]")

        # 4. Contradictory or Inconclusive Evidence Section
        inconclusive_items = [e for e in evidence if e.status in (EvidenceStatus.INCONCLUSIVE, EvidenceStatus.UNAVAILABLE)]
        has_no_threat_intel = not any(e.type == "THREAT_INTEL_MATCH" or (hasattr(e.type, "value") and e.type.value == "THREAT_INTEL_MATCH") for e in evidence)

        if inconclusive_items or has_no_threat_intel:
            lines.append("")
            lines.append("CONTRADICTORY OR INCONCLUSIVE EVIDENCE:")
            if has_no_threat_intel:
                lines.append("• Threat-intelligence lookup returned no matching IOC. This does not establish that the URL/payload is safe.")
            for inc in inconclusive_items:
                status_str = inc.status.value if hasattr(inc.status, "value") else str(inc.status)
                lines.append(f"• Evidence ID {inc.id} status is {status_str}: {inc.explanation}")

        # 5. What Would Change The Assessment
        lines.append("")
        lines.append("WHAT WOULD CHANGE THE ASSESSMENT:")
        lines.append("• Threat intelligence IOC confirmation from independent feeds.")
        lines.append("• Verified out-of-band identity confirmation from authorized corporate contact.")
        lines.append("• Step-up multi-factor authentication (MFA) or session token re-validation.")

        # 6. Determinism Guarantee
        lines.append("")
        lines.append(
            f"Determinism Guarantee: Risk score ({assessment.score}) computed exclusively by ORION's deterministic "
            f"interaction engine (v{getattr(assessment, 'policy_version', '4.0')}) from verified evidence items, not subjective heuristic speculation."
        )

        return "\n".join(line for line in lines if line)
