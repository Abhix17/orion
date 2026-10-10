"""Incident and Audit Repository for ORION v2."""

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from app.core.database import execute_one, execute_query, execute_write
from app.schemas.incident import (
    AnalystNote,
    Incident,
    IncidentEntity,
    IncidentStatus,
    IncidentTimelineEvent,
)
from app.schemas.evidence import EvidenceItem
from app.schemas.response import ActionRecommendation
from app.schemas.threat import MitreTechnique, RiskLevel, ThreatAssessment, ThreatType


class IncidentRepository:
    """Repository handling all CRUD, lifecycle transitions, notes, and aggregation for Incidents."""

    VALID_STATUS_TRANSITIONS: Dict[IncidentStatus, set[IncidentStatus]] = {
        IncidentStatus.NEW: {
            IncidentStatus.ACKNOWLEDGED,
            IncidentStatus.INVESTIGATING,
            IncidentStatus.CONTAINED,
            IncidentStatus.RESOLVED,
            IncidentStatus.FALSE_POSITIVE,
        },
        IncidentStatus.ACKNOWLEDGED: {
            IncidentStatus.INVESTIGATING,
            IncidentStatus.CONTAINED,
            IncidentStatus.RESOLVED,
            IncidentStatus.FALSE_POSITIVE,
        },
        IncidentStatus.INVESTIGATING: {
            IncidentStatus.CONTAINED,
            IncidentStatus.RESOLVED,
            IncidentStatus.FALSE_POSITIVE,
        },
        IncidentStatus.CONTAINED: {
            IncidentStatus.RESOLVED,
            IncidentStatus.FALSE_POSITIVE,
        },
        IncidentStatus.RESOLVED: {
            IncidentStatus.INVESTIGATING,
        },
        IncidentStatus.FALSE_POSITIVE: {
            IncidentStatus.INVESTIGATING,
        },
    }

    @staticmethod
    def _row_to_incident(row) -> Incident:
        """Convert an SQLite Row into a canonical Incident domain model."""
        evidence_data = json.loads(row["evidence_json"])
        evidence = [EvidenceItem(**item) for item in evidence_data]

        actions_data = json.loads(row["actions_json"])
        actions = [ActionRecommendation(**act) for act in actions_data]

        entities_data = json.loads(row["entities_json"])
        entities = [IncidentEntity(**ent) for ent in entities_data]

        mitre_data = json.loads(row["mitre_json"])
        mitre = [MitreTechnique(**m) for m in mitre_data]

        metadata = json.loads(row["metadata_json"])
        timeline_data = metadata.get("timeline", [])
        timeline = [IncidentTimelineEvent(**t) if isinstance(t, dict) else t for t in timeline_data]

        notes_data = metadata.get("notes", [])
        notes = [AnalystNote(**n) if isinstance(n, dict) else n for n in notes_data]

        policy_version = metadata.get("policy_version", "4.0")

        return Incident(
            id=row["id"],
            timestamp=datetime.fromisoformat(row["timestamp"]),
            title=row["title"],
            source=row["source"],
            input_type=row["input_type"],
            input_summary=row["input_summary"],
            threat_type=ThreatType(row["threat_type"]),
            assessment=ThreatAssessment(row["assessment"]),
            risk_level=RiskLevel(row["risk_level"]),
            risk_score=row["risk_score"],
            confidence=row["confidence"],
            explanation=row["explanation"],
            status=IncidentStatus(row["status"]),
            analysis_run_id=row["analysis_run_id"],
            evidence=evidence,
            risk_drivers=json.loads(row["risk_drivers_json"]),
            mitre_techniques=mitre,
            recommended_actions=actions,
            entities=entities,
            timeline=timeline,
            correlation_groups=metadata.get("correlation_groups", []),
            attack_chain=metadata.get("attack_chain", []),
            xai_summary=metadata.get("xai_summary"),
            notes=notes,
            policy_version=policy_version,
            metadata=metadata,
        )

    async def create(self, incident: Incident) -> Incident:
        """Persist a new Incident to SQLite."""
        meta_dict = dict(incident.metadata)
        if incident.timeline and "timeline" not in meta_dict:
            meta_dict["timeline"] = [t.model_dump(mode="json") if hasattr(t, "model_dump") else t for t in incident.timeline]
        if incident.correlation_groups and "correlation_groups" not in meta_dict:
            meta_dict["correlation_groups"] = incident.correlation_groups
        if incident.attack_chain and "attack_chain" not in meta_dict:
            meta_dict["attack_chain"] = incident.attack_chain
        if incident.xai_summary and "xai_summary" not in meta_dict:
            meta_dict["xai_summary"] = incident.xai_summary
        if incident.notes:
            meta_dict["notes"] = [n.model_dump(mode="json") if hasattr(n, "model_dump") else n for n in incident.notes]
        meta_dict["policy_version"] = incident.policy_version

        query = """
            INSERT INTO incidents (
                id, timestamp, title, source, input_type, input_summary,
                threat_type, assessment, risk_level, risk_score, confidence,
                explanation, status, analysis_run_id,
                evidence_json, risk_drivers_json, mitre_json,
                actions_json, entities_json, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            incident.id,
            incident.timestamp.isoformat(),
            incident.title,
            str(incident.source.value if hasattr(incident.source, "value") else incident.source),
            incident.input_type,
            incident.input_summary,
            str(incident.threat_type.value if hasattr(incident.threat_type, "value") else incident.threat_type),
            str(incident.assessment.value if hasattr(incident.assessment, "value") else incident.assessment),
            str(incident.risk_level.value if hasattr(incident.risk_level, "value") else incident.risk_level),
            float(incident.risk_score),
            float(incident.confidence),
            incident.explanation,
            str(incident.status.value if hasattr(incident.status, "value") else incident.status),
            incident.analysis_run_id,
            json.dumps([e.model_dump(mode="json") for e in incident.evidence]),
            json.dumps(incident.risk_drivers),
            json.dumps([m.model_dump(mode="json") for m in incident.mitre_techniques]),
            json.dumps([a.model_dump(mode="json") for a in incident.recommended_actions]),
            json.dumps([ent.model_dump(mode="json") for ent in incident.entities]),
            json.dumps(meta_dict),
        )
        await execute_write(query, params)
        return incident

    # Convenience alias for behavioural orchestrator
    create_incident = create

    async def get_by_id(self, incident_id: str) -> Optional[Incident]:
        """Retrieve an Incident by its unique ID."""
        row = await execute_one("SELECT * FROM incidents WHERE id = ?", (incident_id,))
        if not row:
            return None
        return self._row_to_incident(row)

    async def list_all(
        self,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
        risk_level: Optional[str] = None,
        threat_type: Optional[str] = None,
        query_str: Optional[str] = None,
    ) -> List[Incident]:
        """List incidents with filtering, search query, and pagination."""
        query = "SELECT * FROM incidents WHERE 1=1"
        params: List[Any] = []

        if status:
            query += " AND status = ?"
            params.append(status)
        if risk_level:
            query += " AND risk_level = ?"
            params.append(risk_level)
        if threat_type:
            query += " AND threat_type = ?"
            params.append(threat_type)
        if query_str:
            query += " AND (id LIKE ? OR title LIKE ? OR input_summary LIKE ?)"
            pattern = f"%{query_str}%"
            params.extend([pattern, pattern, pattern])

        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = await execute_query(query, tuple(params))
        return [self._row_to_incident(row) for row in rows]

    async def update_status(self, incident_id: str, new_status: IncidentStatus) -> Incident:
        """Update the operational status of an incident enforcing state machine validity."""
        incident = await self.get_by_id(incident_id)
        if not incident:
            raise ValueError(f"Incident with ID '{incident_id}' not found.")

        current_status = incident.status
        if isinstance(current_status, str):
            current_status = IncidentStatus(current_status)

        target_status = new_status
        if isinstance(target_status, str):
            target_status = IncidentStatus(target_status)

        if current_status != target_status:
            allowed = self.VALID_STATUS_TRANSITIONS.get(current_status, set())
            if target_status not in allowed:
                raise ValueError(
                    f"Invalid status transition from {current_status.value} to {target_status.value}. "
                    f"Allowed next states: {[s.value for s in allowed]}"
                )

        status_val = target_status.value

        # Record timeline event for status transition
        tl_event = IncidentTimelineEvent(
            source="IncidentLifecycleEngine",
            title=f"Incident Status Changed to {status_val}",
            description=f"Status transitioned from {current_status.value} to {status_val} by analyst action.",
        )
        updated_timeline = incident.timeline + [tl_event]

        meta_dict = dict(incident.metadata)
        meta_dict["timeline"] = [t.model_dump(mode="json") if hasattr(t, "model_dump") else t for t in updated_timeline]

        await execute_write(
            "UPDATE incidents SET status = ?, metadata_json = ? WHERE id = ?",
            (status_val, json.dumps(meta_dict), incident_id),
        )

        res = await self.get_by_id(incident_id)
        return res

    async def add_analyst_note(
        self,
        incident_id: str,
        text: str,
        author: str = "Security Analyst",
    ) -> Incident:
        """Append an analyst note to an incident in an append-only, attributable log."""
        incident = await self.get_by_id(incident_id)
        if not incident:
            raise ValueError(f"Incident with ID '{incident_id}' not found.")

        note = AnalystNote(text=text, author=author)
        updated_notes = incident.notes + [note]

        tl_event = IncidentTimelineEvent(
            source="AnalystInterface",
            title="Analyst Note Added",
            description=f"Note added by {author}: '{text[:60]}...'" if len(text) > 60 else f"Note added by {author}: '{text}'",
        )
        updated_timeline = incident.timeline + [tl_event]

        meta_dict = dict(incident.metadata)
        meta_dict["notes"] = [n.model_dump(mode="json") if hasattr(n, "model_dump") else n for n in updated_notes]
        meta_dict["timeline"] = [t.model_dump(mode="json") if hasattr(t, "model_dump") else t for t in updated_timeline]

        await execute_write(
            "UPDATE incidents SET metadata_json = ? WHERE id = ?",
            (json.dumps(meta_dict), incident_id),
        )

        res = await self.get_by_id(incident_id)
        return res

    async def log_event(
        self,
        input_type: str,
        source: str,
        risk_score: float,
        risk_level: str,
        duration_ms: float,
        incident_id: Optional[str] = None,
        provider_status: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Record an analysis event in the audit trail."""
        event_id = f"evt_{uuid4().hex[:12]}"
        query = """
            INSERT INTO analysis_events (
                id, timestamp, input_type, source, incident_id,
                risk_score, risk_level, duration_ms, provider_status_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            event_id,
            datetime.now(timezone.utc).isoformat(),
            input_type,
            source,
            incident_id,
            risk_score,
            risk_level,
            duration_ms,
            json.dumps(provider_status or {}),
        )
        await execute_write(query, params)
        return event_id

    async def count_all(
        self,
        status: Optional[str] = None,
        risk_level: Optional[str] = None,
        threat_type: Optional[str] = None,
        query_str: Optional[str] = None,
    ) -> int:
        """Count total incidents matching filter criteria for pagination."""
        query = "SELECT COUNT(*) as total FROM incidents WHERE 1=1"
        params: List[Any] = []

        if status:
            query += " AND status = ?"
            params.append(status)
        if risk_level:
            query += " AND risk_level = ?"
            params.append(risk_level)
        if threat_type:
            query += " AND threat_type = ?"
            params.append(threat_type)
        if query_str:
            query += " AND (id LIKE ? OR title LIKE ? OR input_summary LIKE ? OR threat_type LIKE ? OR entities_json LIKE ?)"
            pattern = f"%{query_str}%"
            params.extend([pattern, pattern, pattern, pattern, pattern])

        row = await execute_one(query, tuple(params))
        return row["total"] if row else 0

    async def get_dashboard_summary(self) -> Dict[str, Any]:
        """Aggregate real-time SOC Command Center metrics directly from SQLite database."""
        # Total events analyzed
        row_events = await execute_one("SELECT COUNT(*) as total FROM analysis_events")
        total_events = row_events["total"] if row_events else 0

        # Total incidents
        row_inc = await execute_one("SELECT COUNT(*) as total FROM incidents")
        total_incidents = row_inc["total"] if row_inc else 0

        # Total threats detected
        row_threats = await execute_one(
            "SELECT COUNT(*) as threats FROM incidents WHERE assessment IN ('SUSPICIOUS', 'MALICIOUS')"
        )
        threats_detected = row_threats["threats"] if row_threats else 0

        # Active incidents (not RESOLVED or FALSE_POSITIVE)
        row_active = await execute_one(
            "SELECT COUNT(*) as active FROM incidents WHERE status NOT IN ('RESOLVED', 'FALSE_POSITIVE')"
        )
        active_incidents = row_active["active"] if row_active else 0

        # Status breakdown
        status_rows = await execute_query(
            "SELECT status, COUNT(*) as count FROM incidents GROUP BY status"
        )
        status_counts = {s.value: 0 for s in IncidentStatus}
        for r in status_rows:
            status_counts[r["status"]] = r["count"]

        # Risk level distribution
        risk_counts: Dict[str, int] = {
            "SAFE": 0, "LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0
        }
        risk_rows = await execute_query(
            "SELECT risk_level, COUNT(*) as count FROM incidents GROUP BY risk_level"
        )
        for r in risk_rows:
            risk_counts[r["risk_level"]] = r["count"]

        # Threat category breakdown (Raw & Canonical)
        cat_rows = await execute_query(
            "SELECT threat_type, COUNT(*) as count FROM incidents GROUP BY threat_type"
        )
        raw_category_counts: Dict[str, int] = {r["threat_type"]: r["count"] for r in cat_rows}

        # Canonical threat taxonomy distribution
        canonical_threat_distribution: Dict[str, int] = {
            "Phishing": 0,
            "Malicious URL": 0,
            "Digital Impersonation": 0,
            "Deepfake": 0,
            "Account Takeover": 0,
            "Behavioural Anomaly": 0,
            "Other": 0,
        }

        for tt, cnt in raw_category_counts.items():
            tt_lower = tt.lower()
            if "phish" in tt_lower:
                canonical_threat_distribution["Phishing"] += cnt
            elif "url" in tt_lower:
                canonical_threat_distribution["Malicious URL"] += cnt
            elif "impersonation" in tt_lower or "identity" in tt_lower:
                canonical_threat_distribution["Digital Impersonation"] += cnt
            elif "deepfake" in tt_lower or "synthetic" in tt_lower or "voice" in tt_lower:
                canonical_threat_distribution["Deepfake"] += cnt
            elif "account" in tt_lower or "takeover" in tt_lower or "auth" in tt_lower or "ato" in tt_lower:
                canonical_threat_distribution["Account Takeover"] += cnt
            elif "behaviour" in tt_lower or "behavior" in tt_lower or "anomaly" in tt_lower:
                canonical_threat_distribution["Behavioural Anomaly"] += cnt
            else:
                canonical_threat_distribution["Other"] += cnt

        # Recent timeline feed (top 20)
        time_rows = await execute_query(
            "SELECT id, timestamp, title, input_summary, source, input_type, threat_type, assessment, risk_level, risk_score, status FROM incidents ORDER BY timestamp DESC LIMIT 20"
        )
        timeline = [
            {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "title": r["title"],
                "input_summary": r["input_summary"],
                "source": r["source"],
                "input_type": r["input_type"],
                "threat_type": r["threat_type"],
                "assessment": r["assessment"],
                "risk_level": r["risk_level"],
                "risk_score": r["risk_score"],
                "status": r["status"],
            }
            for r in time_rows
        ]

        # Operational sorting for Needs Attention view:
        # Active incidents ordered by: Severity rank (CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1, SAFE=0), then risk_score DESC, timestamp DESC
        active_rows = await execute_query(
            "SELECT * FROM incidents WHERE status NOT IN ('RESOLVED', 'FALSE_POSITIVE')"
        )
        active_incidents_objs = [self._row_to_incident(r) for r in active_rows]

        sev_rank = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "SAFE": 0}
        attention_required = sorted(
            active_incidents_objs,
            key=lambda i: (
                sev_rank.get(i.risk_level.value if hasattr(i.risk_level, "value") else str(i.risk_level), 0),
                i.risk_score,
                i.timestamp.isoformat(),
            ),
            reverse=True,
        )

        # Threat Activity Narrative Summary (deterministic calculation)
        active_crit = risk_counts.get("CRITICAL", 0)
        active_high = risk_counts.get("HIGH", 0)
        total_high_crit = active_crit + active_high

        if total_incidents == 0:
            activity_summary = "No security incidents detected in system database."
        elif total_high_crit > 0:
            top_cat = max(canonical_threat_distribution, key=canonical_threat_distribution.get) if canonical_threat_distribution else "Threat"
            activity_summary = f"{total_high_crit} high/critical severity incident{'s' if total_high_crit > 1 else ''} active. Primary vector: {top_cat}."
        else:
            activity_summary = f"All {total_incidents} incident{'s' if total_incidents > 1 else ''} evaluated at low or safe risk baseline."

        return {
            "total_events": max(total_events, total_incidents),
            "total_events_analyzed": max(total_events, total_incidents),
            "total_incidents": total_incidents,
            "active_incidents": active_incidents,
            "critical_incidents": risk_counts.get("CRITICAL", 0),
            "high_risk_incidents": risk_counts.get("HIGH", 0),
            "threats_detected": threats_detected,
            "phishing_attempts": canonical_threat_distribution["Phishing"] + canonical_threat_distribution["Malicious URL"],
            "impersonation_attempts": canonical_threat_distribution["Digital Impersonation"],
            "suspected_deepfakes": canonical_threat_distribution["Deepfake"],
            "voice_cloning_incidents": raw_category_counts.get(ThreatType.VOICE_CLONE.value, 0) + raw_category_counts.get(ThreatType.SYNTHETIC_AUDIO.value, 0),
            "account_takeover_attempts": canonical_threat_distribution["Account Takeover"],
            "status_distribution": status_counts,
            "risk_distribution": risk_counts,
            "category_distribution": raw_category_counts,
            "threat_distribution": canonical_threat_distribution,
            "recent_timeline": timeline,
            "attention_required": [i.model_dump(mode="json") for i in attention_required[:10]],
            "activity_summary": activity_summary,
            "avg_resolution_time_minutes": 0.0,
            "average_resolution_time": 0.0,
        }

