import smtplib
import ssl
import time
import sqlite3
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings
from app.settings_store import get_threshold, load_settings

DB_PATH = "sla_logs.db"


def send_email_alert(order, probability: float) -> None:
    """Send an SLA alert email for a single order if email alerts are enabled."""

    # Derive severity based on probability (aligned with existing risk bands)
    if probability >= 0.8:
        severity = "high"
    elif probability > 0.5:
        severity = "medium"
    else:
        severity = "low"

    # ALWAYS log alert to DB first (even if email fails)
    # This ensures alerts appear in UI even if SMTP is misconfigured
    threshold = get_threshold()
    alert_logged = False
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # Check if alert already exists for this order_id to prevent duplicates
        cursor.execute(
            "SELECT id FROM alerts WHERE order_id = ? AND status != 'resolved'",
            (order.order_id,),
        )
        existing = cursor.fetchone()
        
        if not existing:
            cursor.execute(
                """
                INSERT INTO alerts (order_id, miss_sla_proba, threshold, triggered_at, status, severity)
                VALUES (?, ?, ?, datetime('now'), 'open', ?)
                """,
                (order.order_id, probability, threshold, severity),
            )
            conn.commit()
            alert_logged = True
            print(f"[ALERT] Logged alert for order {order.order_id} (risk={probability:.2f}, severity={severity})")
        else:
            print(f"[INFO] Alert already exists for order {order.order_id}, skipping duplicate")
        conn.close()
    except Exception as db_err:
        print(f"[ERROR] Failed to log alert to DB for order {order.order_id}: {db_err}")
        # Continue anyway - try to send email even if DB logging failed

    # Load live alert settings from DB
    ui_settings = load_settings()
    enabled = ui_settings.get("enabled", True)
    emails = ui_settings.get("emails") or []

    if not enabled:
        print("[INFO] Email alerts disabled in settings. Alert logged to DB but email skipped.")
        return

    # Derive recipients from DB settings (comma-separated list in a single field)
    recipients = [e.strip() for e in emails if isinstance(e, str) and e.strip()]

    # Skip if SMTP not configured or no recipients
    missing = []
    if not settings.EMAIL_FROM:
        missing.append("EMAIL_FROM")
    if not settings.SMTP_USERNAME:
        missing.append("SMTP_USERNAME")
    if not settings.SMTP_PASSWORD:
        missing.append("SMTP_PASSWORD")
    if not recipients:
        missing.append("recipients")
    
    if missing:
        print(f"[WARN] Email alerts not fully configured. Missing: {', '.join(missing)}. Alert logged to DB but email skipped.")
        return

    # Send email (don't block API with sleep - email sending is async-friendly)
    subject = f"[SLA Alert] Order {order.order_id} risk={probability:.2f}"

    body = f"""SLA Miss Risk Alert

order ID: {order.order_id}
Risk Probability: {probability:.2f}

distance_km: {order.distance_km}
items_count: {order.items_count}
hub_load: {order.hub_load}
traffic_index: {order.traffic_index}
weather_code: {order.weather_code}
priority: {order.priority}
carrier: {order.carrier}
"""

    email_from = settings.EMAIL_FROM

    msg = MIMEMultipart()
    msg["From"] = email_from
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    context = ssl.create_default_context()

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls(context=context)
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(email_from, recipients, msg.as_string())

        print(f"[ALERT] Email sent for order {order.order_id} (risk={probability:.2f})")

    except Exception as e:
        # IMPORTANT: Do NOT crash the API
        # Alert is already logged, so UI will still show it
        print(f"[ERROR] Failed to send email for order {order.order_id}: {e}")
        print(f"[INFO] Alert was logged to DB, so it will appear in UI despite email failure")
