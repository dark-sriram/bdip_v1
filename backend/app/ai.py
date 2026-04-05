from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .schemas import AISummary


@dataclass
class AIEngine:
    pipeline: Pipeline | None = None

    def train(self, sessions: pd.DataFrame) -> None:
        if sessions.empty:
            self.pipeline = None
            return

        feature_cols_numeric = ["events", "pages", "revenue"]
        feature_cols_categorical = ["device", "source"]

        X = sessions[feature_cols_numeric + feature_cols_categorical].copy()
        y = sessions["converted"].astype(int)

        numeric_transformer = StandardScaler()
        categorical_transformer = OneHotEncoder(handle_unknown="ignore")

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", numeric_transformer, feature_cols_numeric),
                ("cat", categorical_transformer, feature_cols_categorical),
            ]
        )

        base_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=5,
            random_state=42,
            class_weight="balanced",
        )
        self.pipeline = Pipeline(steps=[("pre", preprocessor), ("clf", base_model)])

        if len(np.unique(y)) < 2:
            base_rate = float(y.mean())

            class DummyModel:
                def predict_proba(self, X_):
                    return np.column_stack(
                        [(1 - base_rate) * np.ones(len(X_)), base_rate * np.ones(len(X_))]
                    )

                def fit(self, X_, y_):
                    return self

            self.pipeline = Pipeline(steps=[("pre", preprocessor), ("clf", DummyModel())])
            self.pipeline.fit(X, y)
        else:
            self.pipeline.fit(X, y)

    def summarize(self, sessions: pd.DataFrame) -> AISummary:
        if self.pipeline is None or sessions.empty:
            return AISummary(
                avg_conversion_probability=0.0,
                high_risk_churn_share=0.0,
                notes="Insufficient data for AI model; using defaults.",
            )

        feature_cols_numeric = ["events", "pages", "revenue"]
        feature_cols_categorical = ["device", "source"]
        X = sessions[feature_cols_numeric + feature_cols_categorical].copy()

        proba = self.pipeline.predict_proba(X)[:, 1]
        avg_conv_prob = float(np.mean(proba))

        if len(proba):
            threshold = float(np.quantile(proba, 0.3))
            high_risk_mask = proba <= threshold
            high_risk_share = float(np.mean(high_risk_mask))
        else:
            high_risk_share = 0.0

        # Best converting source
        top_source = None
        top_device = None
        if "source" in sessions.columns and "converted" in sessions.columns:
            src_conv = sessions.groupby("source")["converted"].mean()
            if not src_conv.empty:
                top_source = str(src_conv.idxmax())
        if "device" in sessions.columns and "converted" in sessions.columns:
            dev_conv = sessions.groupby("device")["converted"].mean()
            if not dev_conv.empty:
                top_device = str(dev_conv.idxmax())

        return AISummary(
            avg_conversion_probability=float(round(avg_conv_prob, 4)),
            high_risk_churn_share=float(round(high_risk_share, 4)),
            notes=(
                "Random forest model trained on session data. "
                "Probabilities are directional signals — not exact forecasts."
            ),
            top_converting_source=top_source,
            top_converting_device=top_device,
        )
