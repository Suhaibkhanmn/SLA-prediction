from fastapi import APIRouter
import sqlite3

router = APIRouter()

DB_PATH = "sla_logs.db"


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@router.get("/stats/ops")
def operational_metrics():
    """
    Operational KPIs for alerts.
    """
    with _conn() as conn:
        total_alerts = conn.execute(
            "SELECT COUNT(*) AS c FROM alerts"
        ).fetchone()["c"]

        resolved = conn.execute(
            "SELECT COUNT(*) AS c FROM alerts WHERE status = 'resolved'"
        ).fetchone()["c"]

        row = conn.execute(
            """
            SELECT AVG(
                (strftime('%s', resolved_at) - strftime('%s', triggered_at))
            ) AS avg_response
            FROM alerts
            WHERE resolved_at IS NOT NULL
            """
        ).fetchone()
        avg_response = row["avg_response"] or 0

        false_positives = conn.execute(
            """
            SELECT COUNT(*) AS c
            FROM alerts
            WHERE status = 'resolved' AND actual_sla_missed = 0
            """
        ).fetchone()["c"]

    return {
        "total_alerts": total_alerts,
        "resolved": resolved,
        "resolution_rate": round(resolved / total_alerts * 100, 2)
        if total_alerts
        else 0,
        "mean_response_time_sec": int(avg_response),
        "false_positive_rate": round(false_positives / resolved * 100, 2)
        if resolved
        else 0,
    }


