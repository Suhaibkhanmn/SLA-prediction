import joblib
import numpy as np
from pathlib import Path
from app.features import build_feature_vector

MODEL_PATH = Path("models/xgb_model.pkl")

class ModelService:
    def __init__(self):
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Run training first.")
        
        self.model = joblib.load(MODEL_PATH)

    def predict(self, order):
        x = build_feature_vector(order)
        x = x.reshape(1, -1)
        proba = self.model.predict_proba(x)[0][1]
        return float(proba)
