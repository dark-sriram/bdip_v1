from __future__ import annotations

from typing import List

from .schemas import AISummary, MetricSummary, Recommendation


def generate_recommendations(metrics: MetricSummary, ai: AISummary) -> List[Recommendation]:
    """
    Encode business reasoning as rules that combine metrics + AI outputs.
    """
    recs: List[Recommendation] = []

    # 1) Low overall conversion
    if metrics.conversion_rate < 0.03:
        recs.append(
            Recommendation(
                id="low-overall-conversion",
                severity="high",
                area="acquisition_funnel",
                problem="Overall website conversion rate is low.",
                evidence=(
                    f"Conversion rate is {metrics.conversion_rate:.2%} across "
                    f"{metrics.total_sessions} sessions."
                ),
                impact=(
                    "Low conversion means a large share of acquired traffic is not turning into "
                    "revenue, reducing marketing ROI."
                ),
                action=(
                    "Review end-to-end funnel UX (landing → pricing → checkout), run A/B tests "
                    "on key CTAs, and simplify the path to purchase."
                ),
            )
        )

    # 2) Mobile underperforming vs desktop
    if metrics.mobile_conversion_rate + 1e-6 < metrics.desktop_conversion_rate * 0.7:
        recs.append(
            Recommendation(
                id="mobile-underperforming",
                severity="high",
                area="mobile_experience",
                problem="Mobile conversion rate significantly lags behind desktop.",
                evidence=(
                    f"Mobile conversion: {metrics.mobile_conversion_rate:.2%}; "
                    f"Desktop conversion: {metrics.desktop_conversion_rate:.2%}."
                ),
                impact=(
                    "Mobile users are abandoning the funnel at higher rates, which can cause a "
                    "meaningful revenue gap given modern mobile traffic share."
                ),
                action=(
                    "Audit mobile checkout performance (load time, responsiveness, form UX). "
                    "Prioritize mobile-specific optimizations and re-test after changes."
                ),
            )
        )

    # 3) High funnel drop-off
    if metrics.funnel_dropoff_rate > 0.4:
        recs.append(
            Recommendation(
                id="high-funnel-dropoff",
                severity="medium",
                area="funnel_design",
                problem="Significant drop-off between landing and checkout steps.",
                evidence=(
                    f"Estimated funnel drop-off rate from landing to checkout is "
                    f"{metrics.funnel_dropoff_rate:.2%}."
                ),
                impact=(
                    "Users are losing interest or facing friction before they reach checkout, "
                    "limiting revenue potential."
                ),
                action=(
                    "Analyze which step (pricing, features, or checkout) has the biggest exit "
                    "rate and focus UX/content improvements there first."
                ),
            )
        )

    # 4) Low engagement
    if metrics.engagement_score < 0.4:
        recs.append(
            Recommendation(
                id="low-engagement",
                severity="medium",
                area="product_engagement",
                problem="User engagement is relatively low.",
                evidence=(
                    f"Normalized engagement score is {metrics.engagement_score:.2f} "
                    "(0–1 scale based on events per session)."
                ),
                impact=(
                    "Low engagement reduces exposure to value propositions and increases the "
                    "chance of churn."
                ),
                action=(
                    "Improve on-site content and interaction design (clearer value messaging, "
                    "guided tours, or nudges that keep users exploring)."
                ),
            )
        )

    # 5) AI layer – high churn risk share
    if ai.high_risk_churn_share > 0.3:
        recs.append(
            Recommendation(
                id="high-churn-risk",
                severity="high",
                area="retention",
                problem="A large share of sessions are flagged as high churn risk.",
                evidence=(
                    f"AI model estimates {ai.high_risk_churn_share:.2%} of sessions have very "
                    "low probability of conversion."
                ),
                impact=(
                    "Without intervention, many users are unlikely to return or convert, which "
                    "depresses long-term LTV."
                ),
                action=(
                    "Introduce re-engagement tactics (remarketing campaigns, email flows, in-app "
                    "nudges) specifically targeted at these low-intent cohorts."
                ),
            )
        )

    # 6) AI layer – low average conversion probability
    if ai.avg_conversion_probability < 0.25:
        recs.append(
            Recommendation(
                id="low-intent-traffic",
                severity="medium",
                area="marketing_mix",
                problem="Traffic quality appears low based on predicted conversion probabilities.",
                evidence=(
                    f"Average predicted conversion probability is {ai.avg_conversion_probability:.2%}."
                ),
                impact=(
                    "Spending on low-intent traffic reduces marketing efficiency and masks "
                    "performance of high-quality channels."
                ),
                action=(
                    "Review channel mix and targeting; shift budget toward higher-intent sources "
                    "and refine audience definitions."
                ),
            )
        )

    # Fallback if no specific rules triggered
    if not recs:
        recs.append(
            Recommendation(
                id="healthy-funnel",
                severity="low",
                area="overview",
                problem="Funnel and engagement look broadly healthy.",
                evidence=(
                    f"Conversion rate: {metrics.conversion_rate:.2%}, "
                    f"Drop-off: {metrics.funnel_dropoff_rate:.2%}, "
                    f"Avg predicted conversion probability: {ai.avg_conversion_probability:.2%}."
                ),
                impact="Current performance appears stable with no critical issues detected.",
                action="Continue monitoring KPIs and AI signals; test incremental optimizations "
                "rather than large disruptive changes.",
            )
        )

    return recs

