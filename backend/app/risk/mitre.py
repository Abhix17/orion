"""MITRE ATT&CK Enterprise Enrichment Engine for ORION v2."""

from typing import List, Set
from app.schemas.evidence import EvidenceItem, EvidenceType
from app.schemas.threat import MitreTechnique, ThreatType


class MitreMapper:
    """Enriches threat assessments and incidents with standard MITRE ATT&CK techniques."""

    TECHNIQUES = {
        "T1566.002": MitreTechnique(
            id="T1566.002",
            name="Spearphishing Link",
            tactic="Initial Access",
            url="https://attack.mitre.org/techniques/T1566/002/",
        ),
        "T1566.004": MitreTechnique(
            id="T1566.004",
            name="Spearphishing Voice (Vishing)",
            tactic="Initial Access",
            url="https://attack.mitre.org/techniques/T1566/004/",
        ),
        "T1656": MitreTechnique(
            id="T1656",
            name="Impersonation",
            tactic="Defense Evasion",
            url="https://attack.mitre.org/techniques/T1656/",
        ),
        "T1583.001": MitreTechnique(
            id="T1583.001",
            name="Acquire Infrastructure: Domains",
            tactic="Resource Development",
            url="https://attack.mitre.org/techniques/T1583/001/",
        ),
        "T1110.003": MitreTechnique(
            id="T1110.003",
            name="Password Spraying",
            tactic="Credential Access",
            url="https://attack.mitre.org/techniques/T1110/003/",
        ),
        "T1078": MitreTechnique(
            id="T1078",
            name="Valid Accounts",
            tactic="Defense Evasion / Initial Access",
            url="https://attack.mitre.org/techniques/T1078/",
        ),
        "T1539": MitreTechnique(
            id="T1539",
            name="Steal Web Session Cookie",
            tactic="Credential Access",
            url="https://attack.mitre.org/techniques/T1539/",
        ),
    }

    @classmethod
    def enrich(cls, threat_type: ThreatType, evidence: List[EvidenceItem]) -> List[MitreTechnique]:
        """Map active evidence items and threat classification to applicable MITRE techniques."""
        matched: dict[str, list[str]] = {}  # tid -> list of evidence_ids
        reasons: dict[str, str] = {}

        # Phishing mappings
        phish_url_ev = [e.id for e in evidence if e.type in (EvidenceType.LOOKALIKE_DOMAIN, EvidenceType.URLBERT_MALICIOUS, EvidenceType.CREDENTIAL_PATH)]
        if phish_url_ev:
            matched.setdefault("T1566.002", []).extend(phish_url_ev)
            matched.setdefault("T1583.001", []).extend(phish_url_ev)
            reasons["T1566.002"] = "Observed malicious/lookalike URL indicators and credential soliciting paths."
            reasons["T1583.001"] = "Observed deceptive domain acquisition or typo-squatting characteristics."

        phish_msg_ev = [e.id for e in evidence if e.type in (EvidenceType.PHISHING_LANGUAGE, EvidenceType.CREDENTIAL_HARVEST_INTENT)]
        if phish_msg_ev:
            matched.setdefault("T1566.002", []).extend(phish_msg_ev)
            reasons["T1566.002"] = "Observed phishing communication language and credential harvesting intent."

        # Impersonation & Voice cloning mappings
        voice_ev = [e.id for e in evidence if e.type == EvidenceType.SYNTHETIC_SPEECH_DETECTED]
        if voice_ev or threat_type in (ThreatType.VOICE_CLONE, ThreatType.SYNTHETIC_AUDIO):
            matched.setdefault("T1566.004", []).extend(voice_ev)
            matched.setdefault("T1656", []).extend(voice_ev)
            reasons["T1566.004"] = "Observed synthetic speech or automated voice spoofing generation."
            reasons["T1656"] = "Observed spoofed identity artifacts impersonating known or protected persona."

        id_ev = [e.id for e in evidence if e.type in (
            EvidenceType.PROTECTED_IDENTITY_TARGETED,
            EvidenceType.SPEAKER_SIMILARITY_MATCH,
            EvidenceType.DEEPFAKE_VIDEO,
            EvidenceType.TEMPORAL_VIDEO_FLICKER,
        )]
        if id_ev or threat_type in (ThreatType.IMPERSONATION, ThreatType.DEEPFAKE_VIDEO):
            matched.setdefault("T1656", []).extend(id_ev)
            reasons["T1656"] = "Observed high biometric similarity or facial/voice manipulation targeting identity."

        # Account Takeover & Auth anomaly mappings
        burst_ev = [e.id for e in evidence if e.type == EvidenceType.FAILED_LOGIN_BURST]
        if burst_ev:
            matched.setdefault("T1110.003", []).extend(burst_ev)
            reasons["T1110.003"] = "Observed rapid sequence of failed login attempts characteristic of password spraying."

        ato_ev = [e.id for e in evidence if e.type in (EvidenceType.ISOLATION_FOREST_ANOMALY, EvidenceType.IMPOSSIBLE_TRAVEL)]
        if ato_ev or threat_type == ThreatType.ACCOUNT_TAKEOVER:
            matched.setdefault("T1078", []).extend(ato_ev)
            reasons["T1078"] = "Observed anomalous access characteristics (impossible travel velocity or behavioral anomaly) on valid account."

        results: List[MitreTechnique] = []
        for tid, ev_ids in matched.items():
            if tid in cls.TECHNIQUES:
                base = cls.TECHNIQUES[tid]
                results.append(
                    MitreTechnique(
                        id=base.id,
                        name=base.name,
                        tactic=base.tactic,
                        url=base.url,
                        reason=reasons.get(tid, f"Triggered by threat classification {threat_type}"),
                        supporting_evidence_ids=list(dict.fromkeys(ev_ids)),
                    )
                )

        return results
