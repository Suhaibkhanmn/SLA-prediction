import numpy as np 
import pandas as pd  
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from pathlib import Path 
import joblib
from datetime import datetime, timedelta
import random

# Generate a synthetic training dataset for the XGBoost model

def generate_dataset(n=5000):
    rows = []
    now = datetime.now()

    for _ in range(n):
        created = now - timedelta(minutes=random.randint(1, 120))
        promised = created + timedelta(minutes=random.randint(15, 45))

        #Traffic (skewed realistic distribution)
        traffic = np.random.choice(
            [np.random.uniform(0.1, 0.4),
             np.random.uniform(0.4, 0.7),
             np.random.uniform(0.7, 1.0)],
            p=[0.4, 0.4, 0.2]
        )

        # Hub Load (skew normal somewhat centered) 
        hub_load = float(np.clip(np.random.normal(0.5, 0.2), 0.1, 1.0))

        # Distance (skew to low range like real hyperlocal deliveries) 
        distance = float(np.clip(np.random.normal(2.5, 1), 0.5, 8))

        items = int(np.clip(np.random.normal(4, 2), 1, 12))

        weather = np.random.choice(["CLEAR", "CLOUDS", "RAIN"], p=[0.7, 0.2, 0.1])
        priority = np.random.choice(["LOW", "NORMAL", "HIGH"], p=[0.1, 0.7, 0.2])
        carrier = np.random.choice(["BIKE", "SCOOTER", "CAR", "VAN"], p=[0.5, 0.3, 0.15, 0.05])

        #Peak hour multiplier
        hour = created.hour
        peak_factor = 1.0 if hour in [18,19,20,21,22] else 0.0

        # Base Risk Formula
        risk = (
            0.35 * hub_load +
            0.35 * traffic +
            0.20 * (distance / 8) +
            0.10 * peak_factor
        )

        # Weather impact
        if weather == "RAIN":
            risk += 0.1
        elif weather == "CLOUDS":
            risk += 0.03

        # Carrier speed factor
        carrier_map = {"BIKE": 0, "SCOOTER": 0.02, "CAR": 0.05, "VAN": 0.08}
        risk += carrier_map[carrier]

        # Priority effect (tight SLA → higher risk)
        if priority == "HIGH":
            risk += 0.05

        # Random noise to avoid deterministic patterns
        risk += np.random.normal(0, 0.05)

        # Clip to 0–1
        risk = np.clip(risk, 0, 1)

        # Label (miss SLA)
        miss_sla = 1 if risk > 0.55 else 0

        rows.append([
            created, promised, distance, items, hub_load, traffic,
            weather, priority, carrier, miss_sla
        ])

    df = pd.DataFrame(rows, columns=[
        "created_at", "promised_at", "distance_km", "items_count",
        "hub_load", "traffic_index", "weather_code", "priority",
        "carrier", "miss_sla"
    ])

    return df


# Train and persist the XGBoost model

def train_xgb():
    df=generate_dataset(6000)

    df["weather_code"] = df["weather_code"].map({"CLEAR":0, "CLOUDS":1, "RAIN":2})
    df["priority"] = df["priority"].map({"LOW":0, "NORMAL":1, "HIGH":2})
    df["carrier"]  = df["carrier"].map({"BIKE":0, "SCOOTER":1, "CAR":2, "VAN":3})

    now = datetime.now()
    df["age_min"] = (now - df["created_at"]).dt.seconds / 60
    df["promise_delta_min"] = (df["promised_at"] - now).dt.seconds / 60

    X = df[[
        "age_min","promise_delta_min","distance_km","items_count",
        "hub_load","traffic_index","weather_code","priority","carrier"
    ]].values

    y = df["miss_sla"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = XGBClassifier(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="logloss",
        n_jobs=-1,
        tree_method="hist"   
    )

    model.fit(X_train, y_train)

    preds = model.predict_proba(X_test)[:,1]
    auc = roc_auc_score(y_test, preds)

    print(f"\nXGBoost AUC: {auc:.4f}\n")

    Path("models").mkdir(exist_ok=True)
    joblib.dump(model, "models/xgb_model.pkl")
    print("Saved → models/xgb_model.pkl")


if __name__ == "__main__":
    train_xgb()