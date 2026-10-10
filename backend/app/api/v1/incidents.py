"""Incidents & Command Center API Endpoints for ORION v2."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, Field

from app.repositories.incident_repo import IncidentRepository
from app.schemas.incident import Incident, IncidentStatus

router = APIRouter(tags=["Incidents & Command Center"])
incident_repo = IncidentRepository()


class StatusUpdateRequest(BaseModel):
    status: IncidentStatus = Field(description="Target incident status tier")


class AnalystNoteRequest(BaseModel):
    text: str = Field(description="Analyst commentary text (max 2000 chars)", max_length=2000)
    author: str = Field(default="Security Analyst", description="Name or role of analyst adding note")


@router.get("/incidents", response_model=List[Incident])
async def list_incidents(
    response: Response,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100),
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    threat_type: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Incident]:
    """Retrieve filtered and paginated list of security incidents."""
    eff_limit = limit
    eff_offset = offset

    if page is not None:
        p_size = page_size if page_size is not None else 20
        eff_limit = p_size
        eff_offset = (page - 1) * p_size

    total_count = await incident_repo.count_all(
        status=status,
        risk_level=risk_level,
        threat_type=threat_type,
        query_str=search,
    )
    response.headers["X-Total-Count"] = str(total_count)

    return await incident_repo.list_all(
        limit=eff_limit,
        offset=eff_offset,
        status=status,
        risk_level=risk_level,
        threat_type=threat_type,
        query_str=search,
    )


from app.engines.fusion.engine import EvidenceFusionEngine
from app.engines.fusion.entity import CanonicalEntity
from app.risk.engine import RiskEngine
from app.schemas.incident import IncidentEntity, EvidenceSource
import time

@router.get("/incidents/attack-story", response_model=Incident)
async def get_attack_story(hours: int = Query(2, description="Hours to look back for correlation")) -> Incident:
    """Dynamically reconstruct a cross-incident attack story from recent evidence."""
    import time
    from datetime import datetime, timezone, timedelta
    from collections import defaultdict
    
    # 1. Fetch recent incidents and apply the strict hours lookback filter
    raw_incidents = await incident_repo.list_all(limit=100)
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    recent_incidents = []
    for inc in raw_incidents:
        # Pydantic might return datetime object or string depending on version, handle appropriately
        inc_ts = inc.timestamp
        if isinstance(inc_ts, str):
            from dateutil.parser import parse
            inc_ts = parse(inc_ts)
            if inc_ts.tzinfo is None:
                inc_ts = inc_ts.replace(tzinfo=timezone.utc)
        
        if inc_ts >= cutoff_time:
            recent_incidents.append(inc)
            
    if not recent_incidents:
        return _build_empty_attack_story()

    # 2. Build graph to find actual shared relationships (canonical entity overlaps)
    entity_to_incidents = defaultdict(list)
    for inc in recent_incidents:
        for ent in inc.entities:
            # We use canonical entity representation (type, name) for relationship mapping
            ent_key = (ent.type, ent.name.lower() if ent.name else "")
            entity_to_incidents[ent_key].append(inc.id)
            
    # Adjacency list: inc_id -> set of related inc_ids
    adj = defaultdict(set)
    inc_by_id = {inc.id: inc for inc in recent_incidents}
    
    for ent_key, inc_ids in entity_to_incidents.items():
        if len(inc_ids) > 1:
            for i in range(len(inc_ids)):
                for j in range(i + 1, len(inc_ids)):
                    adj[inc_ids[i]].add(inc_ids[j])
                    adj[inc_ids[j]].add(inc_ids[i])
                    
    # 3. Find connected components of incidents
    visited = set()
    components = []
    
    for inc_id in inc_by_id.keys():
        if inc_id not in visited:
            comp = set()
            stack = [inc_id]
            while stack:
                curr = stack.pop()
                if curr not in visited:
                    visited.add(curr)
                    comp.add(curr)
                    stack.extend(adj[curr] - visited)
            components.append(comp)
            
    # Keep only components with >1 incident (meaning there's actual cross-incident correlation)
    connected_components = [c for c in components if len(c) > 1]
    
    if not connected_components:
        return _build_empty_attack_story()
        
    # 4. Pick the strongest connected correlation cluster (largest component)
    best_comp_ids = max(connected_components, key=len)
    related_incidents = [inc_by_id[i] for i in best_comp_ids]
    
    # 5. Extract connected evidence and entities for fusion
    all_evidence = []
    all_entities = []
    for inc in related_incidents:
        all_evidence.extend(inc.evidence)
        for ie in inc.entities:
            ce = CanonicalEntity(
                id=ie.id,
                type=ie.type.value if hasattr(ie.type, 'value') else ie.type,
                canonical_value=ie.name,
                raw_value=ie.name,
                attributes=ie.attributes
            )
            all_entities.append(ce)
            
    # 6. Pass connected evidence into existing global fusion
    start_time = time.perf_counter()
    fusion = EvidenceFusionEngine()
    fused_ctx = fusion.fuse(all_evidence, all_entities, "Cross-Incident Global Correlation")
    
    risk_engine = RiskEngine()
    assessment = risk_engine.evaluate(fused_ctx.fused_evidence)
    
    # Create the global incident
    from app.schemas.threat import RiskLevel
    global_incident = Incident(
        title="Correlated Multimodal Attack Story",
        source=EvidenceSource.SEMANTIC,
        input_type="multimodal",
        input_summary=f"Correlated {len(related_incidents)} interconnected incidents",
        threat_type=assessment.primary_threat,
        assessment=assessment.assessment,
        risk_level=assessment.level,
        risk_score=assessment.score,
        confidence=assessment.confidence,
        evidence=fused_ctx.fused_evidence,
        explanation=fused_ctx.xai_summary,
        xai_summary=fused_ctx.xai_summary,
        risk_drivers=assessment.risk_drivers,
        mitre_techniques=[],
        recommended_actions=[],
        entities=fused_ctx.entities,
        timeline=fused_ctx.timeline,
        correlation_groups=[g.model_dump() for g in fused_ctx.correlation_groups],
        attack_chain=fused_ctx.attack_chain,
        status=IncidentStatus.NEW,
        metadata={"is_global_story": True, "correlated_incident_count": len(related_incidents)}
    )
    
    return global_incident

def _build_empty_attack_story() -> Incident:
    """Return a truthful empty/no-correlation state."""
    from app.schemas.threat import RiskLevel, ThreatType, ThreatAssessment
    return Incident(
        title="No Connected Attack Story Identified",
        source=EvidenceSource.SEMANTIC,
        input_type="multimodal",
        input_summary="Recent activity exists, but ORION did not find sufficient evidence linking the signals into a common threat.",
        threat_type=ThreatType.BENIGN,
        assessment=ThreatAssessment.SAFE,
        risk_level=RiskLevel.SAFE,
        risk_score=0.0,
        confidence=1.0,
        evidence=[],
        explanation="No connected attack story identified. Recent activity exists, but ORION did not find sufficient evidence linking the signals into a common threat.",
        xai_summary="No connected attack story identified. Recent activity exists, but ORION did not find sufficient evidence linking the signals into a common threat.",
        risk_drivers=[],
        mitre_techniques=[],
        recommended_actions=[],
        entities=[],
        timeline=[],
        correlation_groups=[],
        attack_chain=[],
        status=IncidentStatus.RESOLVED,
        metadata={"is_global_story": True, "correlated_incident_count": 0}
    )



@router.get("/incidents/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str) -> Incident:
    """Retrieve full details and evidence lineage for a specific incident."""
    incident = await incident_repo.get_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/incidents/{incident_id}/status", response_model=Incident)
async def update_incident_status(
    incident_id: str,
    req: Optional[StatusUpdateRequest] = None,
    status: Optional[str] = Query(None),
) -> Incident:
    """Update operational status enforcing strict state machine transitions."""
    target_status = None
    if req and req.status:
        target_status = req.status
    elif status:
        try:
            target_status = IncidentStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status value: {status}")

    if not target_status:
        raise HTTPException(status_code=400, detail="Missing target status in body or query param.")

    try:
        updated = await incident_repo.update_status(incident_id, target_status)
        if not updated:
            raise HTTPException(status_code=404, detail="Incident not found")
        return updated
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))


@router.post("/incidents/{incident_id}/notes", response_model=Incident)
async def add_analyst_note(incident_id: str, req: AnalystNoteRequest) -> Incident:
    """Append an attributable analyst investigation note to the incident."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Note text cannot be empty.")

    try:
        updated = await incident_repo.add_analyst_note(
            incident_id=incident_id,
            text=req.text.strip(),
            author=req.author,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Incident not found")
        return updated
    except ValueError as val_err:
        raise HTTPException(status_code=404, detail=str(val_err))


@router.get("/incidents/summary/dashboard", response_model=Dict[str, Any])
@router.get("/dashboard/summary", response_model=Dict[str, Any])
async def get_dashboard_summary() -> Dict[str, Any]:
    """Get aggregated metrics and KPIs for the Command Center SOC dashboard directly from SQLite DB."""
    return await incident_repo.get_dashboard_summary()

