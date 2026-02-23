import { useEffect, useMemo, useState } from "react";

import { fetchDashboard } from "./api";
import { API_BASE_URL } from "./config";
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
      setError(
        `Failed to load backend data. Ensure backend is running at ${API_BASE_URL}.`,
      );
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
    <div className="min-h-screen">
      <div className="border-b border-slate-800 bg-slate-950/40">
        <Container>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-50">
                BDIP Executive Dashboard
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Problem → Evidence → Impact → Recommendation
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-400">
                Backend: <span className="text-slate-200">{API_BASE_URL}</span>
              </div>
              <button
                onClick={load}
                className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 hover:bg-slate-900"
              >
                Refresh
              </button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        {loading ? (
          <Card title="Loading">
            <div className="text-sm text-slate-300">
              Fetching metrics, AI signals, and recommendations…
            </div>
          </Card>
        ) : error ? (
          <Card title="Connection error" subtitle="Fix backend and retry">
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

