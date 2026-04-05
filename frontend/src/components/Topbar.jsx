import { useEffect, useState } from "react";
import { fetchMe } from "../api";

export function Topbar({ title, subtitle }) {
  const [email, setEmail] = useState("");
  useEffect(() => { fetchMe().then(u => setEmail(u.email)).catch(() => {}); }, []);
  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-6"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
      <div>
        {title && <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</div>}
        {subtitle && <div className="text-xs" style={{ color: "var(--text-3)" }}>{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: "var(--accent)" }}>
          {email ? email[0].toUpperCase() : "?"}
        </div>
        <span className="hidden text-xs sm:block" style={{ color: "var(--text-3)" }}>{email}</span>
      </div>
    </header>
  );
}
