import { useEffect, useMemo, useState } from "react";

import { fetchDashboard } from "../api";
import { Card } from "../components/Card.jsx";
import { Container } from "../components/Container.jsx";
import { KpiCard } from "../components/KpiCard.jsx";
import { RecommendationList } from "../components/RecommendationList.jsx";
import { SimpleConversionChart } from "../components/Charts.jsx";

function fmtPct(v) {
  return `${(v * 100).toFixed(2)}%`;
}

function fmtMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function Insights() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDashboard();
      setPayload(data);
    } catch (e) {
      setError("Failed to load decision insights. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = payload?.metrics;
  const ai = payload?.ai;
  const recommendations = payload?.recommendations || [];

  const topKpis = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        label: "Conversion rate",
        value: fmtPct(metrics.conversion_rate),
        hint: "Overall conversions / sessions",
      },
      {
        label: "Funnel drop-off",
        value: fmtPct(metrics.funnel_dropoff_rate),
        hint: "Landing → Checkout drop-off",
      },
      {
        label: "Avg order value",
        value: fmtMoney(metrics.avg_order_value),
        hint: "Revenue / conversions",
      },
      {
        label: "Estimated LTV",
        value: fmtMoney(metrics.est_ltv),
        hint: "Demo proxy (AOV × 2)",
      },
    ];
  }, [metrics]);

  return (
    <Container>
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <div className="text-lg font-semibold tracking-tight text-black">
            Insights
          </div>
          <div className="mt-1 text-sm text-slate-900">
            Exec-ready signals + AI reasoning + actionable recommendations.
          </div>
        </div>
        <button
          onClick={load}
          className="rounded-xl border border-[#988aec]/80 bg-[#988aec]/30 px-4 py-2 text-sm font-medium text-[#59168b] transition hover:bg-[#cfc9ee]/30"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Card title="Loading insights">
            <div className="flex items-center gap-3 text-sm text-black">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-sky-400" />
              Fetching metrics, AI signals, and recommendations…
            </div>
          </Card>
        </div>
      ) : error ? (
        <Card title="Unable to load" subtitle="Try again in a moment.">
          <div className="text-sm text-rose-200">{error}</div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topKpis.map((k) => (
              <KpiCard
                key={k.label}
                label={k.label}
                value={k.value}
                hint={k.hint}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card
              title="Conversion trend (demo)"
              subtitle="Snapshot-to-trend visualization for exec UX"
            >
              <SimpleConversionChart metrics={metrics} />
            </Card>

            <Card
              title="Segment comparison"
              subtitle="Device conversion rates"
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-black">Mobile conversion</div>
                  <div className="font-semibold text-black">
                    {fmtPct(metrics.mobile_conversion_rate)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-black">Desktop conversion</div>
                  <div className="font-semibold text-black">
                    {fmtPct(metrics.desktop_conversion_rate)}
                  </div>
                </div>
                <div className="mt-4 rounded-xl  bg-[#988aec]/30 p-3">
                  <div className="text-xs font-semibold text-black">
                    Engagement score
                  </div>
                  <div className="mt-1 text-lg font-semibold text-black">
                    {metrics.engagement_score.toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs text-black">
                    Demo proxy from events-per-session.
                  </div>
                </div>
              </div>
            </Card>

            <Card title="AI signals" subtitle="Prediction summaries">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-black">
                    Avg conversion probability
                  </div>
                  <div className="font-semibold text-black">
                    {fmtPct(ai.avg_conversion_probability)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-black">
                    High churn risk share
                  </div>
                  <div className="font-semibold text-black">
                    {fmtPct(ai.high_risk_churn_share)}
                  </div>
                </div>
                {ai.notes ? (
                  <div className="mt-4 rounded-xl bg-[#988aec]/30 p-3 text-xs text-black">
                    {ai.notes}
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-black">
              Recommendations
            </div>
            <RecommendationList recommendations={recommendations} />
          </div>
        </div>
      )}
    </Container>
  );
}

