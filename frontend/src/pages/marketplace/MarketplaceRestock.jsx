import { useEffect, useState } from "react";
import { fetchMarketplaceRestock } from "../../api";

const INR = v => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const PLATFORM_LABELS = { amazon: "Amazon", flipkart: "Flipkart", meesho: "Meesho" };

const URGENCY = {
  critical: { label: "Critical — Order Now",    cls: "badge-high",   bar: "var(--red)",   bg: "var(--red-bg)" },
  warning:  { label: "Restock Soon",            cls: "badge-medium", bar: "var(--amber)", bg: "var(--amber-bg)" },
  ok:       { label: "Stock Sufficient",        cls: "badge-low",    bar: "var(--green)", bg: "transparent" },
};

function StockBar({ days, max = 30 }) {
  const pct = Math.min(100, (days / max) * 100);
  const color = days <= 3 ? "var(--red)" : days <= 7 ? "var(--amber)" : "var(--green)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs mono font-semibold w-12 text-right" style={{ color }}>{days}d</span>
    </div>
  );
}

export default function MarketplaceRestock() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMarketplaceRestock().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-body">
      <div className="page-header"><h1 className="page-title">Restock Planner</h1></div>
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  );

  const items = data?.items || [];
  const critical = items.filter(i => i.urgency === "critical");
  const warnings = items.filter(i => i.urgency === "warning");
  const shown = filter === "all" ? items
    : filter === "critical" ? critical
    : filter === "warning" ? warnings
    : items.filter(i => i.urgency === "ok");

  const totalAtRisk = critical.reduce((s, i) => s + i.estimated_revenue_at_risk, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Restock Planner</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Demand-driven restock recommendations — prevent stockouts before they happen
          </p>
        </div>
        {critical.length > 0 && (
          <div className="badge badge-high text-xs px-3 py-1.5">
            ⚠ {critical.length} critical stockouts imminent
          </div>
        )}
      </div>

      <div className="page-body">

        {/* Summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Critical (≤3 days)", value: critical.length, color: "var(--red)" },
            { label: "Restock Soon (≤7 days)", value: warnings.length, color: "var(--amber)" },
            { label: "Total SKU-Platform Pairs", value: items.length, color: "var(--text)" },
            { label: "Revenue at Risk", value: INR(totalAtRisk), color: "var(--red)", sub: "Critical items only" },
          ].map((s, i) => (
            <div key={s.label} className={`card p-5 fade-up-${i+1}`}>
              <div className="section-label mb-2">{s.label}</div>
              <div className="kpi-value" style={{ color: s.color }}>{s.value}</div>
              {s.sub && <div className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Critical alert block */}
        {critical.length > 0 && (
          <div className="card p-4" style={{ background: "var(--red-bg)", borderColor: "color-mix(in srgb, var(--red) 25%, transparent)" }}>
            <div className="section-label mb-3" style={{ color: "var(--red)" }}>🚨 Immediate Action Required</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {critical.map((item, i) => (
                <div key={i} className="rounded-xl p-3 text-xs flex items-start justify-between gap-3"
                  style={{ background: "var(--bg-card)" }}>
                  <div>
                    <div className="font-semibold mb-0.5" style={{ color: "var(--text)" }}>{item.name}</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`badge pill-${item.platform} text-[9px]`}>{PLATFORM_LABELS[item.platform]}</span>
                      <span style={{ color: "var(--text-3)" }}>·</span>
                      <span style={{ color: "var(--text-3)" }}>{item.current_stock} units left</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold" style={{ color: "var(--red)" }}>{item.days_remaining}d left</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
                      Order {item.recommended_qty} units
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: `All (${items.length})` },
            { key: "critical", label: `🔴 Critical (${critical.length})` },
            { key: "warning", label: `🟡 Soon (${warnings.length})` },
            { key: "ok", label: `🟢 OK (${items.filter(i => i.urgency === "ok").length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`btn-ghost text-xs ${filter === key ? "ring-2 ring-[var(--accent)]" : ""}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Main table */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 gap-3 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: "var(--bg-2)", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
            <div className="col-span-2">Product</div>
            <div>Platform</div>
            <div>Stock</div>
            <div>Days Left</div>
            <div>Reorder Qty</div>
            <div>Status</div>
          </div>
          {shown.map((item, i) => {
            const urg = URGENCY[item.urgency];
            return (
              <div key={i} className={`grid grid-cols-7 gap-3 px-4 py-3.5 border-b last:border-0`}
                style={{ borderColor: "var(--border)", background: item.urgency === "critical" ? "var(--red-bg)" : undefined }}>
                <div className="col-span-2">
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{item.name}</div>
                  <div className="text-[10px] mono mt-0.5" style={{ color: "var(--text-3)" }}>
                    {item.daily_velocity} units/day · {INR(item.estimated_revenue_at_risk)} at risk
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`badge pill-${item.platform} text-[9px]`}>{PLATFORM_LABELS[item.platform]}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-semibold mono" style={{ color: "var(--text)" }}>
                    {item.current_stock}
                  </span>
                </div>
                <div className="flex items-center pr-4">
                  <StockBar days={item.days_remaining} />
                </div>
                <div className="flex items-center">
                  <div className="rounded-lg px-2.5 py-1 text-sm font-bold mono"
                    style={{ background: urg.bg, color: item.urgency === "ok" ? "var(--green)" : item.urgency === "warning" ? "var(--amber)" : "var(--red)" }}>
                    {item.recommended_qty}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`badge ${urg.cls} text-[9px]`}>{urg.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Restock insights */}
        <div className="card p-5" style={{ background: "var(--accent-bg)", borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }}>
          <div className="section-label mb-3" style={{ color: "var(--accent)" }}>💡 AI Restock Recommendations</div>
          <div className="grid gap-2">
            {critical.slice(0, 3).map((item, i) => (
              <div key={i} className="rounded-xl p-3 text-xs" style={{ background: "var(--bg-card)", color: "var(--text-2)" }}>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{item.name} ({PLATFORM_LABELS[item.platform]}):</span>
                {" "}Only {item.current_stock} units left — will run out in {item.days_remaining} days. Place an order for {item.recommended_qty} units immediately (7-day lead time). Revenue at risk: {INR(item.estimated_revenue_at_risk)}.
              </div>
            ))}
            {warnings.slice(0, 2).map((item, i) => (
              <div key={`w${i}`} className="rounded-xl p-3 text-xs" style={{ background: "var(--bg-card)", color: "var(--text-2)" }}>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{item.name} ({PLATFORM_LABELS[item.platform]}):</span>
                {" "}Plan to reorder {item.recommended_qty} units within the next 3 days to avoid stockout in {item.days_remaining} days.
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
