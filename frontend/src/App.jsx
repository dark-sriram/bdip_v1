import { useEffect, useMemo, useState } from "react";

import { fetchDashboard } from "./api";
import { Card } from "./components/Card.jsx";
import { Container } from "./components/Container.jsx";
import { KpiCard } from "./components/KpiCard.jsx";
import { RecommendationList } from "./components/RecommendationList.jsx";
import { SimpleConversionChart } from "./components/Charts.jsx";

function fmtPct(v) {
  return `${(v * 100).toFixed(2)}%`;
}

function fmtMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function App() {
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
      setError("Failed to load data from the decision engine. Please try again.");
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
    <div className="min-h-screen bg-slate-950 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/90">
        <Container>
          <header className="flex flex-col gap-4 pb-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                AI‑Driven Business Decision Intelligence
              </div>
              <div className="text-2xl font-semibold tracking-tight text-slate-50">
                Executive Funnel & Revenue Insights
              </div>
              <div className="text-sm text-slate-400">
                Surface problems, show evidence, quantify impact, and recommend actions.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={load}
                className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100 shadow-sm shadow-sky-900/40 transition hover:bg-sky-500/20"
              >
                Refresh insights
              </button>
            </div>
          </header>
        </Container>
      </div>

      <Container>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Card title="Loading insights">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-sky-400" />
                Fetching metrics, AI signals, and recommendations…
              </div>
            </Card>
          </div>
        ) : error ? (
          <Card title="Connection error" subtitle="The decision engine is not reachable.">
            <div className="text-sm text-rose-200">{error}</div>
            <div className="mt-3 text-xs text-slate-400">
              Tip: run FastAPI with{" "}
              <span className="font-mono">uvicorn app.main:app --reload</span>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topKpis.map((k) => (
                <KpiCard key={k.label} label={k.label} value={k.value} hint={k.hint} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card
                title="Conversion trend (demo)"
                subtitle="Snapshot-to-trend visualization for exec UX"
              >
                <SimpleConversionChart metrics={metrics} />
              </Card>

              <Card title="Segment comparison" subtitle="Device conversion rates">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-slate-300">Mobile conversion</div>
                    <div className="font-semibold text-slate-50">
                      {fmtPct(metrics.mobile_conversion_rate)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-slate-300">Desktop conversion</div>
                    <div className="font-semibold text-slate-50">
                      {fmtPct(metrics.desktop_conversion_rate)}
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <div className="text-xs font-semibold text-slate-300">
                      Engagement score
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-50">
                      {metrics.engagement_score.toFixed(2)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Demo proxy from events-per-session.
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="AI signals" subtitle="Prediction summaries">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-slate-300">Avg conversion probability</div>
                    <div className="font-semibold text-slate-50">
                      {fmtPct(ai.avg_conversion_probability)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-slate-300">High churn risk share</div>
                    <div className="font-semibold text-slate-50">
                      {fmtPct(ai.high_risk_churn_share)}
                    </div>
                  </div>
                  {ai.notes ? (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
                      {ai.notes}
                    </div>
                  ) : null}
                </div>
              </Card>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-slate-100">
                Recommendations
              </div>
              <RecommendationList recommendations={recommendations} />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

