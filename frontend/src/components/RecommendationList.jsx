export function RecommendationList({ recommendations }) {
  if (!recommendations?.length) {
    return (
      <div className="card p-6 text-sm text-center" style={{ color: "var(--text-3)" }}>
        No recommendations yet. Once data flows through the funnel, the decision engine
        will surface prioritized actions here.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {recommendations.map(r => (
        <div key={r.id} className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{r.problem}</div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{r.area}</span>
              <span className={`badge badge-${r.severity}`}>{r.severity}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[["Evidence", r.evidence], ["Impact", r.impact], ["Action", r.action]].map(([label, val]) => (
              <div key={label} className="rounded-xl p-3" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                <div className="section-label mb-1">{label}</div>
                <div className="text-xs" style={{ color: "var(--text-2)" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
