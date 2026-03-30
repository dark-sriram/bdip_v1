from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class EventIn(BaseModel):
    session_id: str
    user_id: str
    timestamp: str
    page: str
    event_type: str
    device: str
    source: str
    amount: float = 0.0
    converted: int = 0


class MetricSummary(BaseModel):
    total_sessions: int
    total_users: int
    conversion_rate: float
    mobile_conversion_rate: float
    desktop_conversion_rate: float
    funnel_dropoff_rate: float
    avg_order_value: float
    est_ltv: float
    retention_rate_proxy: float
    engagement_score: float


class AISummary(BaseModel):
    avg_conversion_probability: float
    high_risk_churn_share: float
    notes: Optional[str] = None


class Recommendation(BaseModel):
    id: str
    severity: str
    area: str
    problem: str
    evidence: str
    impact: str
    action: str


class DashboardPayload(BaseModel):
    metrics: MetricSummary
    ai: AISummary
    recommendations: List[Recommendation]


# -------------------------
# Auth schemas (JWT)
# -------------------------


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthMeResponse(BaseModel):
    id: int
    email: str
    created_at: str


# -------------------------
# Trading-style UI schemas
# -------------------------


class SeriesPoint(BaseModel):
    t: str
    v: float


class MarketQuote(BaseModel):
    ticker: str
    price: float
    day_change_pct: float
    series: list[SeriesPoint]


class QuotesResponse(BaseModel):
    quotes: list[MarketQuote]


class WatchlistResponse(BaseModel):
    tickers: list[str]


class PortfolioHolding(BaseModel):
    ticker: str
    quantity: float
    avg_price: float
    current_price: float
    market_value: float
    cost_basis: float
    pnl: float
    pnl_pct: float


class PortfolioSummaryResponse(BaseModel):
    holdings: list[PortfolioHolding]
    totals: dict[str, float]


class Order(BaseModel):
    id: str
    ticker: str
    side: str  # BUY/SELL
    quantity: float
    price: float
    status: str
    created_at: str


class OrdersResponse(BaseModel):
    orders: list[Order]

