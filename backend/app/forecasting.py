from __future__ import annotations

import math
from typing import List

from .schemas import ForecastPoint, ForecastSummary


def _linear_trend(values: list[float]) -> tuple[float, float]:
    """Return (slope, intercept) from simple linear regression."""
    n = len(values)
    if n < 2:
        return 0.0, values[0] if values else 0.0
    xs = list(range(n))
    mean_x = sum(xs) / n
    mean_y = sum(values) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, values))
    den = sum((x - mean_x) ** 2 for x in xs)
    slope = num / den if den else 0.0
    intercept = mean_y - slope * mean_x
    return slope, intercept


def _classify_trend(change_pct: float) -> str:
    if change_pct > 2.0:
        return "up"
    if change_pct < -2.0:
        return "down"
    return "flat"


def generate_forecasts(metrics_history: dict) -> List[ForecastSummary]:
    """
    Generate 4-period ahead forecasts for key metrics.
    metrics_history contains lists of historical values keyed by metric name.
    In production these would come from a time-series DB; here we derive
    synthetic weekly snapshots from the current metrics snapshot.
    """
    results: List[ForecastSummary] = []

    for metric_key, cfg in metrics_history.items():
        values: list[float] = cfg["values"]
        labels: list[str] = cfg["labels"]
        unit: str = cfg["unit"]

        slope, intercept = _linear_trend(values)
        n = len(values)

        historical = [
            ForecastPoint(period=labels[i], value=round(values[i], 4), is_forecast=False)
            for i in range(n)
        ]

        future_labels = [f"W+{i+1}" for i in range(4)]
        forecast = []
        for i, lbl in enumerate(future_labels):
            pred = intercept + slope * (n + i)
            # Add slight damping so forecasts don't explode
            pred = max(0.0, pred * (1 - 0.01 * i))
            forecast.append(ForecastPoint(period=lbl, value=round(pred, 4), is_forecast=True))

        last_val = values[-1] if values else 0.0
        first_val = values[0] if values else 1.0
        change_pct = ((last_val - first_val) / first_val * 100) if first_val else 0.0

        results.append(
            ForecastSummary(
                metric=metric_key,
                unit=unit,
                historical=historical,
                forecast=forecast,
                trend=_classify_trend(change_pct),
                change_pct=round(change_pct, 2),
            )
        )

    return results


def build_metrics_history(base_conversion: float, base_revenue: float, base_engagement: float) -> dict:
    """
    Synthesize 8 weeks of historical data from the current snapshot.
    Applies realistic noise + slight trend so forecasts are meaningful.
    """
    import random
    rng = random.Random(42)

    def series(base: float, trend: float, noise: float, n: int = 8) -> list[float]:
        out = []
        v = base * (1 - trend * (n / 2))
        for i in range(n):
            v = v + base * trend + rng.gauss(0, noise * base)
            out.append(max(0.0, v))
        return out

    weeks = [f"W-{8-i}" for i in range(8)]

    return {
        "conversion_rate": {
            "values": series(base_conversion, 0.005, 0.04),
            "labels": weeks,
            "unit": "pct",
        },
        "weekly_revenue": {
            "values": series(base_revenue / 8, 0.01, 0.05),
            "labels": weeks,
            "unit": "usd",
        },
        "engagement_score": {
            "values": series(base_engagement, 0.003, 0.03),
            "labels": weeks,
            "unit": "score",
        },
    }
