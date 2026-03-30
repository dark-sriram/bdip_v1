from __future__ import annotations

from functools import lru_cache

import pandas as pd
from datetime import datetime, timedelta, timezone
import random

from .schemas import MarketQuote, SeriesPoint


def normalize_to_stooq_symbol(ticker: str) -> str:
    # Stooq uses symbols like aapl.us
    up = ticker.strip().upper()
    if "." in up:
        # Already has suffix; keep as lower case for Stooq.
        return up.lower()
    return f"{up.lower()}.us"


@lru_cache(maxsize=512)
def fetch_market_quote(ticker: str) -> MarketQuote:
    symbol = normalize_to_stooq_symbol(ticker)

    # `i=d` returns daily OHLCV; we use the last few rows for price + sparkline.
    url = f"https://stooq.com/q/l/?s={symbol}&i=d"
    try:
        df = pd.read_csv(url)
    except Exception:
        df = None

    # Fallback to deterministic simulated data if Stooq isn't reachable.
    if df is None or df.empty:
        seed = sum(ord(c) for c in ticker.upper()) + len(ticker)
        rng = random.Random(seed)
        base_price = rng.uniform(80, 420)

        now = datetime.now(timezone.utc).date()
        dates = [now - timedelta(days=(19 - i)) for i in range(20)]
        # Create a gentle random walk for sparkline.
        price = base_price
        series_points: list[SeriesPoint] = []
        for d in dates:
            price = max(1.0, price * rng.uniform(0.985, 1.015))
            series_points.append(SeriesPoint(t=str(d), v=round(price, 4)))

        last = series_points[-1].v
        prev = series_points[-2].v if len(series_points) >= 2 else last
        day_change_pct = float((last - prev) / prev) if prev else 0.0
        return MarketQuote(
            ticker=ticker.upper(),
            price=float(last),
            day_change_pct=round(day_change_pct, 6),
            series=series_points,
        )

    # Standardize columns expected from Stooq.
    # Date columns are named "Date", prices are "Close".
    if "Date" not in df.columns or "Close" not in df.columns:
        # Same fallback behavior if format is unexpected.
        return fetch_market_quote_simulated(ticker)

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df = df.dropna(subset=["Date", "Close"]).sort_values("Date")

    # Choose a small window for exec-friendly sparkline.
    window = df.tail(20)
    if len(window) < 2:
        price = float(window["Close"].iloc[-1])
        series_points = [SeriesPoint(t=str(window["Date"].iloc[-1]), v=price)]
        return MarketQuote(ticker=ticker.upper(), price=price, day_change_pct=0.0, series=series_points)

    price = float(window["Close"].iloc[-1])
    prev = float(window["Close"].iloc[-2])
    day_change_pct = float((price - prev) / prev) if prev else 0.0

    series_points = [
        SeriesPoint(t=str(row_date.date()), v=float(close))
        for row_date, close in zip(window["Date"], window["Close"])
    ]

    return MarketQuote(
        ticker=ticker.upper(),
        price=price,
        day_change_pct=round(day_change_pct, 6),
        series=series_points,
    )


def fetch_market_quote_simulated(ticker: str) -> MarketQuote:
    seed = sum(ord(c) for c in ticker.upper()) + len(ticker)
    rng = random.Random(seed)
    base_price = rng.uniform(80, 420)

    now = datetime.now(timezone.utc).date()
    dates = [now - timedelta(days=(19 - i)) for i in range(20)]
    price = base_price
    series_points: list[SeriesPoint] = []
    for d in dates:
        price = max(1.0, price * rng.uniform(0.985, 1.015))
        series_points.append(SeriesPoint(t=str(d), v=round(price, 4)))

    last = series_points[-1].v
    prev = series_points[-2].v if len(series_points) >= 2 else last
    day_change_pct = float((last - prev) / prev) if prev else 0.0
    return MarketQuote(
        ticker=ticker.upper(),
        price=float(last),
        day_change_pct=round(day_change_pct, 6),
        series=series_points,
    )

