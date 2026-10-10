"""Phase 6: Response Execution & Playbook Lifecycle API Endpoints for ORION v2."""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException

from app.repositories.incident_repo import IncidentRepository
from app.response.response_service import ResponseExecutionService
from app.schemas.response import (
    ActionTransitionRequest,
    ExecuteActionRequest,
    ResponseExecutionRecord,
)

router = APIRouter(tags=["Response Playbooks & Execution"])
incident_repo = IncidentRepository()
response_svc = ResponseExecutionService()


@router.get("/incidents/{incident_id}/actions", response_model=List[ResponseExecutionRecord])
async def list_response_actions(incident_id: str) -> List[ResponseExecutionRecord]:
    """Retrieve all response execution records for an incident.
    
    Returns the full lifecycle state of every playbook action associated with
    this incident — including audit trail and simulation outputs.
    """
    incident = await incident_repo.get_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return await response_svc.list_for_incident(incident_id)


@router.post("/incidents/{incident_id}/actions/initialize", response_model=List[ResponseExecutionRecord])
async def initialize_response_actions(incident_id: str) -> List[ResponseExecutionRecord]:
    """Initialize response execution records from the incident's recommended_actions.

    This endpoint converts the static advisory recommendations on the incident
    into persisted, lifecycle-tracked ResponseExecutionRecord objects.
    Idempotent: already-initialized actions are not duplicated (INSERT OR IGNORE).
    """
    incident = await incident_repo.get_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    if not incident.recommended_actions:
        return []

    return await response_svc.create_from_recommendations(
        incident_id=incident_id,
        recommendations=incident.recommended_actions,
    )


@router.get("/incidents/{incident_id}/actions/{record_id}", response_model=ResponseExecutionRecord)
async def get_response_action(incident_id: str, record_id: str) -> ResponseExecutionRecord:
    """Retrieve a specific response execution record with its full audit trail."""
    incident = await incident_repo.get_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    record = await response_svc.get_by_id(record_id)
    if not record or record.incident_id != incident_id:
        raise HTTPException(status_code=404, detail=f"Response record {record_id} not found")
    return record


@router.post("/incidents/{incident_id}/actions/{record_id}/execute", response_model=ResponseExecutionRecord)
async def execute_response_action(
    incident_id: str,
    record_id: str,
    req: ExecuteActionRequest,
) -> ResponseExecutionRecord:
    """Dispatch a response action through the full execution lifecycle.

    SAFETY GUARANTEE:
      - SIMULATED mode: action is simulated entirely inside ORION. Zero external systems modified.
      - ADVISORY mode: analyst intent is logged only. No code is executed.

    State machine: RECOMMENDED → ACKNOWLEDGED → EXECUTING → COMPLETED
    All transitions are atomically written with a full audit trail entry.
    """
    incident = await incident_repo.get_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    try:
        return await response_svc.execute_action(
            record_id=record_id,
            incident_id=incident_id,
            req=req,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/incidents/{incident_id}/actions/{record_id}/transition", response_model=ResponseExecutionRecord)
async def transition_response_action(
    incident_id: str,
    record_id: str,
    req: ActionTransitionRequest,
) -> ResponseExecutionRecord:
    """Explicitly transition a response action to a new lifecycle state.

    Enforces the canonical state machine. Invalid transitions are rejected (HTTP 400).
    Every transition appends an immutable audit event with actor identity and timestamp.
    """
    incident = await incident_repo.get_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    try:
        return await response_svc.transition(
            record_id=record_id,
            incident_id=incident_id,
            req=req,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/incidents/{incident_id}/actions/{record_id}/audit")
async def get_action_audit_trail(incident_id: str, record_id: str) -> List[Dict[str, Any]]:
    """Retrieve the full, immutable audit trail for a response action.

    Returns a chronological list of all state transitions, actor identities,
    and simulation results. This log cannot be modified after creation.
    """
    incident = await incident_repo.get_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    try:
        events = await response_svc.get_audit_trail(record_id, incident_id)
        return [e.model_dump(mode="json") for e in events]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/incidents/{incident_id}/response-summary")
async def get_response_summary(incident_id: str) -> Dict[str, Any]:
    """Get aggregated response action statistics for an incident.

    Returns completion rate, counts by status/category, and advisory vs simulated split.
    """
    incident = await incident_repo.get_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    return await response_svc.get_response_summary(incident_id)
