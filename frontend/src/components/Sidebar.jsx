import { NavLink } from "react-router-dom";

const items = [
  { to: "/insights", label: "Insights" },
  { to: "/markets", label: "Markets" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/orders", label: "Orders" },
];

function linkClass({ isActive }) {
  return isActive
    ? "rounded-xl border border-[#988aec]/80 bg-[#988aec]/30 px-3 py-2 text-sm font-semibold text-[#59168b]"
    : "rounded-xl px-3 py-2 text-sm font-medium text-black hover:bg-[#cfc9ee]/30 hover:text-[#59168b]/90";
}

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r bg-[#f6f8fe] p-4 md:block rounded-3xl">
      <div className="px-3 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-black">
          BDIP
        </div>
        <div className="mt-1 text-lg font-semibold text-black">
          Decision Dashboard
        </div>
      </div>

      <nav className="flex flex-col space-y-2">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} className={linkClass}>
            {it.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 px-3">
        <NavLink
          to="/account"
          className={({ isActive }) =>
            isActive
              ? "block rounded-xl border border-[#988aec]/80 bg-[#988aec]/30 px-3 py-2 text-sm font-semibold text-[#59168b]"
              : "block rounded-xl px-3 py-2 text-sm font-medium text-black hover:bg-[#cfc9ee]/30 hover:text-[#988aec]"
          }
        >
          Account
        </NavLink>
      </div>
    </aside>
  );
}

