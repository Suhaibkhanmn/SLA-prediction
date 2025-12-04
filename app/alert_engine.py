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

    # Load live alert settings from DB
    ui_settings = load_settings()
    enabled = ui_settings.get("enabled", True)
    emails = ui_settings.get("emails") or []

    if not enabled:
        print("[INFO] Email alerts disabled in settings. Skipping.")
        return

    # Derive recipients from DB settings (comma-separated list in a single field)
    recipients = [e.strip() for e in emails if isinstance(e, str) and e.strip()]

    # Skip if SMTP not configured or no recipients
    if not (
        settings.EMAIL_FROM
        and settings.SMTP_USERNAME
        and settings.SMTP_PASSWORD
        and recipients
    ):
        print("[WARN] Email alerts not fully configured (SMTP or recipients missing). Skipping.")
        return

    # --- Throttling: Prevent Gmail from blocking ---
    time.sleep(1)  # <= limits to 1 email/sec

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

        # Derive severity based on probability (aligned with existing risk bands)
        # High:  p >= 0.8
        # Medium: 0.5 < p < 0.8
        # Low:   p <= 0.5
        if probability >= 0.8:
            severity = "high"
        elif probability > 0.5:
            severity = "medium"
        else:
            severity = "low"

        # Log alert to database with status='open' and computed severity
        try:
            threshold = get_threshold()
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO alerts (order_id, miss_sla_proba, threshold, triggered_at, status, severity)
                VALUES (?, ?, ?, datetime('now'), 'open', ?)
                """,
                (order.order_id, probability, threshold, severity),
            )
            conn.commit()
            conn.close()
        except Exception as db_err:
            # Don't crash if DB logging fails
            print(f"[WARN] Failed to log alert to DB for order {order.order_id}: {db_err}")

    except Exception as e:
        # IMPORTANT: Do NOT crash the API
        print(f"[ERROR] Failed to send email for order {order.order_id}: {e}")
