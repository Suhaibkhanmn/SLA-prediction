import sqlite3


DB_PATH = "sla_logs.db"


def init_db():
    """
    Initialize the SQLite database.

    - Ensures `predictions` table exists (and has `alert_sent` column for alert engine)
    - Ensures singleton row in `settings` table with sane defaults
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Predictions table (used by logging + potential alert engine)
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT,
            timestamp TEXT,
            miss_sla_proba REAL,
            will_miss_sla INTEGER,
            alert_sent INTEGER DEFAULT 0,
            distance REAL,
            items INTEGER,
            hub_load REAL,
            traffic REAL,
            weather TEXT,
            priority TEXT,
            carrier TEXT
        )
        """
    )

    # Backfill `alert_sent` for older DBs that don't have the column yet
    try:
        cursor.execute(
            "ALTER TABLE predictions ADD COLUMN alert_sent INTEGER DEFAULT 0"
        )
    except sqlite3.OperationalError:
        # Column already exists – safe to ignore
        pass

    # Settings table (single source of truth for threshold + email config)
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            threshold REAL NOT NULL,
            email_enabled INTEGER NOT NULL,
            emails TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Insert default settings if table is empty
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            """
            INSERT INTO settings (id, threshold, email_enabled, emails)
            VALUES (1, 0.80, 1, 'ops@company.com')
            """
        )

    # Alerts table (for tracking triggered alerts with verdict tracking)
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT,
            miss_sla_proba REAL,
            threshold REAL,
            triggered_at TEXT,
            status TEXT DEFAULT 'open',
            severity TEXT DEFAULT 'medium',
            acknowledged_at TEXT,
            resolved_at TEXT,
            resolution_notes TEXT,
            actual_sla_missed INTEGER
        )
        """
    )

    # Add new columns to existing alerts table if they don't exist
    try:
        cursor.execute("ALTER TABLE alerts ADD COLUMN status TEXT DEFAULT 'open'")
    except sqlite3.OperationalError:
        pass  # Column already exists

    try:
        cursor.execute("ALTER TABLE alerts ADD COLUMN severity TEXT DEFAULT 'medium'")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE alerts ADD COLUMN acknowledged_at TEXT")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE alerts ADD COLUMN resolved_at TEXT")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE alerts ADD COLUMN resolution_notes TEXT")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE alerts ADD COLUMN actual_sla_missed INTEGER")
    except sqlite3.OperationalError:
        pass

    # Alert actions table (for logging automation actions)
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS alert_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_id INTEGER NOT NULL,
            action_type TEXT NOT NULL,
            payload TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(alert_id) REFERENCES alerts(id)
        )
        """
    )

    # Users table for auth
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'operator',
            created_at TEXT NOT NULL
        )
        """
    )

    conn.commit()
    conn.close()
    print("Database initialized")


if __name__ == "__main__":
    init_db()