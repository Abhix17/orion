"""Behavioural Security Orchestrator for Account Takeover (ATO) Prevention in ORION v2."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from app.engines.behavioural.geo_velocity import GeoVelocityCalculator
from app.engines.behavioural.isolation_forest import IsolationForestAnomalyDetector
from app.engines.behavioural.profile_store import LoginRecord, UserProfileStore
from app.explainability.generator import ExplainabilityGenerator
from app.providers.threat_intel import ThreatIntelProvider
from app.repositories.incident_repo import IncidentRepository
from app.response.playbooks import ResponsePlaybookGenerator
from app.risk.engine import RiskEngine
from app.risk.mitre import MitreMapper
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution
from app.schemas.incident import EntityType, Incident, IncidentEntity, IncidentStatus
from app.schemas.threat import RiskLevel, ThreatAssessment, ThreatType
from app.engines.fusion.entity import CanonicalEntity, EntityResolver
from app.engines.fusion.engine import EvidenceFusionEngine


class BehaviouralOrchestrator:
    """Orchestrates behavioral profiling, geo-velocity calculation, isolation forest anomaly detection,

    and deterministic risk evaluation for enterprise authentication events.
    """

    def __init__(
        self,
        profile_store: Optional[UserProfileStore] = None,
        threat_intel: Optional[ThreatIntelProvider] = None,
        risk_engine: Optional[RiskEngine] = None,
        incident_repo: Optional[IncidentRepository] = None,
        fusion_engine: Optional[EvidenceFusionEngine] = None,
    ):
        self.profile_store = profile_store or UserProfileStore()
        self.geo_calc = GeoVelocityCalculator()
        self.iforest = IsolationForestAnomalyDetector()
        self.threat_intel = threat_intel or ThreatIntelProvider()
        self.risk_engine = risk_engine or RiskEngine()
        self.incident_repo = incident_repo or IncidentRepository()
        self.fusion_engine = fusion_engine or EvidenceFusionEngine()

    async def analyze_auth_event(
        self,
        user_id: str,
        timestamp: Optional[datetime] = None,
        ip_address: str = "127.0.0.1",
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        user_agent: Optional[str] = None,
        asn: Optional[str] = None,
        device_id: Optional[str] = None,
        success: bool = True,
        auth_method: str = "password",
        injected_failed_burst: Optional[int] = None,
    ) -> Incident:
        """Process an authentication event through spatial, statistical, and risk pipelines."""
        event_time = timestamp or datetime.now(timezone.utc)
        if event_time.tzinfo is None:
            event_time = event_time.replace(tzinfo=timezone.utc)

        profile = self.profile_store.get_or_create_profile(user_id)
        evidence: List[EvidenceItem] = []

        # 1. Handle Failed Attempts Tracking
        if not success:
            failed_count = self.profile_store.record_failure(user_id, event_time)
        else:
            failed_count = profile.failed_login_counter

        # Support test injection of burst count
        if injected_failed_burst is not None:
            failed_count = max(failed_count, injected_failed_burst)

        # 2. Geo-Velocity & Impossible Travel Assessment
        geo_evidence, geo_metrics = self.geo_calc.evaluate_movement(
            last_login=profile.last_login,
            current_lat=latitude,
            current_lon=longitude,
            current_time=event_time,
            current_country=country,
            known_countries=profile.typical_countries,
        )
        evidence.extend(geo_evidence)

        # 3. Threat Intelligence IP Enrichment
        if ip_address and ip_address != "127.0.0.1":
            ip_evidence = await self.threat_intel.generate_evidence(ip_address, indicator_type="ip")
            if ip_evidence:
                evidence.append(ip_evidence)

        # 4. Device and Network Novelty
        is_new_device = bool(device_id and device_id not in profile.known_devices and len(profile.known_devices) > 0)
        is_new_asn = bool(asn and asn not in profile.typical_asns and len(profile.typical_asns) > 0)
        is_new_country = bool(country and country not in profile.typical_countries and len(profile.typical_countries) > 0)

        # 5. Isolation Forest Unsupervised Anomaly Scoring
        velocity_kmh = geo_metrics["velocity_kmh"] if geo_metrics else 0.0
        hour = event_time.hour
        day_of_week = event_time.weekday()

        iforest_evidence, anomaly_score = self.iforest.evaluate_auth_event(
            user_id=user_id,
            profile=profile,
            hour=hour,
            day_of_week=day_of_week,
            is_new_device=is_new_device,
            is_new_asn=is_new_asn,
            is_new_country=is_new_country,
            failed_attempts=failed_count,
            velocity_kmh=velocity_kmh,
        )
        evidence.extend(iforest_evidence)

        # 6. Deterministic Risk Engine Evaluation
        assessment = self.risk_engine.evaluate(evidence)

        # 7. MITRE ATT&CK Enrichment
        mitre_techniques = MitreMapper.enrich(assessment.primary_threat, evidence)
        assessment.mitre_techniques = mitre_techniques

        # 8. Explainability and Advisory Playbooks
        explanation = ExplainabilityGenerator.generate(
            assessment=assessment,
            evidence=evidence,
            input_summary=f"Auth event for user '{user_id}' from {ip_address}",
        )
        recommended_actions = ResponsePlaybookGenerator.generate(
            threat_type=assessment.primary_threat,
            risk_level=assessment.level,
            evidence=evidence,
            target_entity=user_id,
        )

        # 9. Update Baseline Profile if Login was Successful and Benign
        if success and assessment.score < 0.50:
            login_rec = LoginRecord(
                timestamp=event_time,
                latitude=latitude,
                longitude=longitude,
                ip_address=ip_address,
                city=city,
                country=country,
                asn=asn,
                user_agent=user_agent,
                device_id=device_id,
                success=True,
            )
            self.profile_store.record_login(user_id, login_rec)

        # 10. Construct Canonical Incident
        threat_val = assessment.primary_threat.value if hasattr(assessment.primary_threat, "value") else str(assessment.primary_threat)
        assess_val = assessment.assessment.value if hasattr(assessment.assessment, "value") else str(assessment.assessment)
        level_val = assessment.level.value if hasattr(assessment.level, "value") else str(assessment.level)

        user_ent = EntityResolver.resolve_user(user_id, role="enterprise_user")
        ip_ent = EntityResolver.resolve_ip(ip_address, asn=asn)
        canon_entities = [user_ent, ip_ent]
        if device_id:
            canon_entities.append(EntityResolver.resolve_device(device_id))

        input_summary = (
            f"User: {user_id} | IP: {ip_address} | Loc: {city or 'Unknown'}, {country or 'Unknown'} "
            f"| Device: {device_id or 'Unknown'} | Status: {'Success' if success else 'Failed'}"
        )

        for item in evidence:
            if not item.entity_refs:
                item.entity_refs = [e.id for e in canon_entities]

        fused_ctx = self.fusion_engine.fuse(evidence, canon_entities, context_summary=input_summary)

        # Re-evaluate with fused evidence
        assessment = self.risk_engine.evaluate(fused_ctx.fused_evidence)
        mitre_techniques = MitreMapper.enrich(assessment.primary_threat, fused_ctx.fused_evidence)
        explanation = ExplainabilityGenerator.generate(
            assessment, fused_ctx.fused_evidence, input_summary, attack_chain=fused_ctx.attack_chain
        )
        recommended_actions = ResponsePlaybookGenerator.generate(
            assessment.primary_threat,
            assessment.level,
            fused_ctx.fused_evidence,
            target_entity=user_id,
        )

        threat_val = assessment.primary_threat.value if hasattr(assessment.primary_threat, "value") else str(assessment.primary_threat)
        assess_val = assessment.assessment.value if hasattr(assessment.assessment, "value") else str(assessment.assessment)
        level_val = assessment.level.value if hasattr(assessment.level, "value") else str(assessment.level)

        title = (
            f"Suspicious Authentication Alert: {threat_val.upper()} for {user_id}"
            if level_val in ("HIGH", "CRITICAL", RiskLevel.HIGH, RiskLevel.CRITICAL)
            else f"Authentication Event ({assess_val}): {user_id}"
        )

        incident = Incident(
            id=f"inc_auth_{uuid4().hex[:10]}",
            title=title,
            source=EvidenceSource.AUTH,
            input_type="auth_event",
            input_summary=input_summary,
            threat_type=assessment.primary_threat,
            assessment=assessment.assessment,
            risk_level=assessment.level,
            risk_score=assessment.score,
            confidence=assessment.confidence,
            evidence=fused_ctx.fused_evidence,
            explanation=explanation,
            xai_summary=fused_ctx.xai_summary,
            risk_drivers=assessment.risk_drivers,
            mitre_techniques=mitre_techniques,
            recommended_actions=recommended_actions,
            entities=fused_ctx.entities,
            timeline=fused_ctx.timeline,
            correlation_groups=[g.model_dump() for g in fused_ctx.correlation_groups],
            attack_chain=fused_ctx.attack_chain,
            status=IncidentStatus.NEW,
            metadata={
                "user_id": user_id,
                "anomaly_score": anomaly_score,
                "failed_attempts": failed_count,
                "geo_metrics": geo_metrics,
                "auth_method": auth_method,
            },
        )

        # Save incident to database
        try:
            await self.incident_repo.create_incident(incident)
        except Exception:
            pass  # Non-fatal if sqlite repo unavailable during lightweight tests

        return incident
