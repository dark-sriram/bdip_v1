import { useEffect, useMemo, useState } from "react";
import { fetchDashboard, approveDecision, rejectDecision } from "../api";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const fmt = {
  pct:   v => `${(+v * 100).toFixed(2)}%`,
  money: v => `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  num:   v => Number(v || 0).toLocaleString(),
  score: v => Number(v || 0).toFixed(2),
};

/* ── KPI Tile ─────────────────────────────────────────────── */
function KpiTile({ label, value, sub, trend, delay = 0 }) {
  const trendColor = trend === "up" ? "var(--green)" : trend === "down" ? "var(--red)" : "var(--text-3)";
  const trendIcon  = trend === "up" ? "↑" : trend === "down" ? "↓" : "—";
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="section-label mb-2">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{sub}</div>}
      {trend && (
        <div className="text-xs font-semibold mt-2" style={{ color: trendColor }}>
          {trendIcon} {trend}
        </div>
      )}
    </div>
  );
}

/* ── Forecast Chart ───────────────────────────────────────── */
function ForecastChart({ data, unit }) {
  const all = [...(data?.historical || []), ...(data?.forecast || [])];
  const fmtY = unit === "pct" ? v => `${(v * 100).toFixed(1)}%`
    : unit === "usd" ? v => `$${(v / 1000).toFixed(0)}k`
    : v => v.toFixed(2);
  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={all} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fgA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="var(--accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} axisLine={false} tickLine={false}
          tickFormatter={fmtY} width={44} />
        <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text)" }}
          formatter={v => [fmtY(v), ""]} />
        <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="url(#fgA)"
          dot={props => {
            const { cx, cy, payload } = props;
            return payload.is_forecast
              ? <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="var(--amber)" stroke="none" />
              : null;
          }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Confidence Bar ───────────────────────────────────────── */
function ConfBar({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "var(--green)" : pct >= 65 ? "var(--amber)" : "var(--red)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: "width .6s ease" }} />
      </div>
      <span className="text-[10px] font-semibold mono" style={{ color }}>{pct}%</span>
    </div>
  );
}

/* ── Recommendation Card ──────────────────────────────────── */
function RecCard({ rec, onApprove, onReject, actionState }) {
  const [expectedOutcome, setExpected] = useState("");
  const [showInput, setShowInput] = useState(false);
  const done = !!actionState;
  const approved = actionState === "approved";

  return (
    <div className={`card p-5 fade-up transition-opacity ${done ? "opacity-55" : ""}`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`badge badge-${rec.severity}`}>{rec.severity}</span>
            <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
              {rec.area.replace(/_/g, " ")}
            </span>
          </div>
          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{rec.problem}</div>
        </div>
        {done && (
          <span className={`badge text-[9px] ${approved ? "badge-low" : "text-[var(--text-3)] border-[var(--border)] bg-[var(--bg-2)]"}`}>
            {approved ? "✓ Approved" : "✗ Rejected"}
          </span>
        )}
      </div>

      {/* Evidence / Impact / Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {[
          { label: "Evidence",           val: rec.evidence },
          { label: "Impact",             val: rec.impact },
          { label: "Recommended action", val: rec.action },
        ].map(({ label, val }) => (
          <div key={label} className="rounded-xl p-3 border" style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}>
            <div className="section-label mb-1">{label}</div>
            <div className="text-xs" style={{ color: "var(--text-2)" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Footer: confidence + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-48">
          <div className="section-label mb-1">Confidence — {rec.confidence_range}</div>
          <ConfBar score={rec.confidence_score} />
        </div>

        {rec.input_variables?.length > 0 && (
          <div className="text-[10px]" style={{ color: "var(--text-3)" }}>
            Signals: {rec.input_variables.map(v => v.metric_name).join(", ")}
          </div>
        )}

        {!done && (
          <div className="flex items-center gap-2">
            {showInput ? (
              <div className="flex items-center gap-2">
                <input className="input text-xs py-1.5 w-52"
                  placeholder="Expected outcome (optional)"
                  value={expectedOutcome}
                  onChange={e => setExpected(e.target.value)} />
                <button onClick={() => { onApprove(rec, expectedOutcome); setShowInput(false); }}
                  className="btn-primary text-xs px-3 py-1.5"
                  style={{ background: "var(--green)" }}>
                  Confirm
                </button>
                <button onClick={() => setShowInput(false)} className="btn-ghost text-xs px-2 py-1.5">Cancel</button>
              </div>
            ) : (
              <>
                <button onClick={() => setShowInput(true)}
                  className="btn-ghost text-xs px-3 py-1.5 border font-semibold"
                  style={{ borderColor: "color-mix(in srgb, var(--green) 40%, transparent)", color: "var(--green)", background: "var(--green-bg)" }}>
                  ✓ Approve
                </button>
                <button onClick={() => onReject(rec)} className="btn-ghost text-xs px-3 py-1.5">✗ Reject</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────── */
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [payload, setPayload] = useState(null);
  const [actioned, setActioned] = useState({});

  async function load() {
    setLoading(true); setError("");
    try { setPayload(await fetchDashboard()); }
    catch { setError("Failed to load dashboard. Is the backend running?"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const m   = payload?.metrics;
  const ai  = payload?.ai;
  const recs = payload?.recommendations || [];
  const forecasts = payload?.forecasts || [];
  const triggered = payload?.alerts?.triggered_count ?? 0;

  const kpis = useMemo(() => {
    if (!m) return [];
    return [
      { label: "Total Revenue",    value: fmt.money(m.total_revenue),            sub: `${fmt.num(m.total_conversions)} conversions`,  trend: "up"   },
      { label: "Conversion Rate",  value: fmt.pct(m.conversion_rate),            sub: `${fmt.num(m.total_sessions)} sessions`,        trend: m.conversion_rate >= 0.04 ? "up" : "down" },
      { label: "Avg Order Value",  value: fmt.money(m.avg_order_value),          sub: "Per conversion",                               trend: null   },
      { label: "Estimated LTV",    value: fmt.money(m.est_ltv),                  sub: "AOV × 2 purchase cycles",                     trend: "up"   },
      { label: "Retention",        value: fmt.pct(m.retention_rate_proxy),       sub: "Multi-session users",                         trend: m.retention_rate_proxy >= 0.25 ? "up" : "down" },
      { label: "Engagement",       value: fmt.score(m.engagement_score),         sub: "0–1 scale",                                   trend: m.engagement_score >= 0.4 ? "up" : "down" },
      { label: "Churn Risk (AI)",  value: fmt.pct(ai?.high_risk_churn_share ?? 0), sub: "High-risk sessions", trend: (ai?.high_risk_churn_share ?? 0) > 0.3 ? "down" : "up" },
      { label: "Unique Users",     value: fmt.num(m.total_users),                sub: "Distinct user IDs",                           trend: null   },
    ];
  }, [m, ai]);

  async function handleApprove(rec, eo) {
    try { await approveDecision(rec.id, rec.action, eo || undefined); }
    catch {}
    setActioned(p => ({ ...p, [rec.id]: "approved" }));
  }
  async function handleReject(rec) {
    try { await rejectDecision(rec.id, "Rejected from dashboard"); }
    catch {}
    setActioned(p => ({ ...p, [rec.id]: "rejected" }));
  }

  const fConv = forecasts.find(f => f.metric === "conversion_rate");
  const fRev  = forecasts.find(f => f.metric === "weekly_revenue");
  const fEng  = forecasts.find(f => f.metric === "engagement_score");

  /* ── Loading ── */
  if (loading) return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="page-title">Decision Dashboard</h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="page-body">
      <div className="page-header"><h1 className="page-title">Decision Dashboard</h1></div>
      <div className="card p-5" style={{ background: "var(--red-bg)", borderColor: "var(--red)" }}>
        <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>
        <button onClick={load} className="btn-ghost text-xs mt-3">Retry</button>
      </div>
    </div>
  );

  return (
    <div>
      {/* ─ Header ─ */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Decision Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            AI-powered insights · Real-time KPIs · Actionable recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {triggered > 0 && (
            <div className="badge badge-high px-3 py-1.5 text-xs">
              <span className="relative pulse-dot inline-block w-1.5 h-1.5 rounded-full mr-1"
                style={{ background: "var(--red)", color: "var(--red)" }} />
              {triggered} alert{triggered > 1 ? "s" : ""}
            </div>
          )}
          <button onClick={load} className="btn-ghost text-xs">Refresh</button>
        </div>
      </div>

      <div className="page-body">

        {/* ─ KPI Grid ─ */}
        <section>
          <div className="section-label mb-3">Key Performance Indicators</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map((k, i) => <KpiTile key={k.label} {...k} delay={i * 40} />)}
          </div>
        </section>

        {/* ─ Forecasts ─ */}
        {forecasts.length > 0 && (
          <section>
            <div className="section-label mb-3">
              Forecasts — 4-Week Outlook{" "}
              <span style={{ color: "var(--amber)" }}>● forecast</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { data: fConv, title: "Conversion Rate",   unit: "pct" },
                { data: fRev,  title: "Weekly Revenue",    unit: "usd" },
                { data: fEng,  title: "Engagement Score",  unit: "score" },
              ].map(({ data, title, unit }) => (
                <div key={title} className="card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-semibold" style={{ color: "var(--text)" }}>{title}</div>
                    <span className={`text-[10px] font-semibold ${data?.trend === "up" ? "trend-up" : data?.trend === "down" ? "trend-down" : "trend-flat"}`}>
                      {data?.trend === "up" ? "↑" : data?.trend === "down" ? "↓" : "→"} {data?.trend}
                    </span>
                  </div>
                  <div className="text-[10px] mb-3" style={{ color: "var(--text-3)" }}>
                    {data?.change_pct?.toFixed(1)}% change over 8w
                  </div>
                  <ForecastChart data={data} unit={unit} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─ AI Signals + Device breakdown ─ */}
        {ai && m && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Signals */}
            <div>
              <div className="section-label mb-3">AI Signals</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Avg Conv. Probability", value: fmt.pct(ai.avg_conversion_probability), color: "var(--accent)" },
                  { label: "High Churn Risk",        value: fmt.pct(ai.high_risk_churn_share),      color: ai.high_risk_churn_share > 0.3 ? "var(--red)" : "var(--green)" },
                  { label: "Top Source",             value: ai.top_converting_source || "—",        color: "var(--amber)" },
                  { label: "Top Device",             value: ai.top_converting_device || "—",        color: "var(--blue)" },
                ].map(s => (
                  <div key={s.label} className="card p-4">
                    <div className="section-label mb-2">{s.label}</div>
                    <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Comparison */}
            <div>
              <div className="section-label mb-3">Device Conversion Rates</div>
              <div className="card p-4" style={{ height: "calc(100% - 24px)" }}>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={[
                      { device: "Mobile",  cvr: m.mobile_conversion_rate },
                      { device: "Desktop", cvr: m.desktop_conversion_rate },
                    ]}
                    layout="vertical"
                    margin={{ left: 12, right: 24 }}
                  >
                    <XAxis type="number" tickFormatter={v => `${(v*100).toFixed(1)}%`}
                      tick={{ fontSize: 10, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="device"
                      tick={{ fontSize: 12, fill: "var(--text-2)" }} axisLine={false} tickLine={false} width={56} />
                    <Tooltip formatter={v => [`${(v*100).toFixed(2)}%`, "CVR"]}
                      contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text)" }} />
                    <Bar dataKey="cvr" radius={[0, 6, 6, 0]}>
                      <Cell fill="var(--accent)" />
                      <Cell fill="var(--green)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex flex-col gap-2 text-xs">
                  {[
                    { label: "Funnel drop-off",         val: fmt.pct(m.funnel_dropoff_rate),     good: m.funnel_dropoff_rate < 0.4 },
                    { label: "Mobile vs Desktop gap",   val: fmt.pct(Math.abs(m.desktop_conversion_rate - m.mobile_conversion_rate)), good: Math.abs(m.desktop_conversion_rate - m.mobile_conversion_rate) < 0.01 },
                    { label: "Retention proxy",         val: fmt.pct(m.retention_rate_proxy),    good: m.retention_rate_proxy >= 0.25 },
                  ].map(({ label, val, good }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span style={{ color: "var(--text-3)" }}>{label}</span>
                      <span className="font-semibold" style={{ color: good ? "var(--green)" : "var(--red)" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─ Recommendations ─ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="section-label">AI Recommendations ({recs.length})</div>
            <div className="text-[10px]" style={{ color: "var(--text-3)" }}>
              Approve or reject — decisions are automatically logged
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {recs.map(r => (
              <RecCard key={r.id} rec={r}
                onApprove={handleApprove} onReject={handleReject}
                actionState={actioned[r.id]} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
