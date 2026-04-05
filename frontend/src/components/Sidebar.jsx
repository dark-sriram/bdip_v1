import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { clearToken } from "../auth/authStore";
import { getTheme, setTheme } from "../auth/themeStore";

const MAIN_NAV = [
  { to: "/dashboard",   label: "Dashboard",     icon: "⬡" },
  { to: "/decisions",   label: "Decisions",      icon: "✓" },
  { to: "/alerts",      label: "Alerts",         icon: " ⚡︎ " },
  { to: "/ask",         label: "Ask AI",         icon: "◈" },
  { to: "/upload",      label: "Data Upload",    icon: "↑" },
];

const MARKETPLACE_NAV = [
  { to: "/marketplace",          label: "Command Center", icon: "◉" },
  { to: "/marketplace/products", label: "Products",       icon: "⊞" },
  { to: "/marketplace/profit",   label: "Profit Leakage", icon: "⊘" },
  { to: "/marketplace/restock",  label: "Restock Planner",icon: "⬆" },
];

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/marketplace"}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
          isActive
            ? "bg-[var(--accent)] text-white shadow-sm"
            : "text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text)]"
        }`
      }
    >
      <span className="text-base leading-none w-4 text-center">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}


export function Sidebar() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(getTheme() === "dark");

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    setTheme(next);
    setDark(!dark);
  }

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <aside
      className="hidden w-60 shrink-0 flex-col border-r p-4 md:flex"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2.5 px-1 pt-1">
        {/* <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          B
        </div> */}
        <div>
          <div className="text-sm font-bold tracking-tight" style={{ color: "var(--text)" }}>BDIP</div>
          <div className="text-[9px] uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Intelligence Platform
          </div>
        </div>
      </div>

      {/* Core nav */}
      <nav className="flex flex-col gap-0.5">
        <div className="section-label mb-1.5 px-3">Core</div>
        {MAIN_NAV.map((it) => <NavItem key={it.to} {...it} />)}
      </nav>

      {/* Marketplace nav */}
      <nav className="mt-5 flex flex-col gap-0.5">
        <div className="section-label mb-1.5 px-3">Marketplace</div>
        {MARKETPLACE_NAV.map((it) => <NavItem key={it.to} {...it} />)}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom controls */}
      <div className="mt-4 flex flex-col gap-0.5 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:bg-[var(--bg-2)]"
          style={{ color: "var(--text-2)" }}
        >
          <span className="w-4 text-center text-base">{dark ? "☀" : "☾"}</span>
          {dark ? "Light mode" : "Dark mode"}
        </button>

        <NavItem to="/account" label="Account" icon="◎" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:bg-red-50 dark:hover:bg-red-950/30"
          style={{ color: "var(--text-3)" }}
        >
          <span className="w-4 text-center">→</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
