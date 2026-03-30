export function Card({ title, subtitle, children, right, topClass = "", bottomClass = "" }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-800/10 shadow-lg shadow-slate-500/10 bg-[#988aec]/10 backdrop-blur">
      
      {/* 🔝 Top Section */}
      <div className={`p-5 bg-[#988aec]/30 rounded-2xl ${topClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <div className="text-sm font-semibold text-black">{title}</div>
            )}
            {subtitle && (
              <div className="mt-1 text-xs text-black">{subtitle}</div>
            )}
          </div>
          {right && <div className="text-xs text-black">{right}</div>}
        </div>
      </div>

      {/* 🔽 Bottom Section */}
      <div className={`p-5 ${bottomClass}`}>
        {children}
      </div>

    </div>
  );
}