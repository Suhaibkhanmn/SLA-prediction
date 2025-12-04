from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Any
import sqlite3
import json

router = APIRouter()

DB_PATH = "sla_logs.db"


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


class ResolvePayload(BaseModel):
    actual_sla_missed: bool
    resolution_notes: str | None = None


class ActionPayload(BaseModel):
    action_type: str
    payload: dict[str, Any] | None = None


@router.get("/alerts")
def get_alerts(
    limit: int = Query(50, le=200),
    status: str | None = Query(None, description="Filter by status: open, acknowledged, resolved"),
):
    """
    Fetch recent alerts from the database.
    
    Returns list of alerts ordered by most recent first.
    Can optionally filter by status.
    """
    with _get_conn() as conn:
        if status:
            rows = conn.execute(
                """
                SELECT id, order_id, miss_sla_proba, threshold, triggered_at,
                       status, severity, acknowledged_at, resolved_at, resolution_notes,
                       actual_sla_missed
                FROM alerts
                WHERE status = ?
                ORDER BY triggered_at DESC
                LIMIT ?
                """,
                (status, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT id, order_id, miss_sla_proba, threshold, triggered_at,
                       status, severity, acknowledged_at, resolved_at, resolution_notes,
                       actual_sla_missed
                FROM alerts
                ORDER BY triggered_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

    return [dict(r) for r in rows]


@router.post("/alerts/{alert_id}/ack")
def acknowledge_alert(alert_id: int):
    """
    Acknowledge an alert (change status from 'open' to 'acknowledged').
    """
    with _get_conn() as conn:
        cur = conn.execute(
            """
            UPDATE alerts
            SET status = 'acknowledged',
                acknowledged_at = datetime('now')
            WHERE id = ? AND status = 'open'
            """,
            (alert_id,),
        )
        conn.commit()

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found or not open")

    return {"ok": True}


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, payload: ResolvePayload):
    """
    Resolve an alert with verdict (SLA met or missed) and optional notes.
    """
    with _get_conn() as conn:
        cur = conn.execute(
            """
            UPDATE alerts
            SET status = 'resolved',
                resolved_at = datetime('now'),
                resolution_notes = ?,
                actual_sla_missed = ?
            WHERE id = ? AND status IN ('open', 'acknowledged')
            """,
            (
                payload.resolution_notes,
                1 if payload.actual_sla_missed else 0,
                alert_id,
            ),
        )
        conn.commit()

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found or already resolved")

    return {"ok": True}


@router.get("/alerts/{alert_id}/actions")
def get_actions(alert_id: int):
    """
    Return action history for a given alert.
    """
    with _get_conn() as conn:
        rows = conn.execute(
            """
            SELECT action_type, payload, created_at
            FROM alert_actions
            WHERE alert_id = ?
            ORDER BY created_at DESC
            """,
            (alert_id,),
        ).fetchall()

    return [dict(r) for r in rows]


@router.post("/alerts/{alert_id}/actions")
def create_alert_action(alert_id: int, payload: ActionPayload):
    """
    Log an automation action for an alert (e.g., REROUTE, ESCALATE, etc.).
    """
    with _get_conn() as conn:
        # Make sure alert exists
        alert = conn.execute(
            "SELECT id FROM alerts WHERE id = ?",
            (alert_id,),
        ).fetchone()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        conn.execute(
            """
            INSERT INTO alert_actions (alert_id, action_type, payload, created_at)
            VALUES (?, ?, ?, datetime('now'))
            """,
            (
                alert_id,
                payload.action_type,
                json.dumps(payload.payload) if payload.payload else None,
            ),
        )
        conn.commit()

    return {"ok": True}
