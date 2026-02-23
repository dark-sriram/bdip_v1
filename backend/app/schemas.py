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

