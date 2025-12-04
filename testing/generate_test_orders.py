import json
import random
from datetime import datetime, timedelta
import numpy as np
from pathlib import Path


def generate_test_order():
    now = datetime.now()
    created = now - timedelta(minutes=random.randint(1, 60))
    promised = created + timedelta(minutes=random.randint(10, 40))

    return {
        "order_id": f"T_{random.randint(10000, 99999)}",
        "created_at": created.isoformat(),
        "promised_at": promised.isoformat(),
        "distance_km": float(np.clip(np.random.normal(3, 1), 0.5, 8)),
        "items_count": random.randint(1, 12),
        "hub_load": round(random.uniform(0.1, 1.0), 2),
        "traffic_index": round(random.uniform(0.1, 1.0), 2),
        "weather_code": random.choice(["CLEAR", "CLOUDS", "RAIN"]),
        "priority": random.choice(["LOW", "NORMAL", "HIGH"]),
        "carrier": random.choice(["BIKE", "SCOOTER", "CAR", "VAN"])
    }


def generate_bulk(n=100):
    orders = [generate_test_order() for _ in range(n)]

    Path("data").mkdir(exist_ok=True)

    with open("data/test_orders.json", "w") as f:
        json.dump(orders, f, indent=2)

    print(f"Generated {n} test orders → data/test_orders.json")


if __name__ == "__main__":
    generate_bulk(100)
