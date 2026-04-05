from __future__ import annotations

from typing import List, Optional, Dict, Any

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
    total_revenue: float
    total_conversions: int


class AISummary(BaseModel):
    avg_conversion_probability: float
    high_risk_churn_share: float
    notes: Optional[str] = None
    top_converting_source: Optional[str] = None
    top_converting_device: Optional[str] = None


class RecommendationInputVars(BaseModel):
    metric_name: str
    metric_value: float
    threshold: float
    direction: str


class Recommendation(BaseModel):
    id: str
    severity: str
    area: str
    problem: str
    evidence: str
    impact: str
    action: str
    confidence_score: float = 0.0
    confidence_range: str = ""
    input_variables: List[RecommendationInputVars] = []
    status: str = "pending"
    expected_outcome: Optional[str] = None


class ForecastPoint(BaseModel):
    period: str
    value: float
    is_forecast: bool = False


class ForecastSummary(BaseModel):
    metric: str
    unit: str
    historical: List[ForecastPoint]
    forecast: List[ForecastPoint]
    trend: str
    change_pct: float


class AlertRule(BaseModel):
    id: str
    metric: str
    condition: str
    threshold: float
    severity: str
    message: str
    triggered: bool = False
    current_value: float = 0.0


class AlertsPayload(BaseModel):
    alerts: List[AlertRule]
    triggered_count: int


class NLQueryRequest(BaseModel):
    question: str


class NLQueryResponse(BaseModel):
    question: str
    answer: str
    supporting_data: Dict[str, Any] = {}
    sql_equivalent: Optional[str] = None
    confidence: float = 0.0


class DashboardPayload(BaseModel):
    metrics: MetricSummary
    ai: AISummary
    recommendations: List[Recommendation]
    forecasts: List[ForecastSummary] = []
    alerts: AlertsPayload


class DecisionLogEntry(BaseModel):
    id: int
    recommendation_id: str
    action: str
    status: str
    expected_outcome: Optional[str] = None
    actual_result: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None


class DecisionApproveRequest(BaseModel):
    recommendation_id: str
    action: str
    expected_outcome: Optional[str] = None


class DecisionRejectRequest(BaseModel):
    recommendation_id: str
    reason: Optional[str] = None


class DecisionUpdateRequest(BaseModel):
    actual_result: str


class UploadResponse(BaseModel):
    rows_ingested: int
    duplicates_skipped: int
    validation_errors: List[str]
    message: str


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
