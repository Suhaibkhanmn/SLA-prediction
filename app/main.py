from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import OrderInput, PredictionOutput, Settings as SettingsSchema
from app.model import ModelService
from app.config import settings
from app.alert_engine import send_email_alert
from app.settings_store import load_settings, save_settings, get_threshold
from app.routes import alerts, stats, metrics, health, auth
from app.auth.deps import require_role
from db.db_connection import log_prediction, fetch_logs
from db.init_db import init_db

app = FastAPI(
    title="SLA Prediction API",
    version="1.0.0",
    description="Predicts SLA delays using trained ML model.",
)


@app.on_event("startup")
def on_startup() -> None:
    """
    Ensure DB schema (predictions + settings) exists before serving traffic.
    """
    init_db()


# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (tighten in production if needed)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_service = ModelService()


@app.post("/predict", response_model=PredictionOutput)
def predict(order: OrderInput):
    proba = model_service.predict(order)
    # Read threshold dynamically from database
    threshold = get_threshold()
    will_miss = proba >= threshold

    log_prediction(order, proba, will_miss)

    if will_miss:
        send_email_alert(order, proba)

    return PredictionOutput(
        order_id=order.order_id,
        miss_sla_proba=proba,
        will_miss_sla=will_miss,
    )


@app.get("/logs")
def get_logs(limit: int = 50):
    rows = fetch_logs(limit)
    return [
        {
            "order_id": r[0],
            "timestamp": r[1],
            "miss_sla_proba": r[2],
            "will_miss_sla": bool(r[3]),
            "distance": r[4],
            "items": r[5],
            "hub_load": r[6],
            "traffic": r[7],
            "weather": r[8],
            "priority": r[9],
            "carrier": r[10],
        }
        for r in rows
    ]


# ------------------------------
# SETTINGS ENDPOINTS
# ------------------------------

@app.get("/settings", response_model=SettingsSchema)
def api_get_settings() -> SettingsSchema:
    """
    Returns the current alert configuration.

    Shape matches frontend `Settings` type:
    { "threshold": 0.8, "enabled": true, "emails": ["a@x.com"] }
    """
    return SettingsSchema(**load_settings())


@app.post("/settings", response_model=SettingsSchema, dependencies=[Depends(require_role("admin"))])
def api_update_settings(payload: SettingsSchema) -> SettingsSchema:
    """
    Updates alert configuration.

    Frontend sends 0–1 `threshold` from the slider; backend persists it and
    `get_threshold()` uses the fresh value immediately for new predictions.
    """
    # Persist using existing settings_store to avoid breaking DB format
    save_settings(payload.dict())
    return SettingsSchema(**load_settings())


# ------------------------------
# ALERTS / METRICS / HEALTH / AUTH ENDPOINTS
# ------------------------------

app.include_router(alerts.router)
app.include_router(metrics.router)
app.include_router(health.router)
app.include_router(auth.router)


# ------------------------------
# STATS ENDPOINTS
# ------------------------------

app.include_router(stats.router)