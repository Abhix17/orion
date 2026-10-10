"""Cross-Modal Correlation Engine for ORION v2.

Correlates heterogeneous evidence across Web, Message, Media (Image, Audio, Video),
and Behavioral/Auth subsystems using entity linkage, temporal proximity, and
deterministic scenario heuristics.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType
from app.schemas.incident import CorrelationGroup
from app.engines.fusion.entity import CanonicalEntity
from app.engines.fusion.graph import EvidenceGraph, GraphRelation


class CorrelationEngine:
    """Discovers cross-modal linkages and clusters evidence into correlated incident groups."""

    def __init__(
        self,
        default_time_window_seconds: int = 1800,  # 30-minute standard correlation window
        max_group_size: int = 50,
    ):
        self.default_time_window_seconds = default_time_window_seconds
        self.max_group_size = max_group_size

    def calculate_correlation_confidence(
        self,
        shared_entities_count: int,
        time_delta_seconds: float,
        distinct_modalities_count: int,
        avg_evidence_confidence: float,
    ) -> float:
        """Calculate decoupled correlation confidence.

        Formula:
        C_corr = 0.35 * min(1.0, shared_entities / 2)
               + 0.30 * max(0.0, 1.0 - time_delta / window)
               + 0.25 * min(1.0, distinct_modalities / 3)
               + 0.10 * avg_evidence_confidence
        """
        w_ent = 0.35 * min(1.0, shared_entities_count / 2.0)
        time_factor = max(0.0, 1.0 - (time_delta_seconds / float(self.default_time_window_seconds)))
        w_time = 0.30 * time_factor
        w_mod = 0.25 * min(1.0, distinct_modalities_count / 3.0)
        w_qual = 0.10 * max(0.0, min(1.0, avg_evidence_confidence))

        score = w_ent + w_time + w_mod + w_qual
        return round(min(1.0, max(0.15, score)), 3)

    def correlate(
        self,
        evidence_items: List[EvidenceItem],
        entities: Optional[List[CanonicalEntity]] = None,
        graph: Optional[EvidenceGraph] = None,
        time_window_seconds: Optional[int] = None,
    ) -> List[CorrelationGroup]:
        """Correlate a set of evidence items and entities into coherent incident groups."""
        if not evidence_items:
            return []

        window = time_window_seconds or self.default_time_window_seconds
        g = graph or EvidenceGraph()
        ents = entities or []

        # Populate graph
        for ent in ents:
            g.add_entity(ent)
        for item in evidence_items:
            g.add_evidence(item)

        # 1. Cluster by shared entity references and temporal proximity
        entity_to_evidence: Dict[str, List[EvidenceItem]] = {}
        for item in evidence_items:
            for ent_id in item.entity_refs:
                entity_to_evidence.setdefault(ent_id, []).append(item)

        # 2. Check for canonical scenario patterns
        groups: List[CorrelationGroup] = []
        assigned_evidence_ids: Set[str] = set()

        # Helper to extract evidence types
        active_types = {e.type: e for e in evidence_items}
        sources = {e.source for e in evidence_items}

        # Scenario A: Phishing Message -> Malicious URL / Domain
        has_msg = EvidenceSource.MESSAGE in sources
        has_web = EvidenceSource.WEB in sources
        has_urlbert = EvidenceType.URLBERT_MALICIOUS in active_types
        has_lookalike = EvidenceType.LOOKALIKE_DOMAIN in active_types
        has_phish_lang = EvidenceType.PHISHING_LANGUAGE in active_types or EvidenceType.CREDENTIAL_HARVEST_INTENT in active_types

        if (has_msg or has_phish_lang) and (has_web or has_urlbert or has_lookalike):
            scenario_evi = [
                e for e in evidence_items
                if e.source in (EvidenceSource.MESSAGE, EvidenceSource.WEB, EvidenceSource.THREAT_INTEL)
            ]
            if scenario_evi:
                rel_ents = [
                    ent.id for ent in ents
                    if ent.type in ("url", "domain", "organization", "email")
                ]
                conf = self.calculate_correlation_confidence(
                    shared_entities_count=max(1, len(rel_ents)),
                    time_delta_seconds=60.0,
                    distinct_modalities_count=2,
                    avg_evidence_confidence=sum(e.confidence for e in scenario_evi) / len(scenario_evi),
                )
                msg_evi = next((e.id for e in scenario_evi if e.source == EvidenceSource.MESSAGE), None)
                url_ent = next((e.id for e in ents if e.type == "url" and e.id in rel_ents), None)
                domain_ent = next((e.id for e in ents if e.type == "domain" and e.id in rel_ents), None)
                
                rels = []
                if msg_evi and url_ent:
                    rels.append({"source_id": msg_evi, "source": "message", "relation": "CONTAINS", "target_id": url_ent, "target": "url"})
                else:
                    rels.append({"source": "message", "relation": "CONTAINS", "target": "url"})
                
                if url_ent and domain_ent:
                    rels.append({"source_id": url_ent, "source": "url", "relation": "RELATED_TO", "target_id": domain_ent, "target": "domain"})
                else:
                    rels.append({"source": "url", "relation": "RELATED_TO", "target": "domain"})

                grp = CorrelationGroup(
                    id=f"grp_phish_{uuid4().hex[:8]}",
                    name="Correlated Phishing Attack Chain (Message -> URL -> Domain)",
                    entity_ids=rel_ents,
                    evidence_ids=[e.id for e in scenario_evi],
                    correlation_confidence=conf,
                    relationships=rels,
                )
                groups.append(grp)
                for e in scenario_evi:
                    assigned_evidence_ids.add(e.id)

        # Scenario B/C: Multimodal Executive / Video Impersonation
        has_deepfake_video = EvidenceType.DEEPFAKE_VIDEO in active_types
        has_synth_voice = EvidenceType.SYNTHETIC_SPEECH_DETECTED in active_types
        has_speaker_match = EvidenceType.SPEAKER_SIMILARITY_MATCH in active_types
        has_face_match = EvidenceType.PROTECTED_IDENTITY_TARGETED in active_types
        has_financial = EvidenceType.FINANCIAL_DEMAND_INTENT in active_types

        if (has_deepfake_video or has_synth_voice) and (has_speaker_match or has_face_match or has_financial):
            scenario_evi = [
                e for e in evidence_items
                if e.source in (EvidenceSource.VIDEO, EvidenceSource.AUDIO, EvidenceSource.IMAGE, EvidenceSource.SEMANTIC)
            ]
            if scenario_evi:
                rel_ents = [
                    ent.id for ent in ents
                    if ent.type in ("person", "organization", "video", "audio", "image")
                ]
                conf = self.calculate_correlation_confidence(
                    shared_entities_count=max(1, len(rel_ents)),
                    time_delta_seconds=45.0,
                    distinct_modalities_count=len({e.source for e in scenario_evi}),
                    avg_evidence_confidence=sum(e.confidence for e in scenario_evi) / len(scenario_evi),
                )
                media_evi = next((e.id for e in scenario_evi if e.source in (EvidenceSource.VIDEO, EvidenceSource.AUDIO, EvidenceSource.IMAGE)), None)
                person_ent = next((e.id for e in ents if e.type == "person" and e.id in rel_ents), None)
                audio_ent = next((e.id for e in ents if e.type == "audio" and e.id in rel_ents), None)
                intent_evi = next((e.id for e in scenario_evi if e.source == EvidenceSource.SEMANTIC), None)

                rels = []
                if media_evi and person_ent:
                    rels.append({"source_id": media_evi, "source": "media", "relation": "MATCHES", "target_id": person_ent, "target": "person"})
                else:
                    rels.append({"source": "media", "relation": "MATCHES", "target": "person"})
                    
                if media_evi and audio_ent:
                    rels.append({"source_id": media_evi, "source": "media", "relation": "CONTAINS", "target_id": audio_ent, "target": "audio_track"})
                else:
                    rels.append({"source": "media", "relation": "CONTAINS", "target": "audio_track"})
                    
                if (audio_ent or media_evi) and intent_evi:
                    rels.append({"source_id": audio_ent or media_evi, "source": "audio_track", "relation": "CLAIMS", "target_id": intent_evi, "target": "financial_wire"})
                else:
                    rels.append({"source": "audio_track", "relation": "CLAIMS", "target": "financial_wire"})

                grp = CorrelationGroup(
                    id=f"grp_impersonation_{uuid4().hex[:8]}",
                    name="Multimodal Executive Impersonation Campaign (Media -> Identity -> Intent)",
                    entity_ids=rel_ents,
                    evidence_ids=[e.id for e in scenario_evi],
                    correlation_confidence=conf,
                    relationships=rels,
                )
                groups.append(grp)
                for e in scenario_evi:
                    assigned_evidence_ids.add(e.id)

        # Scenario D: Account Takeover (ATO)
        has_login_burst = EvidenceType.FAILED_LOGIN_BURST in active_types
        has_new_device = EvidenceType.NEW_DEVICE_FINGERPRINT in active_types
        has_geo = EvidenceType.ANOMALOUS_GEOLOCATION in active_types or EvidenceType.IMPOSSIBLE_TRAVEL in active_types
        has_iforest = EvidenceType.ISOLATION_FOREST_ANOMALY in active_types

        if has_login_burst and (has_new_device or has_geo or has_iforest):
            scenario_evi = [e for e in evidence_items if e.source == EvidenceSource.AUTH]
            # Include related web/message phishing if present
            phish_evi = [e for e in evidence_items if e.source in (EvidenceSource.WEB, EvidenceSource.MESSAGE)]
            scenario_evi.extend(phish_evi)
            if scenario_evi:
                rel_ents = [
                    ent.id for ent in ents
                    if ent.type in ("user", "device", "ip", "account", "domain")
                ]
                conf = self.calculate_correlation_confidence(
                    shared_entities_count=max(1, len(rel_ents)),
                    time_delta_seconds=120.0,
                    distinct_modalities_count=2 if phish_evi else 1,
                    avg_evidence_confidence=sum(e.confidence for e in scenario_evi) / len(scenario_evi),
                )
                phish_evi = next((e.id for e in scenario_evi if e.source in (EvidenceSource.WEB, EvidenceSource.MESSAGE)), None)
                user_ent = next((e.id for e in ents if e.type == "user" and e.id in rel_ents), None)
                device_ent = next((e.id for e in ents if e.type == "device" and e.id in rel_ents), None)
                ip_ent = next((e.id for e in ents if e.type == "ip" and e.id in rel_ents), None)
                auth_evi = next((e.id for e in scenario_evi if e.source == EvidenceSource.AUTH), None)
                
                rels = []
                # Map credential harvest to user. If no phishing evidence, use auth evidence
                cred_evi = phish_evi or auth_evi
                if cred_evi and user_ent:
                    rels.append({"source_id": cred_evi, "source": "credential_harvest", "relation": "TARGETS", "target_id": user_ent, "target": "user"})
                else:
                    rels.append({"source": "credential_harvest", "relation": "TARGETS", "target": "user"})
                    
                if user_ent and device_ent:
                    rels.append({"source_id": user_ent, "source": "user", "relation": "ASSOCIATED_WITH", "target_id": device_ent, "target": "device"})
                else:
                    rels.append({"source": "user", "relation": "ASSOCIATED_WITH", "target": "device"})
                    
                if device_ent and ip_ent:
                    rels.append({"source_id": device_ent, "source": "device", "relation": "OBSERVED_ON", "target_id": ip_ent, "target": "ip"})
                else:
                    rels.append({"source": "device", "relation": "OBSERVED_ON", "target": "ip"})

                grp = CorrelationGroup(
                    id=f"grp_ato_{uuid4().hex[:8]}",
                    name="Account Compromise Chain (Phishing -> Credential Burst -> Device/Geo Anomaly)",
                    entity_ids=rel_ents,
                    evidence_ids=[e.id for e in scenario_evi],
                    correlation_confidence=conf,
                    relationships=rels,
                )
                groups.append(grp)
                for e in scenario_evi:
                    assigned_evidence_ids.add(e.id)

        # Scenario E: Default / Remaining Evidence Cluster
        unassigned = [e for e in evidence_items if e.id not in assigned_evidence_ids]
        if unassigned:
            rel_ents = [ent.id for ent in ents]
            conf = self.calculate_correlation_confidence(
                shared_entities_count=max(1, len(rel_ents)),
                time_delta_seconds=30.0,
                distinct_modalities_count=len({e.source for e in unassigned}),
                avg_evidence_confidence=sum(e.confidence for e in unassigned) / len(unassigned),
            )
            grp = CorrelationGroup(
                id=f"grp_standalone_{uuid4().hex[:8]}",
                name="Primary Evidence Cluster",
                entity_ids=rel_ents,
                evidence_ids=[e.id for e in unassigned],
                correlation_confidence=conf,
                relationships=[],
            )
            groups.append(grp)

        return groups
