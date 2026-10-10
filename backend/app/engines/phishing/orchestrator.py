"""Web and Phishing Intelligence Orchestrator for ORION v2."""

import re
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from app.engines.phishing.url_classifier import URLClassifierEngine
from app.engines.phishing.text_classifier import DistilBertPhishingClassifier
from app.providers.semantic_gateway import SemanticProviderGateway
from app.providers.threat_intel import ThreatIntelProvider
from app.risk.engine import RiskEngine
from app.risk.mitre import MitreMapper
from app.explainability.generator import ExplainabilityGenerator
from app.response.playbooks import ResponsePlaybookGenerator
from app.repositories.incident_repo import IncidentRepository
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution
from app.schemas.incident import Incident, IncidentEntity, IncidentStatus, EntityType
from app.schemas.threat import RiskLevel, ThreatAssessment, ThreatType
from app.engines.fusion.entity import CanonicalEntity, EntityResolver
from app.engines.fusion.engine import EvidenceFusionEngine


class WebIntelligenceOrchestrator:
    """Orchestrates URL, text, and browser page threat intelligence."""

    def __init__(self):
        self.url_engine = URLClassifierEngine()
        self.text_engine = DistilBertPhishingClassifier()
        self.semantic_gateway = SemanticProviderGateway()
        self.threat_intel = ThreatIntelProvider()
        self.risk_engine = RiskEngine()
        self.incident_repo = IncidentRepository()
        self.fusion_engine = EvidenceFusionEngine()

    async def analyze_url(self, raw_url: Optional[str] = None, context: Optional[str] = None, url: Optional[str] = None) -> Incident:
        """Complete pipeline: URL -> Features -> URLBERT -> Threat Intel -> Semantic -> Risk -> Incident."""
        target_url = url if url is not None else (raw_url or "")
        start_time = time.perf_counter()
        evidence_list: List[EvidenceItem] = []
        entities: List[IncidentEntity] = []

        # 1. URL Analysis
        prob, features, url_evidence = self.url_engine.analyze_url(target_url)
        evidence_list.extend(url_evidence)

        hostname = features["hostname"]
        url_ent, dom_ent = EntityResolver.resolve_url(target_url)
        canon_entities = [url_ent, dom_ent]

        if features["targeted_brand"]:
            canon_entities.append(EntityResolver.resolve_organization(features["targeted_brand"]))

        # 2. Threat Intelligence Lookup
        ti_evidence = await self.threat_intel.generate_evidence(hostname, "domain")
        if ti_evidence:
            evidence_list.append(ti_evidence)

        # Also check exact URL if different from host
        ti_url_evi = await self.threat_intel.generate_evidence(target_url, "url")
        if ti_url_evi:
            evidence_list.append(ti_url_evi)

        # 3. Optional context semantic extraction
        if context:
            _, sem_evidence = await self.semantic_gateway.analyze(context)
            evidence_list.extend(sem_evidence)

        for item in evidence_list:
            if not item.entity_refs:
                item.entity_refs = [url_ent.id, dom_ent.id]

        # 4. Multimodal Fusion & Deduplication
        fused_ctx = self.fusion_engine.fuse(evidence_list, canon_entities, context_summary=target_url)

        # 5. Deterministic Risk Evaluation & Evidence Fusion
        assessment = self.risk_engine.evaluate(fused_ctx.fused_evidence)

        # 6. MITRE ATT&CK Enrichment
        assessment.mitre_techniques = MitreMapper.enrich(assessment.primary_threat, fused_ctx.fused_evidence)

        # 7. Explainability & Playbooks
        explanation = ExplainabilityGenerator.generate(
            assessment, fused_ctx.fused_evidence, target_url, attack_chain=fused_ctx.attack_chain
        )
        actions = ResponsePlaybookGenerator.generate(
            assessment.primary_threat,
            assessment.level,
            fused_ctx.fused_evidence,
            target_entity=hostname
        )

        # 8. Construct Canonical Incident
        title = f"Phishing / Malicious URL Target: {hostname}" if assessment.level != RiskLevel.SAFE else f"Inspected URL: {hostname}"
        incident = Incident(
            title=title,
            source=EvidenceSource.WEB,
            input_type="url",
            input_summary=target_url,
            threat_type=assessment.primary_threat,
            assessment=assessment.assessment,
            risk_level=assessment.level,
            risk_score=assessment.score,
            confidence=assessment.confidence,
            evidence=fused_ctx.fused_evidence,
            explanation=explanation,
            xai_summary=fused_ctx.xai_summary,
            risk_drivers=assessment.risk_drivers,
            mitre_techniques=assessment.mitre_techniques,
            recommended_actions=actions,
            entities=fused_ctx.entities,
            timeline=fused_ctx.timeline,
            correlation_groups=[g.model_dump() for g in fused_ctx.correlation_groups],
            attack_chain=fused_ctx.attack_chain,
            status=IncidentStatus.NEW,
            metadata={"features": features, "raw_probability": prob}
        )

        # 8. Persist Incident & Log Audit Event
        persisted = await self.incident_repo.create(incident)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        await self.incident_repo.log_event(
            input_type="url",
            source="web_intelligence",
            risk_score=assessment.score,
            risk_level=assessment.level.value if hasattr(assessment.level, "value") else str(assessment.level),
            duration_ms=duration_ms,
            incident_id=persisted.id,
            provider_status={"urlbert": "ok" if self.url_engine.is_transformer_active else "heuristic_fallback", "threat_intel": "ok"}
        )

        return persisted

    async def analyze_message(self, text: str) -> Incident:
        """Analyze email, SMS, or social message text and any embedded URLs."""
        start_time = time.perf_counter()
        evidence_list: List[EvidenceItem] = []

        # 1. DistilBERT text classification
        text_prob, text_evidence = await self.text_engine.analyze_async(text)
        evidence_list.extend(text_evidence)

        # 2. Semantic Observer structured extraction
        obs, sem_evidence = await self.semantic_gateway.analyze(text)
        evidence_list.extend(sem_evidence)

        # Canonical entity resolution
        canon_entities = EntityResolver.extract_from_message(text)
        if obs.claimed_entity:
            canon_entities.append(EntityResolver.resolve_organization(obs.claimed_entity))

        # 3. Detect embedded URLs
        found_urls = re.findall(r"https?://[^\s\"'>]+", text)
        for u in found_urls[:2]:  # inspect top 2 embedded URLs
            _, u_features, u_evidence = self.url_engine.analyze_url(u)
            evidence_list.extend(u_evidence)
            
            # Threat intel check on URL hostname
            ti_evi = await self.threat_intel.generate_evidence(u_features["hostname"], "domain")
            if ti_evi:
                evidence_list.append(ti_evi)

        # Link entity references to evidence
        for item in evidence_list:
            if not item.entity_refs and canon_entities:
                item.entity_refs = [e.id for e in canon_entities[:2]]

        # 4. Multimodal Fusion & Deduplication
        snippet = text[:80] + ("..." if len(text) > 80 else "")
        fused_ctx = self.fusion_engine.fuse(evidence_list, canon_entities, context_summary=snippet)

        # 5. Risk Evaluation
        assessment = self.risk_engine.evaluate(fused_ctx.fused_evidence)

        # 6. MITRE ATT&CK Enrichment
        assessment.mitre_techniques = MitreMapper.enrich(assessment.primary_threat, fused_ctx.fused_evidence)

        # 7. XAI & Playbooks
        explanation = ExplainabilityGenerator.generate(
            assessment, fused_ctx.fused_evidence, snippet, attack_chain=fused_ctx.attack_chain
        )
        actions = ResponsePlaybookGenerator.generate(
            assessment.primary_threat,
            assessment.level,
            fused_ctx.fused_evidence,
            target_entity=obs.claimed_entity or (found_urls[0] if found_urls else "Message")
        )

        # 8. Construct Incident
        target_name = obs.claimed_entity or "Target"
        title = f"Phishing / Social Engineering Attempt ({target_name})" if assessment.level != RiskLevel.SAFE else "Analyzed Safe Communication"
        incident = Incident(
            title=title,
            source=EvidenceSource.MESSAGE,
            input_type="text",
            input_summary=snippet,
            threat_type=assessment.primary_threat,
            assessment=assessment.assessment,
            risk_level=assessment.level,
            risk_score=assessment.score,
            confidence=assessment.confidence,
            evidence=fused_ctx.fused_evidence,
            explanation=explanation,
            xai_summary=fused_ctx.xai_summary,
            risk_drivers=assessment.risk_drivers,
            mitre_techniques=assessment.mitre_techniques,
            recommended_actions=actions,
            entities=fused_ctx.entities,
            timeline=fused_ctx.timeline,
            correlation_groups=[g.model_dump() for g in fused_ctx.correlation_groups],
            attack_chain=fused_ctx.attack_chain,
            status=IncidentStatus.NEW,
            metadata={"semantic_observation": obs.model_dump(mode="json"), "text_prob": text_prob}
        )

        # 9. Persist
        persisted = await self.incident_repo.create(incident)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        await self.incident_repo.log_event(
            input_type="text",
            source="message_intelligence",
            risk_score=assessment.score,
            risk_level=assessment.level.value if hasattr(assessment.level, "value") else str(assessment.level),
            duration_ms=duration_ms,
            incident_id=persisted.id,
            provider_status={"distilbert": "ok", "semantic_gateway": obs.provider_used}
        )

        return persisted

    async def analyze_browser_page(
        self,
        url: str,
        title: Optional[str] = None,
        has_password_field: bool = False,
        form_actions: Optional[List[str]] = None,
        claimed_brand: Optional[str] = None,
    ) -> Incident:
        """Handle real-time signals emitted by the Browser Shield extension."""
        start_time = time.perf_counter()
        evidence_list: List[EvidenceItem] = []

        # 1. Base URL Analysis
        prob, features, url_evidence = self.url_engine.analyze_url(url)
        evidence_list.extend(url_evidence)

        hostname = features["hostname"]
        url_ent, dom_ent = EntityResolver.resolve_url(url)
        canon_entities = [url_ent, dom_ent]

        # 2. Threat Intel
        ti_evi = await self.threat_intel.generate_evidence(hostname, "domain")
        if ti_evi:
            evidence_list.append(ti_evi)

        # 3. DOM Security Signals
        if has_password_field:
            evidence_list.append(
                EvidenceItem(
                    type=EvidenceType.CREDENTIAL_HARVEST_INTENT,
                    source=EvidenceSource.WEB,
                    value=True,
                    confidence=0.90,
                    severity_contribution=SeverityContribution.HIGH,
                    weight=0.25,
                    entity_refs=[url_ent.id, dom_ent.id],
                    indicators={"has_password_field": True},
                    explanation="Page contains active password input fields requesting user credentials."
                )
            )

        if claimed_brand:
            org_ent = EntityResolver.resolve_organization(claimed_brand)
            canon_entities.append(org_ent)
            if features["brand_similarity_score"] > 0.65 or claimed_brand.lower() in (title or "").lower():
                evidence_list.append(
                    EvidenceItem(
                        type=EvidenceType.PROTECTED_IDENTITY_TARGETED,
                        source=EvidenceSource.WEB,
                        value=claimed_brand,
                        confidence=0.92,
                        severity_contribution=SeverityContribution.HIGH,
                        weight=0.25,
                        entity_refs=[url_ent.id, dom_ent.id, org_ent.id],
                        indicators={"claimed_brand": claimed_brand},
                        explanation=f"Webpage explicitly brands itself as '{claimed_brand}' while hosted on unrelated domain '{hostname}'."
                    )
                )

        for item in evidence_list:
            if not item.entity_refs:
                item.entity_refs = [url_ent.id, dom_ent.id]

        # 4. Multimodal Fusion & Deduplication
        summary = f"{title or hostname} ({url})"
        fused_ctx = self.fusion_engine.fuse(evidence_list, canon_entities, context_summary=summary)

        # 5. Risk Evaluation
        assessment = self.risk_engine.evaluate(fused_ctx.fused_evidence)

        # 6. MITRE ATT&CK
        assessment.mitre_techniques = MitreMapper.enrich(assessment.primary_threat, fused_ctx.fused_evidence)

        # 7. XAI & Playbooks
        explanation = ExplainabilityGenerator.generate(
            assessment, fused_ctx.fused_evidence, summary, attack_chain=fused_ctx.attack_chain
        )
        actions = ResponsePlaybookGenerator.generate(
            assessment.primary_threat,
            assessment.level,
            fused_ctx.fused_evidence,
            target_entity=hostname
        )

        # 8. Construct Incident
        incident = Incident(
            title=f"Browser Shield Alert: {hostname}" if assessment.level != RiskLevel.SAFE else f"Browser Inspected: {hostname}",
            source=EvidenceSource.WEB,
            input_type="browser",
            input_summary=summary,
            threat_type=assessment.primary_threat,
            assessment=assessment.assessment,
            risk_level=assessment.level,
            risk_score=assessment.score,
            confidence=assessment.confidence,
            evidence=fused_ctx.fused_evidence,
            explanation=explanation,
            xai_summary=fused_ctx.xai_summary,
            risk_drivers=assessment.risk_drivers,
            mitre_techniques=assessment.mitre_techniques,
            recommended_actions=actions,
            entities=fused_ctx.entities,
            timeline=fused_ctx.timeline,
            correlation_groups=[g.model_dump() for g in fused_ctx.correlation_groups],
            attack_chain=fused_ctx.attack_chain,
            status=IncidentStatus.NEW,
            metadata={"browser_signals": {"has_password_field": has_password_field, "form_actions": form_actions or []}}
        )

        # 9. Persist
        persisted = await self.incident_repo.create(incident)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        await self.incident_repo.log_event(
            input_type="browser",
            source="web_intelligence",
            risk_score=assessment.score,
            risk_level=assessment.level.value if hasattr(assessment.level, "value") else str(assessment.level),
            duration_ms=duration_ms,
            incident_id=persisted.id,
            provider_status={"browser_shield": "active", "urlbert": "ok" if self.url_engine.is_transformer_active else "heuristic_fallback", "threat_intel": "ok"}
        )

        return persisted
