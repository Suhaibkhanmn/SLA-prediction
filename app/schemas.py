from pydantic import BaseModel
from datetime import datetime
from typing import List


class OrderInput(BaseModel):
    order_id: str
    created_at: datetime
    promised_at: datetime
    distance_km: float
    items_count: int
    hub_load: float
    traffic_index: float
    weather_code: str = "CLEAR"
    priority: str = "NORMAL"
    carrier: str = "BIKE"


class PredictionOutput(BaseModel):
    order_id: str
    miss_sla_proba: float
    will_miss_sla: bool


class Settings(BaseModel):
    """
    API contract for /settings.

    Matches frontend `Settings` type:
    - threshold: 0–1 float (e.g. 0.9 == 90%)
    - enabled: whether email alerts are active
    - emails: list of recipient addresses
    """

    threshold: float
    enabled: bool
    emails: List[str]
