export function Card({ title, subtitle, children, right }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/60 backdrop-blur">
      <div className="pointer-events-none absolute inset-px rounded-2xl bg-gradient-to-br from-slate-100/5 via-slate-100/0 to-sky-400/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          {title ? (
            <div className="text-sm font-semibold text-slate-100">{title}</div>
          ) : null}
          {subtitle ? (
            <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
          ) : null}
        </div>
        {right ? <div className="text-xs text-slate-400">{right}</div> : null}
      </div>
      <div className="relative mt-4">{children}</div>
    </div>
  );
}

