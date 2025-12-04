from fastapi import APIRouter
import sqlite3

from app.settings_store import load_settings

router = APIRouter()

DB_PATH = "sla_logs.db"


@router.get("/health")
def health():
    """
    Basic system health check:
    - api: always ok if route is reachable
    - db: ok/fail based on DB connectivity
    - settings: ok/fail based on settings load
    """

    # DB check
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute("SELECT 1")
        conn.close()
        db = "ok"
    except Exception:
        db = "fail"

    # settings check
    try:
        load_settings()
        config = "ok"
    except Exception:
        config = "fail"

    return {"api": "ok", "db": db, "settings": config}
