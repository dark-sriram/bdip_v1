import { useEffect, useRef, useState } from "react";
import { fetchMarketplaceHub, uploadMarketplaceCSV } from "../../api";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";

const INR  = v => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const PCT  = v => `${Number(v || 0).toFixed(1)}%`;
const NUM  = v => Number(v || 0).toLocaleString("en-IN");

const P_COLOR = { amazon: "#e65100", flipkart: "#1565c0", meesho: "#880e4f" };
const P_LABEL = { amazon: "Amazon",  flipkart: "Flipkart", meesho: "Meesho"  };

/* ── Platform pill ──────────────────────────────────────────── */
function PPill({ p }) {
  return <span className={`badge pill-${p} text-[10px]`}>{P_LABEL[p]}</span>;
}

/* ── Tooltip ────────────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-3 text-xs" style={{ minWidth: 150 }}>
      <div className="font-semibold mb-1.5" style={{ color: "var(--text)" }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: P_COLOR[p.dataKey] || p.color }}>{P_LABEL[p.dataKey] || p.dataKey}</span>
          <span className="mono font-semibold" style={{ color: "var(--text)" }}>{INR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── CSV Upload Panel ───────────────────────────────────────── */
function UploadPanel() {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  function pick(f) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) { setErr("Only .csv files accepted."); return; }
    setFile(f); setErr(""); setResult(null);
  }

  async function doUpload() {
    if (!file) return;
    setUploading(true); setErr(""); setResult(null);
    try {
      setResult(await uploadMarketplaceCSV(file));
    } catch (e) {
      setErr(e?.response?.data?.detail || "Upload failed.");
    } finally { setUploading(false); }
  }

  function reset() { setFile(null); setResult(null); setErr(""); if (ref.current) ref.current.value = ""; }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost text-xs flex items-center gap-1.5">
        <span>↑</span> Import CSV
      </button>
    );
  }

  return (
    <div className="card p-5 fade-up" style={{ border: "1px solid var(--accent)", background: "var(--accent-bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Import Marketplace Orders</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Upload a CSV with your real order data to replace the demo dataset
          </div>
        </div>
        <button onClick={() => { setOpen(false); reset(); }} className="btn-ghost text-xs">✕ Close</button>
      </div>

      {/* Schema */}
      <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="section-label mb-2">Required columns</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {["platform","product_id","order_id","date","selling_price","quantity"].map(c => (
            <span key={c} className="badge badge-accent mono text-[10px]">{c}</span>
          ))}
        </div>
        <div className="section-label mb-2">Optional columns</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {["product_name","platform_fee","shipping_cost","cogs","return_flag","rating"].map(c => (
            <span key={c} className="badge mono text-[10px]"
              style={{ background: "var(--bg-2)", color: "var(--text-3)", borderColor: "var(--border)" }}>{c}</span>
          ))}
        </div>
        <div style={{ color: "var(--text-3)" }}>
          <strong style={{ color: "var(--text-2)" }}>platform</strong> values: amazon, flipkart, meesho &nbsp;·&nbsp;
          <strong style={{ color: "var(--text-2)" }}>date</strong> format: YYYY-MM-DD &nbsp;·&nbsp;
          <strong style={{ color: "var(--text-2)" }}>return_flag</strong>: 0 or 1
        </div>
      </div>

      {/* Drop zone */}
      {!result && (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
            onClick={() => ref.current?.click()}
            className="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all mb-3"
            style={{
              borderColor: dragging ? "var(--accent)" : "var(--border-2)",
              background: dragging ? "var(--accent-bg)" : "var(--bg-card)",
            }}
          >
            <input ref={ref} type="file" accept=".csv" className="hidden" onChange={e => pick(e.target.files[0])} />
            <div className="text-2xl mb-2" style={{ color: "var(--text-3)" }}>↑</div>
            {file ? (
              <>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{file.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{(file.size/1024).toFixed(1)} KB</div>
              </>
            ) : (
              <>
                <div className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Drop CSV here or click to browse</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>amazon_orders.csv, flipkart_orders.csv, etc.</div>
              </>
            )}
          </div>

          {/* Sample CSV download hint */}
          <div className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
            💡 Export from Amazon Seller Central → Reports → Business Reports → By ASIN, then map columns to the schema above.
          </div>

          {err && (
            <div className="rounded-xl px-3 py-2 text-xs mb-3"
              style={{ background: "var(--red-bg)", color: "var(--red)" }}>{err}</div>
          )}

          {file && (
            <div className="flex gap-2">
              <button onClick={doUpload} disabled={uploading} className="btn-primary flex-1">
                {uploading ? "Uploading…" : "Upload & Import"}
              </button>
              <button onClick={reset} className="btn-ghost">Clear</button>
            </div>
          )}
        </>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl p-4 fade-up"
          style={{ background: result.rows_ingested > 0 ? "var(--green-bg)" : "var(--amber-bg)",
            border: `1px solid color-mix(in srgb, ${result.rows_ingested > 0 ? "var(--green)" : "var(--amber)"} 30%, transparent)` }}>
          <div className="text-sm font-semibold mb-2"
            style={{ color: result.rows_ingested > 0 ? "var(--green)" : "var(--amber)" }}>
            {result.rows_ingested > 0 ? "✓ Import complete" : "⚠ Import completed with warnings"}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="section-label mb-0.5">Rows Imported</div>
              <div className="text-xl font-bold" style={{ color: "var(--text)" }}>{result.rows_ingested}</div>
            </div>
            <div>
              <div className="section-label mb-0.5">Duplicates Skipped</div>
              <div className="text-xl font-bold" style={{ color: "var(--amber)" }}>{result.duplicates_skipped}</div>
            </div>
          </div>
          <div className="text-xs mb-3" style={{ color: "var(--text-2)" }}>{result.message}</div>
          {result.columns_detected?.length > 0 && (
            <div className="text-xs" style={{ color: "var(--text-3)" }}>
              Detected columns: {result.columns_detected.join(", ")}
            </div>
          )}
          <button onClick={() => { reset(); setOpen(false); }} className="btn-ghost text-xs mt-3">Done</button>
        </div>
      )}
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────────── */
function StatCard({ label, value, sub, delay = 0 }) {
  return (
    <div className="card p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="section-label mb-2">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{sub}</div>}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function MarketplaceHub() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    fetchMarketplaceHub()
      .then(setData).catch(() => setError("Failed to load marketplace data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Marketplace Command Center</h1>
      </div>
      <div className="page-body">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (error) return (
    <div>
      <div className="page-header"><h1 className="page-title">Marketplace Command Center</h1></div>
      <div className="page-body">
        <div className="card p-5" style={{ background: "var(--red-bg)", borderColor: "color-mix(in srgb, var(--red) 30%, transparent)" }}>
          <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>
        </div>
      </div>
    </div>
  );

  const { total_revenue, total_orders, total_profit, overall_margin_pct,
    platform_summary, weekly_revenue, alerts, arbitrage_insights } = data;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Marketplace Command Center</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Amazon · Flipkart · Meesho — unified seller intelligence
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["amazon","flipkart","meesho"].map(p => <PPill key={p} p={p} />)}
        </div>
      </div>

      <div className="page-body">

        {/* CSV Upload Panel */}
        <UploadPanel />

        {/* Active alerts */}
        {alerts?.length > 0 && (
          <div className="card p-4 fade-up"
            style={{ background: "var(--red-bg)", borderColor: "color-mix(in srgb, var(--red) 25%, transparent)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative pulse-dot inline-block w-2 h-2 rounded-full" style={{ background: "var(--red)", color: "var(--red)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--red)" }}>
                {alerts.length} active alert{alerts.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {alerts.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-2)" }}>
                  <span style={{ color: a.severity === "high" ? "var(--red)" : "var(--amber)" }}>●</span>
                  {a.message}
                </div>
              ))}
              {alerts.length > 5 && <div className="text-xs" style={{ color: "var(--text-3)" }}>+{alerts.length-5} more…</div>}
            </div>
          </div>
        )}

        {/* KPI tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Revenue"  value={INR(total_revenue)}       sub="All platforms"          delay={0} />
          <StatCard label="Total Orders"   value={NUM(total_orders)}        sub="Combined order count"   delay={50} />
          <StatCard label="Total Profit"   value={INR(total_profit)}        sub="After fees & shipping"  delay={100} />
          <StatCard label="Overall Margin" value={PCT(overall_margin_pct)}  sub="Net margin all platforms" delay={150} />
        </div>

        {/* Platform cards */}
        <section>
          <div className="section-label mb-3">Platform Performance</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {platform_summary.map((p, i) => (
              <div key={p.platform} className="card p-5 fade-up" style={{ animationDelay: `${i*60}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <PPill p={p.platform} />
                  <span className="text-sm font-bold mono" style={{ color: "var(--text-3)" }}>{p.share_pct}% share</span>
                </div>
                <div className="kpi-value">{INR(p.revenue)}</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{NUM(p.orders)} orders</div>

                {/* Share bar */}
                <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${p.share_pct}%`, background: P_COLOR[p.platform] }} />
                </div>

                <div className="mt-3 flex justify-between text-xs pt-3"
                  style={{ borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-3)" }}>Profit</span>
                  <span className="font-semibold mono"
                    style={{ color: p.profit >= 0 ? "var(--green)" : "var(--red)" }}>
                    {INR(p.profit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly trend chart */}
        <section>
          <div className="section-label mb-3">8-Week Revenue Trend</div>
          <div className="card p-5">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weekly_revenue} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
                <defs>
                  {Object.entries(P_COLOR).map(([k, col]) => (
                    <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={col} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={col} stopOpacity={0}   />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--text-3)" }} width={52} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Legend formatter={v => P_LABEL[v] || v} wrapperStyle={{ fontSize: 12, color: "var(--text-2)" }} />
                {Object.entries(P_COLOR).map(([p, col]) => (
                  <Area key={p} type="monotone" dataKey={p} stroke={col} strokeWidth={2}
                    fill={`url(#g-${p})`} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Revenue bar + Arbitrage side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="section-label mb-3">Revenue by Platform</div>
            <div className="card p-5">
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={platform_summary} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}
                    tick={{ fontSize: 10, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="platform" tick={{ fontSize: 12, fill: "var(--text-2)" }}
                    width={68} axisLine={false} tickLine={false} tickFormatter={v => P_LABEL[v] || v} />
                  <Tooltip formatter={v => [INR(v), "Revenue"]}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, color: "var(--text)" }} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {platform_summary.map(p => <Cell key={p.platform} fill={P_COLOR[p.platform]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Arbitrage */}
          <div>
            <div className="section-label mb-3">🔀 Arbitrage Opportunities</div>
            <div className="card p-4">
              {arbitrage_insights?.length ? (
                <div className="flex flex-col gap-3">
                  {arbitrage_insights.map((a, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-xl p-3"
                      style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{a.name}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: "var(--text-3)" }}>
                          <PPill p={a.low_platform} />
                          <span>{INR(a.low_price)}</span>
                          <span>→</span>
                          <PPill p={a.high_platform} />
                          <span>{INR(a.high_price)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold" style={{ color: "var(--green)" }}>+{INR(a.gain_per_unit)}</div>
                        <div className="text-[10px]" style={{ color: "var(--text-3)" }}>extra/unit</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-center py-6" style={{ color: "var(--text-3)" }}>No significant price gaps detected</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
