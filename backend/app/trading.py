from __future__ import annotations

import random
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from .market import fetch_market_quote
from .security import get_current_user
from .schemas import (
    OrdersResponse,
    PortfolioSummaryResponse,
    QuotesResponse,
    WatchlistResponse,
)


router = APIRouter(tags=["trading"])


def stable_user_seed(user_id: int) -> int:
    # Keep deterministic per user for a consistent demo experience.
    return 100000 + (user_id * 97)


def pick_user_tickers(user_id: int, count: int) -> List[str]:
    universe = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "GOOGL", "META", "NFLX", "AMD"]
    rng = random.Random(stable_user_seed(user_id))
    rng.shuffle(universe)
    return universe[:count]


@router.get("/market/quotes", response_model=QuotesResponse)
def get_quotes(
    tickers: str = Query(..., description="Comma-separated tickers, e.g. AAPL,MSFT,TSLA"),
    _: dict = Depends(get_current_user),
) -> QuotesResponse:
    raw = [t.strip() for t in tickers.split(",") if t.strip()]
    if not raw:
        raise HTTPException(status_code=400, detail="No tickers provided.")

    # Normalize tickers for Stooq; also de-dupe while preserving order.
    seen = set()
    normalized: List[str] = []
    for t in raw:
        up = t.upper()
        if up in seen:
            continue
        seen.add(up)
        normalized.append(up)

    quotes = [fetch_market_quote(t) for t in normalized]
    return QuotesResponse(quotes=quotes)


@router.get("/watchlist", response_model=WatchlistResponse)
def get_watchlist(_: dict = Depends(get_current_user)) -> WatchlistResponse:
    user_id = int(_.get("id"))
    tickers = pick_user_tickers(user_id, count=5)
    return WatchlistResponse(tickers=tickers)


@router.get("/portfolio/summary", response_model=PortfolioSummaryResponse)
def get_portfolio_summary(_: dict = Depends(get_current_user)) -> PortfolioSummaryResponse:
    user_id = int(_.get("id"))
    tickers = pick_user_tickers(user_id, count=4)
    rng = random.Random(stable_user_seed(user_id) + 7)

    holdings = []
    totals = {"market_value": 0.0, "pnl": 0.0}

    for t in tickers:
        quote = fetch_market_quote(t)
        # Demo sizing: quantity between 1 and 15 (fractional permitted)
        qty = round(rng.uniform(1, 15), 2)
        # Assume avg_price is slightly different from current price
        avg_price = round(quote.price * rng.uniform(0.85, 1.15), 2)
        cost_basis = round(avg_price * qty, 2)
        market_value = round(quote.price * qty, 2)
        pnl = round(market_value - cost_basis, 2)
        pnl_pct = round((pnl / cost_basis) if cost_basis else 0.0, 4)

        holdings.append(
            {
                "ticker": quote.ticker,
                "quantity": qty,
                "avg_price": avg_price,
                "current_price": quote.price,
                "market_value": market_value,
                "cost_basis": cost_basis,
                "pnl": pnl,
                "pnl_pct": pnl_pct,
            }
        )
        totals["market_value"] += market_value
        totals["pnl"] += pnl

    totals["pnl_pct"] = round(
        (totals["pnl"] / (totals["market_value"] - totals["pnl"])) if totals["market_value"] else 0.0,
        4,
    )
    return PortfolioSummaryResponse(holdings=holdings, totals=totals)


@router.get("/orders", response_model=OrdersResponse)
def get_orders(_: dict = Depends(get_current_user)) -> OrdersResponse:
    user_id = int(_.get("id"))
    rng = random.Random(stable_user_seed(user_id) + 33)

    tickers = pick_user_tickers(user_id, count=5)
    sides = ["BUY", "SELL"]
    statuses = ["FILLED", "FILLED", "FILLED", "CANCELLED"]

    orders = []
    for i in range(8):
        ticker = rng.choice(tickers)
        quote = fetch_market_quote(ticker)
        side = rng.choice(sides)
        qty = round(rng.uniform(1, 12), 2)
        price = round(quote.price * rng.uniform(0.98, 1.02), 2)
        status = rng.choice(statuses)
        orders.append(
            {
                "id": f"ORD-{user_id}-{i+1}",
                "ticker": quote.ticker,
                "side": side,
                "quantity": qty,
                "price": price,
                "status": status,
                "created_at": "2026-03-30 06:00:00",
            }
        )

    return OrdersResponse(orders=orders)

