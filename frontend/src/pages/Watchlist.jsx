import { useEffect, useMemo, useState } from "react";

import { api } from "../api";
import { Container } from "../components/Container.jsx";
import { Card } from "../components/Card.jsx";

function fmtMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function fmtPct(v) {
  const n = Number(v || 0);
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function Watchlist() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tickers, setTickers] = useState([]);
  const [quotes, setQuotes] = useState([]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const wl = await api.get("/watchlist");
      const tick = wl.data?.tickers || [];
      setTickers(tick);
      const res = await api.get("/market/quotes", {
        params: { tickers: tick.join(",") },
      });
      setQuotes(res.data?.quotes || []);
    } catch (e) {
      setError("Failed to load watchlist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quoteByTicker = useMemo(() => {
    const m = new Map();
    for (const q of quotes) m.set(q.ticker, q);
    return m;
  }, [quotes]);

  return (
    <Container>
      <div className="flex items-end justify-between gap-3 pb-4">
        <div>
          <div className="text-lg font-semibold tracking-tight text-black">
            Watchlist
          </div>
          <div className="mt-1 text-sm text-slate-900">
            Latest quotes for your saved tickers.
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
        <Card title="Loading watchlist">
          <div className="text-sm text-slate-300">Fetching quotes…</div>
        </Card>
      ) : error ? (
        <Card title="Unable to load" subtitle="Try again.">
          <div className="text-sm text-rose-200">{error}</div>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#988aec]/30">
          <div className="grid grid-cols-3 gap-0 bg-slate-950 px-4 py-3 text-xs font-semibold text-white">
            <div>Ticker</div>
            <div className="text-right">Price</div>
            <div className="text-right">Day</div>
          </div>
          {tickers.map((t) => {
            const q = quoteByTicker.get(t) || null;
            const day = q?.day_change_pct ?? 0;
            return (
              <div
                key={t}
                className="grid grid-cols-3 px-4 py-3 text-sm text-black odd:bg-[#988aec]/20 even:bg-[#988aec]/35"
              >
                <div className="font-semibold text-black">{t}</div>
                <div className="text-right text-black">
                  {q ? fmtMoney(q.price) : "—"}
                </div>
                <div
                  className={`text-right font-semibold ${
                    day >= 0 ? "text-emerald-500" : "text-rose-600"
                  }`}
                >
                  {q ? fmtPct(day) : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}

