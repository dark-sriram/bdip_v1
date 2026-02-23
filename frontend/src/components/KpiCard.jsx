import { Card } from "./Card.jsx";

export function KpiCard({ label, value, hint }) {
  return (
    <Card title={label} subtitle={hint}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-semibold tracking-tight text-slate-50">
          {value}
        </div>
        <div className="text-[0.65rem] uppercase tracking-wide text-slate-500">
          Key KPI
        </div>
      </div>
    </Card>
  );
}

