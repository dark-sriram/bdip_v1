from __future__ import annotations

from .schemas import AlertRule, AlertsPayload, MetricSummary, AISummary


ALERT_RULES: list[dict] = [
    {
        "id": "alert-conversion-critical",
        "metric": "conversion_rate",
        "condition": "below",
        "threshold": 0.02,
        "severity": "high",
        "message": "Conversion rate has dropped below 2% — immediate action required.",
    },
    {
        "id": "alert-conversion-warning",
        "metric": "conversion_rate",
        "condition": "below",
        "threshold": 0.04,
        "severity": "medium",
        "message": "Conversion rate is below 4% — review funnel performance.",
    },
    {
        "id": "alert-dropoff-high",
        "metric": "funnel_dropoff_rate",
        "condition": "above",
        "threshold": 0.55,
        "severity": "high",
        "message": "Funnel drop-off exceeds 55% — significant checkout friction detected.",
    },
    {
        "id": "alert-engagement-low",
        "metric": "engagement_score",
        "condition": "below",
        "threshold": 0.30,
        "severity": "medium",
        "message": "Engagement score below 0.30 — users are not exploring the product.",
    },
    {
        "id": "alert-retention-critical",
        "metric": "retention_rate_proxy",
        "condition": "below",
        "threshold": 0.15,
        "severity": "high",
        "message": "Retention rate below 15% — churn is unsustainable.",
    },
    {
        "id": "alert-churn-risk",
        "metric": "high_risk_churn_share",
        "condition": "above",
        "threshold": 0.45,
        "severity": "high",
        "message": "Over 45% of sessions flagged as high churn risk by AI model.",
    },
    {
        "id": "alert-mobile-gap",
        "metric": "mobile_conversion_rate",
        "condition": "below",
        "threshold": 0.015,
        "severity": "medium",
        "message": "Mobile conversion below 1.5% — mobile UX needs urgent attention.",
    },
    {
        "id": "alert-ltv-low",
        "metric": "est_ltv",
        "condition": "below",
        "threshold": 50.0,
        "severity": "low",
        "message": "Estimated LTV below $50 — consider upsell or pricing improvements.",
    },
]


def evaluate_alerts(metrics: MetricSummary, ai: AISummary) -> AlertsPayload:
    metric_map = {
        "conversion_rate": metrics.conversion_rate,
        "funnel_dropoff_rate": metrics.funnel_dropoff_rate,
        "engagement_score": metrics.engagement_score,
        "retention_rate_proxy": metrics.retention_rate_proxy,
        "mobile_conversion_rate": metrics.mobile_conversion_rate,
        "est_ltv": metrics.est_ltv,
        "high_risk_churn_share": ai.high_risk_churn_share,
    }

    evaluated: list[AlertRule] = []
    for rule in ALERT_RULES:
        current = metric_map.get(rule["metric"], 0.0)
        if rule["condition"] == "below":
            triggered = current < rule["threshold"]
        else:
            triggered = current > rule["threshold"]

        evaluated.append(
            AlertRule(
                id=rule["id"],
                metric=rule["metric"],
                condition=rule["condition"],
                threshold=rule["threshold"],
                severity=rule["severity"],
                message=rule["message"],
                triggered=triggered,
                current_value=round(current, 4),
            )
        )

    triggered_count = sum(1 for a in evaluated if a.triggered)
    return AlertsPayload(alerts=evaluated, triggered_count=triggered_count)
