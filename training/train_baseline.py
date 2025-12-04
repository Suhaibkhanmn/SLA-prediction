import numpy as np 
import pandas as pd 
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from pathlib import Path
import joblib
from datetime import datetime, timedelta
import random



# Generate a realistic synthetic dataset for the baseline model
def generate_dataset(n=6000):
    rows = []
    now = datetime.now()

    rush_hours = [8, 9, 10, 18, 19, 20]  # more traffic & load

    for i in range(n):

        #order timestamps
        created = now - timedelta(minutes=random.randint(5, 180))
        promised = created + timedelta(minutes=random.randint(10, 35))

  
        #delivery features
        distance = np.clip(np.random.normal(3, 1), 0.5, 8)
        items = int(np.clip(np.random.normal(5, 2), 1, 12))

        is_rush = created.hour in rush_hours

        hub_load = np.clip(
            np.random.uniform(0.5, 1.0) if is_rush else np.random.uniform(0.2, 0.8),
            0, 1
        )

        traffic = np.clip(
            np.random.uniform(0.6, 1.0) if is_rush else np.random.uniform(0.2, 0.8),
            0, 1
        )

        weather = random.choices(
            ["CLEAR", "CLOUDS", "RAIN"],
            weights=[0.6, 0.3, 0.1]
        )[0]

        priority = random.choices(
            ["LOW", "NORMAL", "HIGH"],
            weights=[0.1, 0.8, 0.1]
        )[0]

        carrier = random.choices(
            ["BIKE", "SCOOTER", "CAR", "VAN"],
            weights=[0.45, 0.35, 0.15, 0.05]
        )[0]

        #risk calculation (realistic)
        carrier_penalty = {
            "BIKE": 0.00,
            "SCOOTER": 0.05,
            "CAR": 0.12,
            "VAN": 0.25
        }

        weather_penalty = {
            "CLEAR": 0.00,
            "CLOUDS": 0.05,
            "RAIN": 0.25
        }

        sla_window = (promised - created).seconds / 60
        tight_sla_penalty = 0.30 if sla_window < 18 else 0.05

        distance_penalty = (distance / 8) * 0.30

        risk = (
            0.40 * hub_load +
            0.40 * traffic +
            distance_penalty +
            carrier_penalty[carrier] +
            weather_penalty[weather] +
            tight_sla_penalty +
            np.random.normal(0, 0.05)
        )

        miss_sla = 1 if risk > 0.65 else 0

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


# Train and persist the baseline (logistic regression) model
def train_model():
    df = generate_dataset(6000)

    # Encode categorical columns
    df["weather_code"] = df["weather_code"].map({"CLEAR":0, "CLOUDS":1, "RAIN":2})
    df["priority"] = df["priority"].map({"LOW":0, "NORMAL":1, "HIGH":2})
    df["carrier"]  = df["carrier"].map({"BIKE":0, "SCOOTER":1, "CAR":2, "VAN":3})

    # Feature engineering
    now = datetime.now()
    df["age_min"] = (now - df["created_at"]).dt.seconds / 60
    df["promise_delta_min"] = (df["promised_at"] - now).dt.seconds / 60

    X = df[[
        "age_min", "promise_delta_min", "distance_km", "items_count",
        "hub_load", "traffic_index", "weather_code", "priority", "carrier"
    ]].values

    y = df["miss_sla"].values

    # Train Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # ML Pipeline
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000))
    ])

    pipe.fit(X_train, y_train)
    preds = pipe.predict_proba(X_test)[:, 1]

    auc = roc_auc_score(y_test, preds)
    print(f"\nAUC: {auc:.3f}")

    Path("models").mkdir(exist_ok=True)
    joblib.dump(pipe, "models/baseline.pkl")

    print("\nModel saved → models/baseline.pkl\n")

if __name__ == "__main__":
    train_model()
