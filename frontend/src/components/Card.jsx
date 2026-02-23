export function Card({ title, subtitle, children, right }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
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
      <div className="mt-4">{children}</div>
    </div>
  );
}

