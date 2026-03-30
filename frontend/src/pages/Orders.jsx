import { useEffect, useState } from "react";

import { api } from "../api";
import { Card } from "../components/Card.jsx";
import { Container } from "../components/Container.jsx";

function fmtMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function Orders() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/orders");
      setOrders(res.data?.orders || []);
    } catch (e) {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container>
      <div className="flex items-end justify-between gap-3 pb-4">
        <div>
          <div className="text-lg font-semibold tracking-tight text-black">
            Orders
          </div>
          <div className="mt-1 text-sm text-slate-900">
            Simulated order history for this demo.
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
        <Card title="Loading orders">
          <div className="text-sm text-slate-300">Fetching history…</div>
        </Card>
      ) : error ? (
        <Card title="Unable to load" subtitle="Try again.">
          <div className="text-sm text-rose-200">{error}</div>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#988aec]/30">
          <div className="grid grid-cols-6 gap-0 bg-slate-950 px-4 py-3 text-xs font-semibold text-slate-300">
            <div>Order</div>
            <div className="text-right">Ticker</div>
            <div className="text-right">Side</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Price</div>
            <div className="text-right">Status</div>
          </div>
          <div className="divide-y divide-slate-800">
            {orders.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-6 px-4 py-3 text-sm text-black"
              >
                <div className="font-semibold text-black">{o.id}</div>
                <div className="text-right text-black">{o.ticker}</div>
                <div
                  className={`text-right font-semibold ${
                    o.side === "BUY" ? "text-emerald-500" : "text-rose-600"
                  }`}
                >
                  {o.side}
                </div>
                <div className="text-right text-black">{o.quantity}</div>
                <div className="text-right text-black">
                  {fmtMoney(o.price)}
                </div>
                <div className="text-right text-black">{o.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}

