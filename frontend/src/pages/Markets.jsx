import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  return `${sign}${(n * 100).toFixed(2)}%`;
}

function Sparkline({ series }) {
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer>
        <LineChart data={series}>
          <XAxis dataKey="t" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            contentStyle={{
              background: "rgba(2,6,23,0.95)",
              border: "1px solid rgba(30,41,59,1)",
              borderRadius: 12,
            }}
            labelFormatter={() => ""}
            formatter={(val) => [Number(val).toFixed(2), "Price"]}
          />
          <Line
            type="monotone"
            dataKey="v"
            stroke="rgb(139, 54, 120)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Markets() {
  const [tickersInput, setTickersInput] = useState("AAPL,MSFT,TSLA,AMZN");
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadQuotes(tickers) {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/market/quotes", {
        params: { tickers },
      });
      setQuotes(res.data.quotes || []);
    } catch (e) {
      setError("Failed to load market quotes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotes(tickersInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsedTickers = useMemo(
    () =>
      tickersInput
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 10),
    [tickersInput],
  );

  return (
    <Container>
      <div className="flex items-end justify-between gap-4 pb-4">
        <div>
          <div className="text-lg font-semibold tracking-tight text-black">
            Markets
          </div>
          <div className="mt-1 text-sm text-black">
            Quotes and sparkline trend (Stooq with simulated fallback).
          </div>
        </div>

        <div className="flex w-full max-w-xl items-center gap-2">
          <input
            value={tickersInput}
            onChange={(e) => setTickersInput(e.target.value)}
            className="w-full rounded-xl bg-[#988aec]/30 px-3 py-2 text-sm text-black outline-none focus:border-sky-500/60"
            placeholder="AAPL,MSFT,TSLA"
          />
          <button
            onClick={() => loadQuotes(parsedTickers.join(","))}
            className="rounded-xl bg-[#988aec]/30 px-4 py-2 text-sm font-semibold text-black shadow-sm shadow-sky-500/30 transition hover:bg-sky-400"
          >
            View
          </button>
        </div>
      </div>

      {loading ? (
        <Card title="Loading quotes">
          <div className="text-sm text-[#59168b]">Fetching quotes…</div>
        </Card>
      ) : error ? (
        <Card title="Unable to load" subtitle="Try refreshing.">
          <div className="text-sm text-rose-200">{error}</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q) => (
            <Card
              key={q.ticker}
              title={q.ticker}
              subtitle={q.series?.length ? `Data points: ${q.series.length}` : ""}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold tracking-tight text-black">
                    {fmtMoney(q.price)}
                  </div>
                  <div
                    className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${
                      q.day_change_pct >= 0
                        ? "bg-emerald-600/10 text-emerald-800 ring-emerald-600/20"
                        : "bg-rose-800/10 text-rose-800 ring-rose-900/20"
                    }`}
                  >
                    {fmtPct(q.day_change_pct)}
                  </div>
                </div>
                <div className="w-28">
                  <Sparkline series={q.series || []} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}

