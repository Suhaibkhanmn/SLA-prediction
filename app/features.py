import numpy as np
from datetime import datetime, timezone

WEATHER_MAP = {"CLEAR": 0, "CLOUDS": 1, "RAIN": 2}
PRIORITY_MAP = {"LOW": 0, "NORMAL": 1, "HIGH": 2}
CARRIER_MAP  = {"BIKE": 0, "SCOOTER": 1, "CAR": 2, "VAN": 3}

def to_minutes(dt: datetime):
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.timestamp() / 60

def build_feature_vector(order):
    created = order.created_at
    promised = order.promised_at
    now = datetime.now(timezone.utc)

    age_min = to_minutes(now) - to_minutes(created)
    promise_delta_min = to_minutes(promised) - to_minutes(now)

    weather = WEATHER_MAP.get(order.weather_code.upper(), 0)
    priority = PRIORITY_MAP.get(order.priority.upper(), 1)
    carrier = CARRIER_MAP.get(order.carrier.upper(), 0)

    x = np.array([
        age_min,
        promise_delta_min,
        float(order.distance_km),
        float(order.items_count),
        float(order.hub_load),
        float(order.traffic_index),
        float(weather),
        float(priority),
        float(carrier)
    ], dtype=np.float32)

    return x
