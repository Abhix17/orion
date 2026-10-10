"""Response Execution Service for ORION v2 — Phase 6.

SAFETY CONTRACT:
  - SIMULATED mode: all "actions" are simulated entirely within ORION's database.
    No external system is modified, no real IP is blocked, no real account is touched.
  - ADVISORY mode: records analyst intent only. Zero code execution occurs.
  - This service MUST NEVER: delete accounts, change credentials, revoke real sessions,
    modify firewalls, quarantine real emails, or execute payloads against live systems.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from app.core.database import execute_one, execute_query, execute_write
from app.schemas.response import (
    VALID_ACTION_TRANSITIONS,
    ActionCategory,
    ActionExecutionMode,
    ActionPriority,
    ActionRecommendation,
    ActionTransitionRequest,
    ExecuteActionRequest,
    ResponseActionStatus,
    ResponseAuditEvent,
    ResponseExecutionRecord,
)

logger = logging.getLogger("orion.response_service")


class ResponseExecutionService:
    """Manages the full lifecycle of response actions tied to incidents.

    Enforces:
      - Deterministic state machine (VALID_ACTION_TRANSITIONS)
      - Immutable append-only audit trail
      - Simulation-only execution (zero external side-effects)
    """

    # -------------------------------------------------------------------------
    # DB Initialization (called by database.py init_tables)
    # -------------------------------------------------------------------------
    @staticmethod
    async def ensure_tables() -> None:
        """Idempotent creation of response_executions and response_audit tables."""
        await execute_write("""
            CREATE TABLE IF NOT EXISTS response_executions (
                id TEXT PRIMARY KEY,
                incident_id TEXT NOT NULL,
                action_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                priority TEXT NOT NULL,
                mode TEXT NOT NULL DEFAULT 'ADVISORY',
                status TEXT NOT NULL DEFAULT 'RECOMMENDED',
                target_entity TEXT,
                reason TEXT,
                supporting_evidence_ids_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                acknowledged_at TEXT,
                executed_at TEXT,
                completed_at TEXT,
                audit_trail_json TEXT NOT NULL DEFAULT '[]',
                simulation_output_json TEXT,
                FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
            )
        """)
        await execute_write(
            "CREATE INDEX IF NOT EXISTS idx_resp_incident ON response_executions(incident_id)"
        )
        await execute_write(
            "CREATE INDEX IF NOT EXISTS idx_resp_status ON response_executions(status)"
        )

    # -------------------------------------------------------------------------
    # Internal helpers
    # -------------------------------------------------------------------------
    @staticmethod
    def _row_to_record(row) -> ResponseExecutionRecord:
        audit_raw = json.loads(row["audit_trail_json"] or "[]")
        audit_events = [ResponseAuditEvent(**e) for e in audit_raw]
        sim_out = json.loads(row["simulation_output_json"]) if row["simulation_output_json"] else None

        return ResponseExecutionRecord(
            id=row["id"],
            incident_id=row["incident_id"],
            action_id=row["action_id"],
            title=row["title"],
            description=row["description"],
            category=ActionCategory(row["category"]),
            priority=ActionPriority(row["priority"]),
            mode=ActionExecutionMode(row["mode"]),
            status=ResponseActionStatus(row["status"]),
            target_entity=row["target_entity"],
            reason=row["reason"],
            supporting_evidence_ids=json.loads(row["supporting_evidence_ids_json"] or "[]"),
            created_at=datetime.fromisoformat(row["created_at"]),
            acknowledged_at=datetime.fromisoformat(row["acknowledged_at"]) if row["acknowledged_at"] else None,
            executed_at=datetime.fromisoformat(row["executed_at"]) if row["executed_at"] else None,
            completed_at=datetime.fromisoformat(row["completed_at"]) if row["completed_at"] else None,
            audit_trail=audit_events,
            simulation_output=sim_out,
        )

    @staticmethod
    def _simulate_execution(record: ResponseExecutionRecord) -> Dict:
        """Produce a deterministic simulation result. Zero real-world side effects."""
        sim_id = f"sim_{uuid4().hex[:8]}"
        timestamp = datetime.now(timezone.utc).isoformat()

        category_sim_map = {
            ActionCategory.BLOCK: {
                "action": "URL_BLACKLIST_SIMULATION",
                "target": record.target_entity or "unknown",
                "result": "BLOCKED_IN_SIMULATION",
                "real_systems_modified": False,
                "note": "DNS/proxy block simulated. No real firewall rule created.",
            },
            ActionCategory.WARN: {
                "action": "USER_WARNING_SIMULATION",
                "target": record.target_entity or "end_user",
                "result": "WARNING_DISPLAYED_IN_SIMULATION",
                "real_systems_modified": False,
                "note": "Browser shield intercept simulated. No real user notification sent.",
            },
            ActionCategory.SESSION: {
                "action": "SESSION_REVOCATION_SIMULATION",
                "target": record.target_entity or "user_session",
                "result": "SESSIONS_REVOKED_IN_SIMULATION",
                "real_systems_modified": False,
                "note": "Session revocation simulated. No real tokens invalidated.",
            },
            ActionCategory.AUTHENTICATION: {
                "action": "MFA_CHALLENGE_SIMULATION",
                "target": record.target_entity or "user_account",
                "result": "MFA_CHALLENGE_ISSUED_IN_SIMULATION",
                "real_systems_modified": False,
                "note": "MFA step-up simulated. No real authentication provider called.",
            },
            ActionCategory.VERIFICATION: {
                "action": "IDENTITY_VERIFICATION_SIMULATION",
                "target": record.target_entity or "identity",
                "result": "VERIFICATION_REQUEST_LOGGED_IN_SIMULATION",
                "real_systems_modified": False,
                "note": "Out-of-band verification request logged. No real contact made.",
            },
            ActionCategory.NOTIFICATION: {
                "action": "NOTIFICATION_DISPATCH_SIMULATION",
                "target": record.target_entity or "security_team",
                "result": "NOTIFICATION_QUEUED_IN_SIMULATION",
                "real_systems_modified": False,
                "note": "SOC notification simulated. No real email/SMS sent.",
            },
            ActionCategory.INVESTIGATION: {
                "action": "SIEM_CORRELATION_SIMULATION",
                "target": record.target_entity or "siem_platform",
                "result": "CORRELATION_QUERY_SIMULATED",
                "real_systems_modified": False,
                "note": "SIEM query simulated. No real log platform queried.",
            },
            ActionCategory.CONTAINMENT: {
                "action": "CONTAINMENT_SIMULATION",
                "target": record.target_entity or "endpoint",
                "result": "ENDPOINT_ISOLATED_IN_SIMULATION",
                "real_systems_modified": False,
                "note": "Endpoint isolation simulated. No real network change applied.",
            },
            ActionCategory.ESCALATION: {
                "action": "ESCALATION_SIMULATION",
                "target": "incident_response_team",
                "result": "ESCALATION_TICKET_CREATED_IN_SIMULATION",
                "real_systems_modified": False,
                "note": "Escalation ticket simulated. No real ticketing system modified.",
            },
            ActionCategory.REPORTING: {
                "action": "REPORT_GENERATION_SIMULATION",
                "target": "compliance_team",
                "result": "REPORT_GENERATED_IN_SIMULATION",
                "real_systems_modified": False,
                "note": "Compliance report simulated. No external report filed.",
            },
        }

        outcome = category_sim_map.get(record.category, {
            "action": "GENERIC_SIMULATION",
            "target": record.target_entity,
            "result": "SIMULATED",
            "real_systems_modified": False,
        })

        return {
            "simulation_id": sim_id,
            "timestamp": timestamp,
            "mode": "SIMULATED",
            "safety_guarantee": "ZERO_EXTERNAL_IMPACT",
            **outcome,
        }

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------
    async def create_from_recommendations(
        self,
        incident_id: str,
        recommendations: List[ActionRecommendation],
    ) -> List[ResponseExecutionRecord]:
        """Persist all recommended actions as RECOMMENDED lifecycle records."""
        records = []
        now = datetime.now(timezone.utc).isoformat()

        for rec in recommendations:
            rec_id = f"resp_{uuid4().hex[:10]}"
            initial_audit = ResponseAuditEvent(
                action_id=rec_id,
                incident_id=incident_id,
                from_status=None,
                to_status=ResponseActionStatus.RECOMMENDED,
                actor="SYSTEM",
                mode=ActionExecutionMode(rec.mode) if rec.mode in ActionExecutionMode._value2member_map_ else ActionExecutionMode.ADVISORY,
                note="Action generated by deterministic ResponsePlaybookGenerator.",
            )

            await execute_write(
                """
                INSERT OR IGNORE INTO response_executions (
                    id, incident_id, action_id, title, description, category,
                    priority, mode, status, target_entity, reason,
                    supporting_evidence_ids_json, created_at, audit_trail_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    rec_id,
                    incident_id,
                    rec.id,
                    rec.title,
                    rec.description,
                    rec.category if isinstance(rec.category, str) else rec.category.value,
                    rec.priority if isinstance(rec.priority, str) else rec.priority.value,
                    rec.mode if isinstance(rec.mode, str) else rec.mode.value,
                    ResponseActionStatus.RECOMMENDED.value,
                    rec.target_entity,
                    rec.reason,
                    json.dumps(rec.supporting_evidence_ids),
                    now,
                    json.dumps([initial_audit.model_dump(mode="json")]),
                ),
            )

            row = await execute_one(
                "SELECT * FROM response_executions WHERE id = ?", (rec_id,)
            )
            if row:
                records.append(self._row_to_record(row))

        return records

    async def list_for_incident(self, incident_id: str) -> List[ResponseExecutionRecord]:
        """Retrieve all response execution records for an incident."""
        rows = await execute_query(
            "SELECT * FROM response_executions WHERE incident_id = ? ORDER BY created_at ASC",
            (incident_id,),
        )
        return [self._row_to_record(r) for r in rows]

    async def get_by_id(self, record_id: str) -> Optional[ResponseExecutionRecord]:
        """Retrieve a single response execution record by its ID."""
        row = await execute_one(
            "SELECT * FROM response_executions WHERE id = ?", (record_id,)
        )
        return self._row_to_record(row) if row else None

    async def transition(
        self,
        record_id: str,
        incident_id: str,
        req: ActionTransitionRequest,
    ) -> ResponseExecutionRecord:
        """Apply a validated state machine transition to a response action."""
        row = await execute_one(
            "SELECT * FROM response_executions WHERE id = ? AND incident_id = ?",
            (record_id, incident_id),
        )
        if not row:
            raise ValueError(f"Response record {record_id} not found for incident {incident_id}")

        record = self._row_to_record(row)
        current = ResponseActionStatus(record.status)
        target = req.target_status

        allowed = VALID_ACTION_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise ValueError(
                f"Invalid transition: {current.value} → {target.value}. "
                f"Allowed: {[s.value for s in allowed] or 'none (terminal state)'}"
            )

        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()

        # Build audit event
        audit_evt = ResponseAuditEvent(
            action_id=record_id,
            incident_id=incident_id,
            from_status=current.value,
            to_status=target.value,
            actor=req.actor,
            mode=ActionExecutionMode(record.mode),
            note=req.note,
        )

        # Update lifecycle timestamps
        ack_ts = record.acknowledged_at.isoformat() if record.acknowledged_at else None
        exec_ts = record.executed_at.isoformat() if record.executed_at else None
        comp_ts = record.completed_at.isoformat() if record.completed_at else None

        if target == ResponseActionStatus.ACKNOWLEDGED:
            ack_ts = now_iso
        elif target == ResponseActionStatus.EXECUTING:
            exec_ts = now_iso
        elif target == ResponseActionStatus.COMPLETED:
            comp_ts = now_iso

        # Append audit event
        existing_audit = json.loads(row["audit_trail_json"] or "[]")
        existing_audit.append(audit_evt.model_dump(mode="json"))

        await execute_write(
            """
            UPDATE response_executions
            SET status = ?, acknowledged_at = ?, executed_at = ?, completed_at = ?,
                audit_trail_json = ?
            WHERE id = ?
            """,
            (
                target.value,
                ack_ts,
                exec_ts,
                comp_ts,
                json.dumps(existing_audit),
                record_id,
            ),
        )

        updated_row = await execute_one(
            "SELECT * FROM response_executions WHERE id = ?", (record_id,)
        )
        return self._row_to_record(updated_row)

    async def execute_action(
        self,
        record_id: str,
        incident_id: str,
        req: ExecuteActionRequest,
    ) -> ResponseExecutionRecord:
        """
        Dispatch an action. Enforces:
          1. Auto-transitions RECOMMENDED → ACKNOWLEDGED → EXECUTING → COMPLETED
          2. Runs simulation if mode=SIMULATED
          3. All operations are guaranteed non-destructive
        """
        row = await execute_one(
            "SELECT * FROM response_executions WHERE id = ? AND incident_id = ?",
            (record_id, incident_id),
        )
        if not row:
            raise ValueError(f"Response record {record_id} not found for incident {incident_id}")

        record = self._row_to_record(row)
        current = ResponseActionStatus(record.status)
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()

        audit_log = json.loads(row["audit_trail_json"] or "[]")
        simulation_output = None
        final_status = ResponseActionStatus.COMPLETED
        ack_ts = record.acknowledged_at.isoformat() if record.acknowledged_at else None
        exec_ts = record.executed_at.isoformat() if record.executed_at else None
        comp_ts = record.completed_at.isoformat() if record.completed_at else None

        # Progress through state machine: skip already-passed states
        transitions_to_apply = []
        if current == ResponseActionStatus.RECOMMENDED:
            transitions_to_apply = [
                (ResponseActionStatus.ACKNOWLEDGED, "Auto-acknowledged on dispatch."),
                (ResponseActionStatus.EXECUTING, "Action dispatched for execution."),
            ]
            ack_ts = now_iso
            exec_ts = now_iso
        elif current == ResponseActionStatus.ACKNOWLEDGED:
            transitions_to_apply = [
                (ResponseActionStatus.EXECUTING, "Action dispatched for execution."),
            ]
            exec_ts = now_iso
        elif current == ResponseActionStatus.EXECUTING:
            transitions_to_apply = []  # Will complete below
        elif current in (ResponseActionStatus.COMPLETED, ResponseActionStatus.DISMISSED):
            raise ValueError(f"Action is already in terminal state: {current.value}")

        for (to_s, note) in transitions_to_apply:
            evt = ResponseAuditEvent(
                action_id=record_id,
                incident_id=incident_id,
                from_status=audit_log[-1]["to_status"] if audit_log else None,
                to_status=to_s.value,
                actor=req.actor,
                mode=req.mode,
                note=note,
            )
            audit_log.append(evt.model_dump(mode="json"))

        # Run simulation or log advisory intent
        if req.mode == ActionExecutionMode.SIMULATED:
            simulation_output = self._simulate_execution(record)
            result_note = f"Simulation completed: {simulation_output.get('result', 'DONE')}"
        else:
            result_note = f"Advisory action logged. Analyst ({req.actor}) must act manually."

        if req.note:
            result_note = f"{req.note} | {result_note}"

        # Final COMPLETED transition
        comp_ts = now_iso
        complete_evt = ResponseAuditEvent(
            action_id=record_id,
            incident_id=incident_id,
            from_status=ResponseActionStatus.EXECUTING.value,
            to_status=ResponseActionStatus.COMPLETED.value,
            actor=req.actor,
            mode=req.mode,
            note=result_note,
            simulation_result=simulation_output,
        )
        audit_log.append(complete_evt.model_dump(mode="json"))

        await execute_write(
            """
            UPDATE response_executions
            SET status = ?, mode = ?, acknowledged_at = ?, executed_at = ?,
                completed_at = ?, audit_trail_json = ?, simulation_output_json = ?
            WHERE id = ?
            """,
            (
                ResponseActionStatus.COMPLETED.value,
                req.mode.value,
                ack_ts,
                exec_ts,
                comp_ts,
                json.dumps(audit_log),
                json.dumps(simulation_output) if simulation_output else None,
                record_id,
            ),
        )

        updated = await execute_one(
            "SELECT * FROM response_executions WHERE id = ?", (record_id,)
        )
        return self._row_to_record(updated)

    async def get_audit_trail(
        self, record_id: str, incident_id: str
    ) -> List[ResponseAuditEvent]:
        """Return the full immutable audit trail for a response action."""
        row = await execute_one(
            "SELECT audit_trail_json FROM response_executions WHERE id = ? AND incident_id = ?",
            (record_id, incident_id),
        )
        if not row:
            raise ValueError(f"Record {record_id} not found")
        return [ResponseAuditEvent(**e) for e in json.loads(row["audit_trail_json"] or "[]")]

    async def get_response_summary(self, incident_id: str) -> Dict:
        """Aggregate response action statistics for an incident."""
        rows = await execute_query(
            "SELECT status, mode, category FROM response_executions WHERE incident_id = ?",
            (incident_id,),
        )
        total = len(rows)
        by_status: Dict[str, int] = {}
        by_category: Dict[str, int] = {}
        advisory_count = 0
        simulated_count = 0

        for r in rows:
            s = r["status"]
            c = r["category"]
            m = r["mode"]
            by_status[s] = by_status.get(s, 0) + 1
            by_category[c] = by_category.get(c, 0) + 1
            if m == ActionExecutionMode.ADVISORY.value:
                advisory_count += 1
            else:
                simulated_count += 1

        completed = by_status.get(ResponseActionStatus.COMPLETED.value, 0)
        return {
            "incident_id": incident_id,
            "total_actions": total,
            "completed": completed,
            "pending": total - completed - by_status.get(ResponseActionStatus.DISMISSED.value, 0),
            "dismissed": by_status.get(ResponseActionStatus.DISMISSED.value, 0),
            "advisory_count": advisory_count,
            "simulated_count": simulated_count,
            "completion_rate": round(completed / total, 3) if total else 0.0,
            "by_status": by_status,
            "by_category": by_category,
        }
