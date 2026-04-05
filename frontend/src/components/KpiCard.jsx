export function KpiCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <div className="section-label mb-2">{label}</div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{hint}</div>}
    </div>
  );
}
