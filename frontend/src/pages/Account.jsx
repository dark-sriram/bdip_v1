import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, fetchMe } from "../api";
import { clearUser, logout, getUser } from "../auth/authStore";
import { Card } from "../components/Card.jsx";
import { Container } from "../components/Container.jsx";

export default function Account() {
  const navigate = useNavigate();
  const [user, setUserState] = useState(() => getUser());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await fetchMe();
        if (!mounted) return;
        setUserState(me);
      } catch {
        // handled by interceptor
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Container>
      <div className="pb-4">
        <div className="text-lg font-semibold tracking-tight text-black">
          Account
        </div>
        <div className="mt-1 text-sm text-slate-900">
          JWT-authenticated session details.
        </div>
      </div>

      <Card title="Profile" subtitle="Current user information">
        <div className="space-y-3 text-sm text-black">
          <div className="flex items-center justify-between gap-3">
            <div className="text-black">Email</div>
            <div className="font-semibold text-black">
              {user?.email || "—"}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-black">User ID</div>
            <div className="font-semibold text-black">
              {user?.id ?? "—"}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-black">Created</div>
            <div className="font-semibold text-black">
              {user?.created_at || "—"}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={onLogout}
            className="rounded-xl border border-[#988aec]/80 bg-[#988aec]/30 px-4 py-2 text-sm font-medium text-[#59168b] transition hover:bg-[#cfc9ee]/30"
          >
            Logout
          </button>
        </div>
      </Card>
    </Container>
  );
}

