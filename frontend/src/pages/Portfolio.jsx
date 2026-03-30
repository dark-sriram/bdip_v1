import { useEffect, useState } from "react";

import { api } from "../api";
import { Card } from "../components/Card.jsx";
import { Container } from "../components/Container.jsx";

function fmtMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function fmtPct(v) {
  const n = Number(v || 0);
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/portfolio/summary");
      setData(res.data);
    } catch (e) {
      setError("Failed to load portfolio.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = data?.totals;
  const holdings = data?.holdings || [];

  return (
    <Container>
      <div className="flex items-end justify-between gap-3 pb-4">
        <div>
          <div className="text-lg font-semibold tracking-tight text-black">
            Portfolio
          </div>
          <div className="mt-1 text-sm text-slate-900">
            Simulated holdings seeded per user.
          </div>
        </div>
        <button
          onClick={load}
          className="rounded-xl bg-[#988aec]/30 px-4 py-2 text-sm font-semibold text-black shadow-sm shadow-[#988aec]/30 transition hover:bg-[#988aec]/50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <Card title="Loading portfolio">
          <div className="text-sm text-slate-300">Fetching holdings…</div>
        </Card>
      ) : error ? (
        <Card title="Unable to load" subtitle="Try again.">
          <div className="text-sm text-rose-200">{error}</div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            <Card title="Market value" subtitle="Total holdings value">
              <div className="text-2xl font-semibold tracking-tight text-black">
                {fmtMoney(totals?.market_value)}
              </div>
            </Card>
            <Card title="PnL" subtitle="Profit / loss (simulated)">
              <div className="text-2xl font-semibold tracking-tight text-black">
                {fmtMoney(totals?.pnl)}
              </div>
            </Card>
            <Card title="PnL %" subtitle="Relative performance">
              <div className="text-2xl font-semibold tracking-tight text-black">
                <span
                  className={
                    (Number(totals?.pnl_pct || 0) >= 0
                      ? "text-emerald-600"
                      : "text-rose-700") + " "
                  }
                >
                  {fmtPct(totals?.pnl_pct)}
                </span>
              </div>
            </Card>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl bg-[#988aec]/30">
            <div className="grid grid-cols-4 gap-0 bg-black px-4 py-3 text-xs font-semibold text-white">
              <div>Ticker</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Price</div>
              <div className="text-right">PnL</div>
            </div>
            <div className="divide-y divide-slate-800">
              {holdings.map((h) => (
                <div
                  key={h.ticker}
                  className="grid grid-cols-4 px-4 py-3 text-sm text-black"
                >
                  <div className="font-semibold text-black">{h.ticker}</div>
                  <div className="text-right text-black">{h.quantity}</div>
                  <div className="text-right text-black">
                    {fmtMoney(h.current_price)}
                  </div>
                  <div
                    className={`text-right font-semibold ${
                      Number(h.pnl_pct) >= 0 ? "text-emerald-500" : "text-rose-600"
                    }`}
                  >
                    {fmtMoney(h.pnl)} ({fmtPct(h.pnl_pct)})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Container>
  );
}

