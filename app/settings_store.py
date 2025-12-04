import sqlite3

DB_PATH = "sla_logs.db"

def load_settings():
    """Load settings from SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT threshold, email_enabled, emails FROM settings WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        # Return defaults if no settings found
        return {
            "threshold": 0.80,
            "enabled": True,
            "emails": ["ops@company.com"]
        }
    
    return {
        "threshold": row[0],
        "enabled": bool(row[1]),
        "emails": row[2].split(",") if row[2] else []
    }

def save_settings(data):
    """Save settings to SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Ensure settings table exists
    try:
        cursor.execute("SELECT COUNT(*) FROM settings WHERE id = 1")
    except sqlite3.OperationalError:
        # Table doesn't exist, create it
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY,
                threshold REAL NOT NULL,
                email_enabled INTEGER NOT NULL,
                emails TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    
    # Ensure settings row exists
    cursor.execute("SELECT COUNT(*) FROM settings WHERE id = 1")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO settings (id, threshold, email_enabled, emails)
            VALUES (1, ?, ?, ?)
        """, (
            data.get("threshold", 0.80),
            1 if data.get("enabled", True) else 0,
            ",".join(data.get("emails", ["ops@company.com"]))
        ))
    else:
        cursor.execute("""
            UPDATE settings
            SET threshold = ?, email_enabled = ?, emails = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        """, (
            data.get("threshold", 0.80),
            1 if data.get("enabled", True) else 0,
            ",".join(data.get("emails", ["ops@company.com"]))
        ))
    
    conn.commit()
    conn.close()

def get_threshold():
    """Get current threshold for alert engine"""
    settings = load_settings()
    return settings["threshold"]

