from __future__ import annotations

from typing import List

from .schemas import AISummary, MetricSummary, Recommendation, RecommendationInputVars


def _confidence(base: float, *boosts: float) -> tuple[float, str]:
    """Clamp confidence and return (score, range_str)."""
    score = min(0.97, max(0.35, base + sum(boosts)))
    lo = max(0.0, score - 0.08)
    hi = min(1.0, score + 0.08)
    return round(score, 2), f"{int(lo*100)}%–{int(hi*100)}%"


def generate_recommendations(metrics: MetricSummary, ai: AISummary) -> List[Recommendation]:
    recs: List[Recommendation] = []

    # 1) Low overall conversion
    if metrics.conversion_rate < 0.03:
        conf, rng = _confidence(
            0.82,
            0.05 if metrics.conversion_rate < 0.015 else 0.0,
        )
        recs.append(
            Recommendation(
                id="low-overall-conversion",
                severity="high",
                area="acquisition_funnel",
                problem="Overall website conversion rate is critically low.",
                evidence=(
                    f"Conversion rate is {metrics.conversion_rate:.2%} across "
                    f"{metrics.total_sessions} sessions — well below the 3% threshold."
                ),
                impact=(
                    "Low conversion means a large share of acquired traffic is not turning into "
                    "revenue, reducing marketing ROI and customer acquisition efficiency."
                ),
                action=(
                    "Review end-to-end funnel UX (landing → pricing → checkout), run A/B tests "
                    "on key CTAs, and simplify the path to purchase."
                ),
                confidence_score=conf,
                confidence_range=rng,
                expected_outcome="Increase conversion rate by 0.5–1.5pp within 30 days.",
                input_variables=[
                    RecommendationInputVars(
                        metric_name="conversion_rate",
                        metric_value=metrics.conversion_rate,
                        threshold=0.03,
                        direction="below",
                    )
                ],
            )
        )

    # 2) Mobile underperforming vs desktop
    if metrics.mobile_conversion_rate + 1e-6 < metrics.desktop_conversion_rate * 0.7:
        gap = metrics.desktop_conversion_rate - metrics.mobile_conversion_rate
        conf, rng = _confidence(0.78, 0.06 if gap > 0.02 else 0.0)
        recs.append(
            Recommendation(
                id="mobile-underperforming",
                severity="high",
                area="mobile_experience",
                problem="Mobile conversion rate significantly lags behind desktop.",
                evidence=(
                    f"Mobile conversion: {metrics.mobile_conversion_rate:.2%}; "
                    f"Desktop conversion: {metrics.desktop_conversion_rate:.2%}. "
                    f"Gap of {gap:.2%}."
                ),
                impact=(
                    "Mobile users are abandoning the funnel at higher rates, causing a "
                    "meaningful revenue gap given modern mobile traffic share (typically 60%+)."
                ),
                action=(
                    "Audit mobile checkout performance (load time, responsiveness, form UX). "
                    "Prioritize mobile-specific optimizations and re-test after changes."
                ),
                confidence_score=conf,
                confidence_range=rng,
                expected_outcome="Close mobile/desktop gap to within 15% within 45 days.",
                input_variables=[
                    RecommendationInputVars(
                        metric_name="mobile_conversion_rate",
                        metric_value=metrics.mobile_conversion_rate,
                        threshold=metrics.desktop_conversion_rate * 0.7,
                        direction="below",
                    ),
                    RecommendationInputVars(
                        metric_name="desktop_conversion_rate",
                        metric_value=metrics.desktop_conversion_rate,
                        threshold=0.0,
                        direction="above",
                    ),
                ],
            )
        )

    # 3) High funnel drop-off
    if metrics.funnel_dropoff_rate > 0.4:
        conf, rng = _confidence(0.75, 0.07 if metrics.funnel_dropoff_rate > 0.6 else 0.0)
        recs.append(
            Recommendation(
                id="high-funnel-dropoff",
                severity="medium",
                area="funnel_design",
                problem="Significant drop-off between landing and checkout steps.",
                evidence=(
                    f"Funnel drop-off rate from landing to checkout is "
                    f"{metrics.funnel_dropoff_rate:.2%}. Industry benchmark is ~35–40%."
                ),
                impact=(
                    "Users are losing interest or facing friction before they reach checkout, "
                    "limiting revenue potential."
                ),
                action=(
                    "Analyze which step (pricing, features, or checkout) has the biggest exit "
                    "rate and focus UX/content improvements there first."
                ),
                confidence_score=conf,
                confidence_range=rng,
                expected_outcome="Reduce drop-off by 10pp within 60 days.",
                input_variables=[
                    RecommendationInputVars(
                        metric_name="funnel_dropoff_rate",
                        metric_value=metrics.funnel_dropoff_rate,
                        threshold=0.40,
                        direction="above",
                    )
                ],
            )
        )

    # 4) Low engagement
    if metrics.engagement_score < 0.4:
        conf, rng = _confidence(0.70, 0.05 if metrics.engagement_score < 0.25 else 0.0)
        recs.append(
            Recommendation(
                id="low-engagement",
                severity="medium",
                area="product_engagement",
                problem="User engagement is relatively low.",
                evidence=(
                    f"Normalized engagement score is {metrics.engagement_score:.2f} "
                    "(0–1 scale based on events per session). Target is ≥ 0.4."
                ),
                impact=(
                    "Low engagement reduces exposure to value propositions and increases the "
                    "chance of churn before conversion."
                ),
                action=(
                    "Improve on-site content and interaction design (clearer value messaging, "
                    "guided tours, or nudges that keep users exploring)."
                ),
                confidence_score=conf,
                confidence_range=rng,
                expected_outcome="Increase engagement score to 0.5+ within 30 days.",
                input_variables=[
                    RecommendationInputVars(
                        metric_name="engagement_score",
                        metric_value=metrics.engagement_score,
                        threshold=0.40,
                        direction="below",
                    )
                ],
            )
        )

    # 5) Low retention
    if metrics.retention_rate_proxy < 0.25:
        conf, rng = _confidence(0.72, 0.05 if metrics.retention_rate_proxy < 0.10 else 0.0)
        recs.append(
            Recommendation(
                id="low-retention",
                severity="high",
                area="retention",
                problem="User retention is below acceptable threshold.",
                evidence=(
                    f"Only {metrics.retention_rate_proxy:.2%} of users return for a second session. "
                    "Target is ≥ 25%."
                ),
                impact=(
                    "Poor retention inflates CAC and suppresses LTV, making growth economically "
                    "unsustainable."
                ),
                action=(
                    "Implement post-session email nurture flows, in-app onboarding checkpoints, "
                    "and loyalty triggers for first-time converters."
                ),
                confidence_score=conf,
                confidence_range=rng,
                expected_outcome="Lift retention proxy to 30%+ within 60 days.",
                input_variables=[
                    RecommendationInputVars(
                        metric_name="retention_rate_proxy",
                        metric_value=metrics.retention_rate_proxy,
                        threshold=0.25,
                        direction="below",
                    )
                ],
            )
        )

    # 6) AI: high churn risk share
    if ai.high_risk_churn_share > 0.3:
        conf, rng = _confidence(0.80, 0.05 if ai.high_risk_churn_share > 0.5 else 0.0)
        recs.append(
            Recommendation(
                id="high-churn-risk",
                severity="high",
                area="retention",
                problem="A large share of sessions are flagged as high churn risk by the AI model.",
                evidence=(
                    f"AI model estimates {ai.high_risk_churn_share:.2%} of sessions have very "
                    "low predicted conversion probability (bottom 30th percentile)."
                ),
                impact=(
                    "Without intervention, many users are unlikely to return or convert, "
                    "depressing long-term LTV."
                ),
                action=(
                    "Introduce re-engagement tactics: remarketing campaigns, email flows, in-app "
                    "nudges targeted at these low-intent cohorts."
                ),
                confidence_score=conf,
                confidence_range=rng,
                expected_outcome="Reduce high-risk share below 25% within 45 days.",
                input_variables=[
                    RecommendationInputVars(
                        metric_name="high_risk_churn_share",
                        metric_value=ai.high_risk_churn_share,
                        threshold=0.30,
                        direction="above",
                    )
                ],
            )
        )

    # 7) AI: low average conversion probability
    if ai.avg_conversion_probability < 0.25:
        conf, rng = _confidence(0.74, 0.04 if ai.avg_conversion_probability < 0.15 else 0.0)
        recs.append(
            Recommendation(
                id="low-intent-traffic",
                severity="medium",
                area="marketing_mix",
                problem="Traffic quality appears low based on predicted conversion probabilities.",
                evidence=(
                    f"Average predicted conversion probability is {ai.avg_conversion_probability:.2%}. "
                    "Target is ≥ 25%."
                ),
                impact=(
                    "Spending on low-intent traffic reduces marketing efficiency and masks "
                    "performance of high-quality channels."
                ),
                action=(
                    "Review channel mix and targeting; shift budget toward higher-intent sources "
                    f"({ai.top_converting_source or 'best-performing channel'}) "
                    "and refine audience definitions."
                ),
                confidence_score=conf,
                confidence_range=rng,
                expected_outcome="Raise avg conversion probability to 30%+ in 30 days.",
                input_variables=[
                    RecommendationInputVars(
                        metric_name="avg_conversion_probability",
                        metric_value=ai.avg_conversion_probability,
                        threshold=0.25,
                        direction="below",
                    )
                ],
            )
        )

    # Fallback: healthy state
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
                action=(
                    "Continue monitoring KPIs and AI signals; test incremental optimizations "
                    "rather than large disruptive changes."
                ),
                confidence_score=0.91,
                confidence_range="85%–97%",
                expected_outcome="Maintain current performance levels.",
                input_variables=[],
            )
        )

    return recs
