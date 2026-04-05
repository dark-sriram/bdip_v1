from __future__ import annotations

import re
from typing import Any

from .schemas import MetricSummary, AISummary, NLQueryResponse


# keyword → handler mapping
_PATTERNS: list[tuple[list[str], str]] = [
    (["revenue", "sales", "money", "income", "earn"], "revenue"),
    (["conversion", "convert", "converted", "cvr"], "conversion"),
    (["churn", "retention", "retain", "return", "loyal"], "retention"),
    (["mobile", "phone", "smartphone"], "mobile"),
    (["desktop", "laptop", "computer"], "desktop"),
    (["funnel", "drop", "dropoff", "abandon"], "funnel"),
    (["engagement", "engage", "interact", "active"], "engagement"),
    (["ltv", "lifetime", "value", "customer value"], "ltv"),
    (["session", "visit", "traffic", "user"], "sessions"),
    (["recommend", "suggest", "action", "what should"], "recommendations"),
    (["alert", "warning", "critical", "problem", "issue"], "alerts"),
    (["best", "top", "highest", "performing", "channel", "source"], "top_source"),
    (["aov", "average order", "order value", "basket"], "aov"),
]


def _match_topic(question: str) -> str:
    q = question.lower()
    for keywords, topic in _PATTERNS:
        if any(kw in q for kw in keywords):
            return topic
    return "general"


