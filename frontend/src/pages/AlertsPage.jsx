import { useEffect, useState } from "react";
import { fetchAlerts } from "../api";

const SEV = {
  high:   { bar: "var(--red)",   bg: "var(--red-bg)",   badge: "badge-high",   dot: "var(--red)"   },
  medium: { bar: "var(--amber)", bg: "var(--amber-bg)", badge: "badge-medium", dot: "var(--amber)" },
  low:    { bar: "var(--green)", bg: "var(--green-bg)", badge: "badge-low",    dot: "var(--green)" },
};

const FMT = {
  pct:   v => `${(v * 100).toFixed(2)}%`,
  money: v => `$${Number(v || 0).toFixed(2)}`,
  num:   v => Number(v || 0).toFixed(2),
};

function fmtVal(metric, v) {
  if (metric.includes("rate") || metric.includes("share") || metric.includes("proxy")) return FMT.pct(v);
  if (metric === "est_ltv") return FMT.money(v);
  return FMT.num(v);
}

function AlertCard({ alert }) {
  const sev = SEV[alert.severity] || SEV.low;
  return (
    <div className={`card p-4 fade-up transition-opacity ${!alert.triggered ? "opacity-40" : ""}`}
      style={alert.triggered ? { background: sev.bg, borderColor: `color-mix(in srgb, ${sev.bar} 30%, transparent)` } : {}}>
      <div className="flex items-start gap-3">
        {/* Dot */}
        <div className="mt-1 shrink-0">
          {alert.triggered
            ? <span className="relative pulse-dot inline-block w-2 h-2 rounded-full" style={{ background: sev.dot, color: sev.dot }} />
            : <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--border-2)" }} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`badge ${sev.badge}`}>{alert.severity}</span>
            <span className="text-[10px] mono" style={{ color: "var(--text-3)" }}>{alert.metric.replace(/_/g, " ")}</span>
            {alert.triggered && (
              <span className="badge badge-high text-[9px] uppercase tracking-wide">● Triggered</span>
            )}
          </div>
          <div className="text-sm font-medium" style={{ color: alert.triggered ? "var(--text)" : "var(--text-3)" }}>
            {alert.message}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="section-label mb-0.5">Current</div>
          <div className="text-sm font-bold mono" style={{ color: alert.triggered ? sev.bar : "var(--text-3)" }}>
            {fmtVal(alert.metric, alert.current_value)}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
            {alert.condition} {fmtVal(alert.metric, alert.threshold)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAlerts().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const all = data?.alerts || [];
  const triggered = all.filter(a => a.triggered);
  const shown = filter === "triggered" ? triggered
    : filter === "high" ? all.filter(a => a.severity === "high")
    : all;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Threshold-based KPI monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          {data?.triggered_count > 0 && (
            <div className="badge badge-high px-3 py-1.5 text-xs">
              <span className="relative pulse-dot inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: "var(--red)", color: "var(--red)" }} />
              {data.triggered_count} triggered
            </div>
          )}
          <button onClick={() => fetchAlerts().then(setData)} className="btn-ghost text-xs">Refresh</button>
        </div>
      </div>

      <div className="page-body">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: "all", label: `All (${all.length})` },
            { key: "triggered", label: `Triggered (${triggered.length})` },
            { key: "high", label: `High severity (${all.filter(a => a.severity === "high").length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`btn-ghost text-xs ${filter === key ? "ring-2" : ""}`}
              style={filter === key ? { ringColor: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent)" } : {}}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex gap-2 items-center text-sm" style={{ color: "var(--text-3)" }}>
            <span className="skeleton inline-block w-4 h-4 rounded-full" />
            Evaluating thresholds…
          </div>
        ) : shown.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-3xl mb-3">✓</div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>No alerts in this filter</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {shown.filter(a => a.triggered).map(a => <AlertCard key={a.id} alert={a} />)}
            {shown.filter(a => !a.triggered).map(a => <AlertCard key={a.id} alert={a} />)}
          </div>
        )}

        {/* Severity guide */}
        <div className="card p-4" style={{ background: "var(--bg-2)" }}>
          <div className="section-label mb-3">Severity Guide</div>
          <div className="grid grid-cols-3 gap-4 text-xs" style={{ color: "var(--text-3)" }}>
            <div><span className="font-semibold" style={{ color: "var(--red)" }}>High</span> — Critical metrics. Immediate action required.</div>
            <div><span className="font-semibold" style={{ color: "var(--amber)" }}>Medium</span> — Degrading performance. Address soon.</div>
            <div><span className="font-semibold" style={{ color: "var(--green)" }}>Low</span> — Informational signals. Monitor and optimize.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
