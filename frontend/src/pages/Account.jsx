import { useEffect, useState } from "react";
import { fetchMe } from "../api";
import { clearToken } from "../auth/authStore";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { fetchMe().then(setUser).catch(() => {}); }, []);

  function handleLogout() { clearToken(); navigate("/login"); }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Account</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Profile and platform settings</p>
        </div>
      </div>
      <div className="page-body max-w-lg">
        {user ? (
          <>
            <div className="card p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold text-white"
                  style={{ background: "var(--accent)" }}>
                  {user.email[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{user.email}</div>
                  <div className="text-xs" style={{ color: "var(--text-3)" }}>User ID: #{user.id}</div>
                </div>
              </div>
              <div className="rounded-xl p-3 text-xs" style={{ background: "var(--bg-2)", color: "var(--text-3)" }}>
                Member since: <span style={{ color: "var(--text-2)" }}>{user.created_at}</span>
              </div>
            </div>

            <div className="card p-5">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Platform Tier</div>
              <div className="flex items-center gap-3 mb-3">
                <span className="badge badge-accent px-3 py-1">FREE TIER</span>
                <span className="text-xs" style={{ color: "var(--text-3)" }}>Limited dashboards · Basic insights</span>
              </div>
              <div className="text-xs" style={{ color: "var(--text-3)" }}>
                Upgrade to <strong style={{ color: "var(--accent)" }}>Pro</strong> for AI insights + integrations, or{" "}
                <strong style={{ color: "var(--amber)" }}>Enterprise</strong> for custom analytics + SLA.
              </div>
            </div>

            <button onClick={handleLogout}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-colors"
              style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)" }}>
              Sign out
            </button>
          </>
        ) : (
          <div className="text-sm flex items-center gap-2" style={{ color: "var(--text-3)" }}>
            <span className="skeleton inline-block w-4 h-4 rounded-full" /> Loading…
          </div>
        )}
      </div>
    </div>
  );
}
