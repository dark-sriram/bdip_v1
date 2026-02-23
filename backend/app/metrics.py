from __future__ import annotations

from typing import Tuple

import pandas as pd

from .schemas import MetricSummary


def compute_core_metrics(events: pd.DataFrame) -> Tuple[MetricSummary, pd.DataFrame]:
    """
    Compute business metrics from raw event data.

    Returns:
        - MetricSummary Pydantic model
        - Session-level DataFrame (for AI layer)
    """
    sessions = (
        events.groupby("session_id")
        .agg(
            user_id=("user_id", "first"),
            device=("device", "first"),
            source=("source", "first"),
            events=("event_type", "count"),
            pages=("page", "nunique"),
            revenue=("amount", "sum"),
            converted=("converted", "max"),
        )
        .reset_index()
    )

    total_sessions = len(sessions)
    total_users = sessions["user_id"].nunique()
    total_converted = sessions["converted"].sum()

    conversion_rate = (total_converted / total_sessions) if total_sessions else 0.0

    # Device-level conversion
    def device_conv(device_name: str) -> float:
        subset = sessions[sessions["device"] == device_name]
        if subset.empty:
            return 0.0
        return subset["converted"].sum() / len(subset)

    mobile_conversion_rate = device_conv("mobile")
    desktop_conversion_rate = device_conv("desktop")

    # Simple funnel modeling using page path presence
    def has_step(session_df: pd.Series, page: str) -> bool:
        sid = session_df["session_id"]
        pages = events[events["session_id"] == sid]["page"].unique()
        return page in pages

    sessions["saw_landing"] = sessions.apply(lambda r: has_step(r, "/landing"), axis=1)
    sessions["saw_pricing"] = sessions.apply(lambda r: has_step(r, "/pricing"), axis=1)
    sessions["saw_checkout"] = sessions.apply(lambda r: has_step(r, "/checkout"), axis=1)

    funnel_base = sessions["saw_landing"].sum() or 1
    reached_pricing = sessions["saw_pricing"].sum()
    reached_checkout = sessions["saw_checkout"].sum()

    # Drop-off between landing and checkout
    funnel_dropoff_rate = 1.0 - (reached_checkout / funnel_base)

    total_revenue = sessions["revenue"].sum()
    avg_order_value = (total_revenue / total_converted) if total_converted else 0.0

    # Very simple LTV proxy: AOV * 2 (pretend 2 purchases per customer lifetime)
    est_ltv = avg_order_value * 2

    # Retention proxy: fraction of users with more than one session
    session_counts_per_user = sessions.groupby("user_id")["session_id"].nunique()
    retained_users = (session_counts_per_user > 1).sum()
    retention_rate_proxy = (retained_users / total_users) if total_users else 0.0

    # Engagement proxy: normalized events per session (0–1 scale)
    max_events = sessions["events"].max() or 1
    engagement_score = (sessions["events"].mean() / max_events) if total_sessions else 0.0

    metrics = MetricSummary(
        total_sessions=int(total_sessions),
        total_users=int(total_users),
        conversion_rate=float(round(conversion_rate, 4)),
        mobile_conversion_rate=float(round(mobile_conversion_rate, 4)),
        desktop_conversion_rate=float(round(desktop_conversion_rate, 4)),
        funnel_dropoff_rate=float(round(funnel_dropoff_rate, 4)),
        avg_order_value=float(round(avg_order_value, 2)),
        est_ltv=float(round(est_ltv, 2)),
        retention_rate_proxy=float(round(retention_rate_proxy, 4)),
        engagement_score=float(round(engagement_score, 4)),
    )

    return metrics, sessions

