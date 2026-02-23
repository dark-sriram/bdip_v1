from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import pandas as pd


@lru_cache(maxsize=1)
def load_events() -> pd.DataFrame:
    """
    Load sample GA4-style events from the CSV file.

    In a production BDIP, this would be replaced by a BigQuery connector
    that pulls data from GA4 export tables or other event streams.
    """
    base_dir = Path(__file__).resolve().parents[2]
    csv_path = base_dir / "data" / "sample_events.csv"
    df = pd.read_csv(csv_path)

    # Basic typing / normalization
    df["amount"] = df["amount"].astype(float)
    df["converted"] = df["converted"].astype(int)
    return df


def build_session_level(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate raw events into a session-level table suitable for metrics & AI.
    """
    grouped = (
        df.groupby("session_id")
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
    return grouped

