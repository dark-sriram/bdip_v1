import { Badge } from "./Badge.jsx";

export function RecommendationList({ recommendations }) {
  if (!recommendations?.length) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
        No recommendations yet. Once data flows through the funnel, the decision engine
        will surface prioritized actions here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((r) => (
        <div
          key={r.id}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-md shadow-slate-950/60"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-50">{r.problem}</div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-400">{r.area}</div>
              <Badge severity={r.severity} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs font-semibold text-slate-300">Evidence</div>
              <div className="mt-1 text-sm text-slate-200">{r.evidence}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs font-semibold text-slate-300">Impact</div>
              <div className="mt-1 text-sm text-slate-200">{r.impact}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs font-semibold text-slate-300">
                Recommended action
              </div>
              <div className="mt-1 text-sm text-slate-200">{r.action}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

