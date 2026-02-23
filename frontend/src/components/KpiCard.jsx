import { Card } from "./Card.jsx";

export function KpiCard({ label, value, hint }) {
  return (
    <Card title={label} subtitle={hint}>
      <div className="text-2xl font-semibold tracking-tight text-slate-50">
        {value}
      </div>
    </Card>
  );
}

