import sqlite3
from datetime import datetime 

DB_PATH = "sla_logs.db"

def log_prediction(order,proba: float,will_miss: bool):
    conn=sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO predictions (
            order_id, timestamp, miss_sla_proba, will_miss_sla,
            distance, items, hub_load, traffic, weather, priority, carrier
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order.order_id,
        datetime.now().isoformat(),
        float(proba),
        int(will_miss),
        order.distance_km,
        order.items_count,
        order.hub_load,
        order.traffic_index,
        order.weather_code,
        order.priority,
        order.carrier
    ))

    conn.commit()
    conn.close()

def fetch_logs(limit=50):
    conn=sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
         SELECT order_id, timestamp, miss_sla_proba, will_miss_sla,
               distance, items, hub_load, traffic, weather, priority, carrier
        FROM predictions
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows=cursor.fetchall()
    conn.close()
    return rows