from fastapi import APIRouter, Query
import sqlite3
from datetime import datetime

router = APIRouter()

DB_PATH = "sla_logs.db"


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@router.get("/stats/today")
def stats_today():
    """
    Get statistics for all predictions (not just today):
    - total predictions (all time)
    - high risk count
    - risk percentage
    - hourly breakdown (for today only)
    """
    today = datetime.utcnow().strftime("%Y-%m-%d")

    with _get_conn() as conn:
        # Total predictions (ALL TIME - no date filter)
        total_row = conn.execute(
            """
            SELECT COUNT(*) AS c FROM predictions
            """
        ).fetchone()
        total = total_row["c"] if total_row else 0

        # High risk count (will_miss_sla = 1) - ALL TIME
        high_risk_row = conn.execute(
            """
            SELECT COUNT(*) AS c FROM predictions
            WHERE will_miss_sla = 1
            """
        ).fetchone()
        high_risk = high_risk_row["c"] if high_risk_row else 0

        # Medium risk (0.5 < proba < 0.8) - ALL TIME
        medium_risk_row = conn.execute(
            """
            SELECT COUNT(*) AS c FROM predictions
            WHERE miss_sla_proba > 0.5
              AND miss_sla_proba < 0.8
            """
        ).fetchone()
        medium_risk = medium_risk_row["c"] if medium_risk_row else 0

        # Low risk (proba <= 0.5) - ALL TIME
        low_risk = total - high_risk - medium_risk

        # Hourly breakdown (for today only - for the chart)
        hourly = conn.execute(
            """
            SELECT strftime('%H', timestamp) AS hour,
                   COUNT(*) AS total,
                   SUM(will_miss_sla) AS risky
            FROM predictions
            WHERE strftime('%Y-%m-%d', timestamp) = ?
            GROUP BY hour
            ORDER BY hour
            """,
            (today,),
        ).fetchall()

    risk_pct = round((high_risk / total) * 100, 2) if total else 0

    return {
        "date": today,
        "total_predictions": total,
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "low_risk": low_risk,
        "risk_percent": risk_pct,
        "hourly": [dict(h) for h in hourly],
        "accuracy": 94.2,  # Placeholder - can be calculated from actual data later
    }


@router.get("/stats/trends")
def stats_trends(days: int = Query(7, ge=1, le=30)):
    """
    Get trend statistics for the last N days.
    
    Returns daily aggregates:
    - day (date)
    - total predictions
    - risky count
    - average risk probability
    """
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    with _get_conn() as conn:
        rows = conn.execute(
            """
            SELECT strftime('%Y-%m-%d', timestamp) AS day,
                   COUNT(*) AS total,
                   SUM(will_miss_sla) AS risky,
                   ROUND(AVG(miss_sla_proba), 3) AS avg_risk
            FROM predictions
            GROUP BY day
            ORDER BY day DESC
            LIMIT ?
            """,
            (days,),
        ).fetchall()

        # Format for frontend - convert to hourly format if needed
        # For now, return raw daily data and let frontend transform
        daily_data = [dict(r) for r in rows]

        # Also provide hourly data for the last 24 hours (for the chart)
        # Show ALL high-risk predictions (will_miss_sla = 1) by hour for last 24h
        hourly_rows = conn.execute(
            """
            SELECT strftime('%H:00', timestamp) AS time,
                   COUNT(*) AS risk
            FROM predictions
            WHERE timestamp >= datetime('now', '-24 hours')
              AND will_miss_sla = 1
            GROUP BY strftime('%H', timestamp)
            ORDER BY time
            """,
        ).fetchall()

        # Convert to dict for easier lookup
        hourly_dict = {r["time"]: r["risk"] for r in hourly_rows}
        
        # Fill in all 24 hours (00:00 to 23:00) with zeros where no data exists
        # This ensures the chart shows a complete timeline even if most hours have zero high-risk orders
        hourly = []
        for hour in range(24):
            time_str = f"{hour:02d}:00"
            risk = hourly_dict.get(time_str, 0)
            hourly.append({"time": time_str, "risk": risk})

        # Risk distribution (for pie chart)
        risk_dist_rows = conn.execute(
            """
            SELECT 
                CASE 
                    WHEN miss_sla_proba >= 0.8 THEN 'High Risk'
                    WHEN miss_sla_proba > 0.5 THEN 'Medium Risk'
                    ELSE 'Low Risk'
                END AS name,
                COUNT(*) AS value
            FROM predictions
            WHERE strftime('%Y-%m-%d', timestamp) >= strftime('%Y-%m-%d', 'now', '-' || ? || ' days')
            GROUP BY name
            """,
            (days,),
        ).fetchall()

        risk_distribution = []
        colors = {"High Risk": "#EF4444", "Medium Risk": "#F59E0B", "Low Risk": "#10B981"}
        for row in risk_dist_rows:
            risk_distribution.append(
                {
                    "name": row["name"],
                    "value": row["value"],
                    "color": colors.get(row["name"], "#6366f1"),
                }
            )

        # Carrier performance (placeholder structure - can be enhanced with real data)
        carrier_rows = conn.execute(
            """
            SELECT 
                carrier,
                COUNT(*) AS total,
                SUM(will_miss_sla) AS delayed
            FROM predictions
            WHERE strftime('%Y-%m-%d', timestamp) >= strftime('%Y-%m-%d', 'now', '-' || ? || ' days')
              AND carrier IS NOT NULL
            GROUP BY carrier
            """,
            (days,),
        ).fetchall()

        carrier_performance = []
        for row in carrier_rows:
            total = row["total"]
            delayed = row["delayed"] or 0
            on_time = total - delayed
            carrier_performance.append(
                {
                    "name": row["carrier"] or "Unknown",
                    "onTime": round((on_time / total) * 100, 1) if total > 0 else 0,
                    "delayed": round((delayed / total) * 100, 1) if total > 0 else 0,
                }
            )

    return {
        "hourly": hourly,
        "risk_distribution": risk_distribution,
        "carrier_performance": carrier_performance,
        "daily": daily_data,  # Additional daily trend data
    }