def answer_nl_query(
    question: str,
    metrics: MetricSummary,
    ai: AISummary,
) -> NLQueryResponse:
    topic = _match_topic(question)
    data: dict[str, Any] = {}
    sql_eq: str | None = None
    confidence = 0.85

    if topic == "revenue":
        answer = (
            f"Total revenue from the current dataset is **${metrics.total_revenue:,.2f}**. "
            f"Average order value is **${metrics.avg_order_value:,.2f}** across "
            f"{metrics.total_conversions} conversions. "
            f"Estimated customer lifetime value (LTV) is **${metrics.est_ltv:,.2f}**."
        )
        data = {
            "total_revenue": metrics.total_revenue,
            "avg_order_value": metrics.avg_order_value,
            "est_ltv": metrics.est_ltv,
            "total_conversions": metrics.total_conversions,
        }
        sql_eq = "SELECT SUM(amount) AS revenue, AVG(amount) AS aov FROM events WHERE converted = 1"

    elif topic == "conversion":
        answer = (
            f"Overall conversion rate is **{metrics.conversion_rate:.2%}**. "
            f"Mobile converts at **{metrics.mobile_conversion_rate:.2%}** vs "
            f"desktop at **{metrics.desktop_conversion_rate:.2%}**. "
            f"AI model predicts an average conversion probability of "
            f"**{ai.avg_conversion_probability:.2%}** across active sessions."
        )
        data = {
            "conversion_rate": metrics.conversion_rate,
            "mobile_conversion_rate": metrics.mobile_conversion_rate,
            "desktop_conversion_rate": metrics.desktop_conversion_rate,
            "ai_conversion_probability": ai.avg_conversion_probability,
        }
        sql_eq = "SELECT COUNT(*) FILTER (WHERE converted=1) * 1.0 / COUNT(*) AS cvr FROM sessions"

    elif topic == "retention":
        risk_label = "high" if ai.high_risk_churn_share > 0.4 else "moderate" if ai.high_risk_churn_share > 0.25 else "low"
        answer = (
            f"Retention rate proxy (users with >1 session) is **{metrics.retention_rate_proxy:.2%}**. "
            f"The AI model flags **{ai.high_risk_churn_share:.2%}** of sessions as high churn risk — "
            f"that's a **{risk_label}** risk level. "
            f"{'Consider re-engagement campaigns for these cohorts.' if risk_label != 'low' else 'Churn risk appears manageable.'}"
        )
        data = {
            "retention_rate": metrics.retention_rate_proxy,
            "high_risk_churn_share": ai.high_risk_churn_share,
            "risk_level": risk_label,
        }
        sql_eq = "SELECT COUNT(DISTINCT user_id) FILTER (WHERE sessions > 1) * 1.0 / COUNT(DISTINCT user_id) FROM users"

    elif topic == "mobile":
        gap = metrics.desktop_conversion_rate - metrics.mobile_conversion_rate
        answer = (
            f"Mobile conversion rate is **{metrics.mobile_conversion_rate:.2%}**, "
            f"which is {gap:.2%} below desktop ({metrics.desktop_conversion_rate:.2%}). "
            f"{'This gap is significant and warrants a mobile UX audit.' if gap > 0.01 else 'Mobile performance is close to desktop — no urgent action needed.'}"
        )
        data = {
            "mobile_conversion_rate": metrics.mobile_conversion_rate,
            "desktop_conversion_rate": metrics.desktop_conversion_rate,
            "gap": gap,
        }
        sql_eq = "SELECT device, AVG(converted) AS cvr FROM sessions GROUP BY device"

    elif topic == "desktop":
        answer = (
            f"Desktop conversion rate is **{metrics.desktop_conversion_rate:.2%}**, "
            f"compared to mobile at **{metrics.mobile_conversion_rate:.2%}**."
        )
        data = {
            "desktop_conversion_rate": metrics.desktop_conversion_rate,
            "mobile_conversion_rate": metrics.mobile_conversion_rate,
        }
        sql_eq = "SELECT device, AVG(converted) AS cvr FROM sessions GROUP BY device"

    elif topic == "funnel":
        answer = (
            f"The funnel drop-off rate (landing → checkout) is **{metrics.funnel_dropoff_rate:.2%}**. "
            f"{'This is above the 40% benchmark — review your pricing/feature pages for friction.' if metrics.funnel_dropoff_rate > 0.4 else 'Drop-off is within acceptable range.'}"
        )
        data = {"funnel_dropoff_rate": metrics.funnel_dropoff_rate}
        sql_eq = "SELECT 1 - (checkout_sessions * 1.0 / landing_sessions) AS dropoff FROM funnel_summary"

    elif topic == "engagement":
        label = "high" if metrics.engagement_score >= 0.6 else "moderate" if metrics.engagement_score >= 0.4 else "low"
        answer = (
            f"Engagement score is **{metrics.engagement_score:.2f}** (0–1 scale) — classified as **{label}**. "
            f"This is computed from events-per-session normalized across all sessions. "
            f"{'Improve on-site content and interactive elements to lift engagement.' if label == 'low' else 'Engagement is healthy.'}"
        )
        data = {"engagement_score": metrics.engagement_score, "level": label}
        sql_eq = "SELECT AVG(event_count) / MAX(event_count) AS engagement FROM sessions"

    elif topic == "ltv":
        answer = (
            f"Estimated customer LTV is **${metrics.est_ltv:,.2f}** "
            f"(proxy: AOV × 2 purchase cycles). "
            f"Average order value driving this is **${metrics.avg_order_value:,.2f}**. "
            f"To increase LTV: focus on repeat purchase rates, upsell paths, and subscription models."
        )
        data = {"est_ltv": metrics.est_ltv, "avg_order_value": metrics.avg_order_value}
        sql_eq = "SELECT AVG(revenue) * 2 AS estimated_ltv FROM user_summary"

    elif topic == "sessions":
        answer = (
            f"There are **{metrics.total_sessions:,} sessions** from **{metrics.total_users:,} unique users** "
            f"in the current dataset. "
            f"Of these, **{metrics.total_conversions:,} converted** ({metrics.conversion_rate:.2%} CVR). "
            f"Sessions per user: {metrics.total_sessions / max(metrics.total_users, 1):.1f} on average."
        )
        data = {
            "total_sessions": metrics.total_sessions,
            "total_users": metrics.total_users,
            "total_conversions": metrics.total_conversions,
        }
        sql_eq = "SELECT COUNT(*) AS sessions, COUNT(DISTINCT user_id) AS users FROM sessions"

    elif topic == "aov":
        answer = (
            f"Average order value (AOV) is **${metrics.avg_order_value:,.2f}** "
            f"across {metrics.total_conversions} successful conversions. "
            f"Total revenue is **${metrics.total_revenue:,.2f}**."
        )
        data = {
            "avg_order_value": metrics.avg_order_value,
            "total_revenue": metrics.total_revenue,
            "total_conversions": metrics.total_conversions,
        }
        sql_eq = "SELECT SUM(amount)/COUNT(*) AS aov FROM events WHERE converted=1"

    elif topic == "top_source":
        src = ai.top_converting_source or "unknown"
        dev = ai.top_converting_device or "unknown"
        answer = (
            f"The **top converting source** is **{src}** and the **top converting device** is **{dev}**, "
            f"based on AI analysis of session-level conversion patterns. "
            f"Consider increasing budget allocation to {src} and optimizing for {dev}."
        )
        data = {"top_source": src, "top_device": dev}
        sql_eq = "SELECT source, AVG(converted) AS cvr FROM sessions GROUP BY source ORDER BY cvr DESC LIMIT 1"

    elif topic == "recommendations":
        answer = (
            f"The AI decision engine has analyzed your current metrics and identified key actions. "
            f"Current conversion rate is {metrics.conversion_rate:.2%}, "
            f"funnel drop-off is {metrics.funnel_dropoff_rate:.2%}, "
            f"and {ai.high_risk_churn_share:.2%} of sessions are high churn risk. "
            f"Visit the Recommendations section for detailed, prioritized actions."
        )
        data = {
            "conversion_rate": metrics.conversion_rate,
            "churn_risk": ai.high_risk_churn_share,
        }

    elif topic == "alerts":
        issues = []
        if metrics.conversion_rate < 0.02:
            issues.append("conversion rate is critically low")
        if metrics.funnel_dropoff_rate > 0.55:
            issues.append("funnel drop-off is very high")
        if ai.high_risk_churn_share > 0.45:
            issues.append("churn risk is elevated")
        if metrics.retention_rate_proxy < 0.15:
            issues.append("retention is critically low")

        if issues:
            answer = f"**{len(issues)} active issue(s) detected:** " + "; ".join(issues) + ". Check the Alerts page for full details and thresholds."
        else:
            answer = "No critical alerts are currently triggered. All key metrics are within acceptable thresholds."
        data = {"issues": issues}

    else:
        confidence = 0.60
        answer = (
            f"Here's a summary of your current business performance: "
            f"**{metrics.total_sessions:,} sessions**, **{metrics.conversion_rate:.2%} conversion rate**, "
            f"**${metrics.total_revenue:,.2f} total revenue**, "
            f"**{metrics.retention_rate_proxy:.2%} retention**. "
            f"Try asking about specific metrics like 'What is my conversion rate?' or "
            f"'Why is churn high?' for more detailed answers."
        )
        data = {
            "total_sessions": metrics.total_sessions,
            "conversion_rate": metrics.conversion_rate,
            "total_revenue": metrics.total_revenue,
        }

    return NLQueryResponse(
        question=question,
        answer=answer,
        supporting_data=data,
        sql_equivalent=sql_eq,
        confidence=confidence,
    )
