export function Topbar({ userDisplay, onLogout }) {
  return (
    <div className="sticky top-0 z-10 bg-[#ffffff] backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <div>
          <div className="text-sm font-semibold text-black">
            Dashboard
          </div>
          <div className="text-xs text-black">
            Insights + Markets + Portfolio + Decisions
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-slate-200 bg-slate-300/20 px-3 py-1 text-xs text-black md:block">
            Signed in as <span className="font-semibold">{userDisplay}</span>
          </div>
          <button
            onClick={onLogout}
            className="rounded-xl border border-slate-200 bg-slate-930/20 px-3 py-2 text-sm font-medium text-black hover:bg-[#ecebfe]"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

