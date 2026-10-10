"""SQLite Database Engine for ORION v2.

Uses Python's standard library sqlite3 with asyncio thread dispatch for robust,
zero-external-dependency asynchronous database operations.
"""

import asyncio
import logging
import sqlite3
from pathlib import Path
from typing import Any, Callable, List, Optional
from app.core.config import settings

logger = logging.getLogger("orion.database")


def _get_raw_connection() -> sqlite3.Connection:
    """Create a raw connection to SQLite with WAL mode, busy timeout, and row factory."""
    db_path = str(settings.DATABASE_PATH)
    conn = sqlite3.connect(db_path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 30000")
    conn.execute("PRAGMA cache_size = -64000")  # 64MB page cache
    return conn


def _init_tables_sync() -> None:
    """Synchronous table creation routine."""
    settings.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = _get_raw_connection()
    try:
        cursor = conn.cursor()
        # Incidents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                title TEXT NOT NULL,
                source TEXT NOT NULL,
                input_type TEXT NOT NULL,
                input_summary TEXT NOT NULL,
                threat_type TEXT NOT NULL,
                assessment TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                risk_score REAL NOT NULL,
                confidence REAL NOT NULL,
                explanation TEXT NOT NULL,
                status TEXT NOT NULL,
                analysis_run_id TEXT NOT NULL,
                evidence_json TEXT NOT NULL,
                risk_drivers_json TEXT NOT NULL,
                mitre_json TEXT NOT NULL,
                actions_json TEXT NOT NULL,
                entities_json TEXT NOT NULL,
                metadata_json TEXT NOT NULL
            )
        """)

        # Performance Indexes for Dashboard KPIs and querying
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_timestamp ON incidents(timestamp DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_risk_level ON incidents(risk_level)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_threat_type ON incidents(threat_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_source ON incidents(source)")

        # Analysis Events / Audit Log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_events (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                input_type TEXT NOT NULL,
                source TEXT NOT NULL,
                incident_id TEXT,
                risk_score REAL NOT NULL,
                risk_level TEXT NOT NULL,
                duration_ms REAL NOT NULL,
                provider_status_json TEXT NOT NULL,
                FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE SET NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analysis_events(timestamp DESC)")

        # Response Execution Lifecycle + Audit Trail (Phase 6)
        cursor.execute("""
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
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_resp_incident ON response_executions(incident_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_resp_status ON response_executions(status)")

        conn.commit()
        logger.info(f"Initialized ORION SQLite database at {settings.DATABASE_PATH}")
    finally:
        conn.close()


async def init_db() -> None:
    """Asynchronously initialize database schema."""
    await asyncio.to_thread(_init_tables_sync)


async def execute_query(query: str, params: tuple = ()) -> List[sqlite3.Row]:
    """Execute a read query asynchronously and return all rows."""
    def _run():
        conn = _get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchall()
        finally:
            conn.close()
    return await asyncio.to_thread(_run)


async def execute_one(query: str, params: tuple = ()) -> Optional[sqlite3.Row]:
    """Execute a read query asynchronously and return a single row."""
    def _run():
        conn = _get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchone()
        finally:
            conn.close()
    return await asyncio.to_thread(_run)


async def execute_write(query: str, params: tuple = ()) -> int:
    """Execute a write/update query asynchronously and return affected row count."""
    def _run():
        conn = _get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.rowcount
        finally:
            conn.close()
    return await asyncio.to_thread(_run)
