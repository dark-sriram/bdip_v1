export function Card({ title, subtitle, children, right }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</div>}
            {subtitle && <div className="mt-0.5 text-xs" style={{ color: "var(--text-3)" }}>{subtitle}</div>}
          </div>
          {right && <div className="text-xs" style={{ color: "var(--text-3)" }}>{right}</div>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
