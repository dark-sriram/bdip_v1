import { useEffect, useState } from "react";
import { fetchMarketplaceProducts } from "../../api";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

const INR = v => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const PCT = v => `${Number(v || 0).toFixed(1)}%`;
const PLATFORM_COLORS = { amazon: "#e65100", flipkart: "#0d47a1", meesho: "#880e4f" };
const PLATFORM_LABELS = { amazon: "Amazon", flipkart: "Flipkart", meesho: "Meesho" };

function Stars({ rating }) {
  if (!rating) return <span style={{ color: "var(--text-3)" }}>—</span>;
  const full = Math.floor(rating);
  return (
    <span className="flex items-center gap-1">
      <span className="font-semibold mono text-xs">{rating.toFixed(1)}</span>
      <span style={{ color: "#f59e0b" }}>{"★".repeat(full)}{"☆".repeat(5 - full)}</span>
    </span>
  );
}

function PlatformRow({ p }) {
  const color = PLATFORM_COLORS[p.platform];
  const isNeg = p.profit_per_unit < 0;
  return (
    <div className="grid grid-cols-7 items-center gap-3 px-4 py-2.5 text-xs border-b last:border-0"
      style={{ borderColor: "var(--border)" }}>
      <div>
        <span className={`badge pill-${p.platform}`}>{PLATFORM_LABELS[p.platform]}</span>
      </div>
      <div className="font-semibold mono" style={{ color: "var(--text)" }}>{INR(p.price)}</div>
      <div className="mono">{p.orders.toLocaleString()}</div>
      <div className="mono" style={{ color: isNeg ? "var(--red)" : "var(--green)" }}>
        {INR(p.profit_per_unit)}/unit
      </div>
      <div>
        <span className={`badge ${p.margin_pct < 0 ? "badge-high" : p.margin_pct < 10 ? "badge-medium" : "badge-low"}`}>
          {PCT(p.margin_pct)}
        </span>
      </div>
      <div>
        <span className={p.return_rate > 15 ? "text-[var(--red)] font-semibold" : ""}>{p.return_rate}%</span>
      </div>
      <div><Stars rating={p.rating} /></div>
    </div>
  );
}

function ProductCard({ prod, isSelected, onClick }) {
  const isGood = prod.total_revenue > 30000;
  return (
    <div onClick={onClick} className={`card p-4 cursor-pointer transition-all ${isSelected ? "ring-2 ring-[var(--accent)]" : ""}`}
      style={{ background: isSelected ? "var(--accent-bg)" : undefined }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs font-semibold" style={{ color: "var(--text)" }}>{prod.name}</div>
          <div className="text-[10px]" style={{ color: "var(--text-3)" }}>{prod.id} · {prod.category}</div>
        </div>
        <Stars rating={prod.avg_rating} />
      </div>
      <div className="text-lg font-bold mono mt-1" style={{ color: "var(--text)" }}>{INR(prod.total_revenue)}</div>
      <div className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>{prod.total_orders} orders</div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-[10px]">
          Best: <span className={`badge pill-${prod.best_platform} text-[9px]`}>{PLATFORM_LABELS[prod.best_platform]}</span>
        </div>
        {!isGood && <span className="badge badge-medium text-[9px]">Low performer</span>}
      </div>
    </div>
  );
}

export default function MarketplaceProducts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchMarketplaceProducts()
      .then(d => { setData(d); setSelected(d.products[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-body">
      <div className="page-header"><h1 className="page-title">Product Intelligence</h1></div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    </div>
  );

  const products = data?.products || [];
  const prod = selected;

  const radarData = prod ? prod.platforms.map(p => ({
    platform: PLATFORM_LABELS[p.platform],
    orders: p.orders,
    margin: Math.max(0, p.margin_pct),
    rating: (p.rating || 0) * 20,
    returns: Math.max(0, 100 - p.return_rate * 4),
  })) : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Intelligence</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Deep-dive into product performance across all platforms</p>
        </div>
      </div>

      <div className="page-body">
        {/* Product grid */}
        <section>
          <div className="section-label mb-3">All Products — Click to Deep Dive</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {products.map(p => (
              <ProductCard key={p.id} prod={p} isSelected={selected?.id === p.id} onClick={() => setSelected(p)} />
            ))}
          </div>
        </section>

        {/* Detail panel */}
        {prod && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Platform breakdown table */}
            <div className="md:col-span-2 card overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}>
                <div className="font-semibold" style={{ color: "var(--text)" }}>{prod.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{prod.insight}</div>
              </div>
              {/* Table header */}
              <div className="grid grid-cols-7 gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: "var(--bg-2)", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
                <div>Platform</div><div>Price</div><div>Orders</div>
                <div>Profit</div><div>Margin</div><div>Returns</div><div>Rating</div>
              </div>
              {prod.platforms.map(p => <PlatformRow key={p.platform} p={p} />)}

              {/* AI Insight footer */}
              <div className="px-4 py-3 text-xs rounded-b-2xl" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                💡 AI Insight: {prod.insight}
              </div>
            </div>

            {/* Radar chart */}
            <div className="card p-4">
              <div className="section-label mb-3">Platform Score Radar</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="platform" tick={{ fontSize: 11, fill: "var(--text-2)" }} />
                  <Radar name="Orders" dataKey="orders" stroke={PLATFORM_COLORS.amazon}
                    fill={PLATFORM_COLORS.amazon} fillOpacity={0.15} />
                  <Radar name="Margin" dataKey="margin" stroke={PLATFORM_COLORS.flipkart}
                    fill={PLATFORM_COLORS.flipkart} fillOpacity={0.15} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-[10px]">
                <span style={{ color: PLATFORM_COLORS.amazon }}>● Orders</span>
                <span style={{ color: PLATFORM_COLORS.flipkart }}>● Margin</span>
              </div>
            </div>
          </section>
        )}

        {/* Cross-platform price comparison */}
        <section>
          <div className="section-label mb-3">Price Comparison Across All Products</div>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: "var(--bg-2)", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
              <div>Product</div>
              <div>Amazon</div><div>Flipkart</div><div>Meesho</div>
              <div>Best Platform</div>
            </div>
            {products.map(p => {
              const best = p.platforms.reduce((a, b) => a.margin_pct > b.margin_pct ? a : b);
              return (
                <div key={p.id} className="grid grid-cols-5 gap-2 px-4 py-2.5 text-sm border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{p.name}</div>
                  {p.platforms.map(pl => (
                    <div key={pl.platform} className="mono text-xs" style={{ color: "var(--text-2)" }}>
                      {INR(pl.price)}
                      <span className="ml-1 text-[9px]" style={{ color: pl.margin_pct < 10 ? "var(--red)" : "var(--green)" }}>
                        ({PCT(pl.margin_pct)})
                      </span>
                    </div>
                  ))}
                  <div>
                    <span className={`badge pill-${best.platform} text-[9px]`}>
                      {PLATFORM_LABELS[best.platform]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
