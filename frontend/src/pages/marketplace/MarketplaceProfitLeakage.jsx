import { useEffect, useState } from "react";
import { fetchMarketplaceProfit } from "../../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const INR = v => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const PLATFORM_LABELS = { amazon: "Amazon", flipkart: "Flipkart", meesho: "Meesho" };
const PLATFORM_COLORS = { amazon: "#e65100", flipkart: "#0d47a1", meesho: "#880e4f" };

const FLAG_CONFIG = {
  critical: { label: "Loss Making", cls: "badge-high" },
  warning:  { label: "Low Margin",  cls: "badge-medium" },
  ok:       { label: "Healthy",     cls: "badge-low" },
};

export default function MarketplaceProfitLeakage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMarketplaceProfit()
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-body">
      <div className="page-header"><h1 className="page-title">Profit Leakage</h1></div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  const rows = data?.rows || [];
  const shown = filter === "all" ? rows
    : filter === "critical" ? rows.filter(r => r.leakage_flag === "critical")
    : rows.filter(r => r.leakage_flag === "warning");

  const totalFees = rows.reduce((s, r) => s + r.platform_fee_total, 0);
  const totalShip = rows.reduce((s, r) => s + r.shipping_total, 0);
  const totalReturn = rows.reduce((s, r) => s + r.return_cost, 0);
  const lossCount = rows.filter(r => r.is_loss_making).length;

  const pieData = [
    { name: "Platform Fees", value: Math.round(totalFees), fill: "#e65100" },
    { name: "Shipping", value: Math.round(totalShip), fill: "#0d47a1" },
    { name: "Return Costs", value: Math.round(totalReturn), fill: "#880e4f" },
  ];

  // Per-product profit comparison
  const productNames = [...new Set(rows.map(r => r.name))];
  const barData = productNames.map(name => {
    const entry = { name: name.split(" ").slice(0, 2).join(" ") };
    rows.filter(r => r.name === name).forEach(r => {
      entry[r.platform] = r.profit_per_unit;
    });
    return entry;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profit Leakage Analysis</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Where your money is disappearing — fees, shipping, returns
          </p>
        </div>
        {lossCount > 0 && (
          <div className="badge badge-high text-xs px-3 py-1.5">
            ⚠ {lossCount} loss-making SKU–platform combinations
          </div>
        )}
      </div>

      <div className="page-body">

        {/* Top summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Platform Fees Paid", value: INR(totalFees), color: "var(--red)" },
            { label: "Shipping Costs", value: INR(totalShip), color: "var(--amber)" },
            { label: "Return Losses", value: INR(totalReturn), color: "var(--red)" },
            { label: "Loss-Making Combos", value: lossCount, color: "var(--red)", sub: "SKU × Platform" },
          ].map((s, i) => (
            <div key={s.label} className={`card p-5 fade-up-${i+1}`}>
              <div className="section-label mb-2">{s.label}</div>
              <div className="kpi-value" style={{ color: s.color }}>{s.value}</div>
              {s.sub && <div className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Leakage breakdown pie */}
          <div className="card p-5">
            <div className="section-label mb-3">Cost Breakdown</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={v => [INR(v), ""]}
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Profit per unit per platform */}
          <div className="card p-5">
            <div className="section-label mb-3">Profit/Unit by Product × Platform</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ left: 0, right: 4, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={v => [INR(v), ""]}
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                <Legend formatter={v => PLATFORM_LABELS[v] || v} />
                {Object.entries(PLATFORM_COLORS).map(([p, color]) => (
                  <Bar key={p} dataKey={p} fill={color} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: "all", label: `All (${rows.length})` },
            { key: "critical", label: `🔴 Loss Making (${rows.filter(r => r.leakage_flag === "critical").length})` },
            { key: "warning", label: `🟡 Low Margin (${rows.filter(r => r.leakage_flag === "warning").length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`btn-ghost text-xs ${filter === key ? "ring-2 ring-[var(--accent)]" : ""}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Detailed table */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-8 gap-2 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: "var(--bg-2)", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
            <div className="col-span-2">Product</div>
            <div>Platform</div>
            <div>Revenue</div>
            <div>Fees</div>
            <div>Shipping</div>
            <div>Profit/Unit</div>
            <div>Status</div>
          </div>
          {shown.map((r, i) => (
            <div key={i} className={`grid grid-cols-8 gap-2 px-4 py-3 text-xs border-b last:border-0 ${r.is_loss_making ? "bg-[var(--red-bg)]" : ""}`}
              style={{ borderColor: "var(--border)" }}>
              <div className="col-span-2 font-medium" style={{ color: "var(--text)" }}>
                {r.name}
                <div className="text-[10px] mono" style={{ color: "var(--text-3)" }}>{r.sku}</div>
              </div>
              <div><span className={`badge pill-${r.platform} text-[9px]`}>{PLATFORM_LABELS[r.platform]}</span></div>
              <div className="mono" style={{ color: "var(--text-2)" }}>{INR(r.revenue)}</div>
              <div className="mono text-[var(--red)]">{INR(r.platform_fee_total)}</div>
              <div className="mono text-[var(--amber)]">{INR(r.shipping_total)}</div>
              <div className={`font-bold mono ${r.profit_per_unit < 0 ? "text-[var(--red)]" : "text-[var(--green)]"}`}>
                {INR(r.profit_per_unit)}
              </div>
              <div><span className={`badge ${FLAG_CONFIG[r.leakage_flag].cls} text-[9px]`}>{FLAG_CONFIG[r.leakage_flag].label}</span></div>
            </div>
          ))}
        </div>

        {/* AI insights */}
        <div className="card p-5" style={{ background: "var(--accent-bg)", borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }}>
          <div className="section-label mb-3" style={{ color: "var(--accent)" }}>💡 AI Profit Recommendations</div>
          <div className="grid gap-2">
            {rows.filter(r => r.is_loss_making).slice(0, 3).map((r, i) => (
              <div key={i} className="rounded-xl p-3 text-xs" style={{ background: "var(--bg-card)", color: "var(--text-2)" }}>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{r.name} on {PLATFORM_LABELS[r.platform]}:</span>
                {" "}You are losing {INR(Math.abs(r.profit_per_unit))} per unit. Consider raising price by ₹{Math.ceil(Math.abs(r.profit_per_unit) + 30)} or stopping sales on this platform.
              </div>
            ))}
            {rows.filter(r => r.leakage_flag === "warning").slice(0, 2).map((r, i) => (
              <div key={`w${i}`} className="rounded-xl p-3 text-xs" style={{ background: "var(--bg-card)", color: "var(--text-2)" }}>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{r.name} on {PLATFORM_LABELS[r.platform]}:</span>
                {" "}Margin of {r.margin_pct.toFixed(1)}% is below 10% threshold. Review platform fee tier or negotiate shipping rates.
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
