import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { fetchMe } from "../api";
import { getUser, logout, setUser } from "../auth/authStore";
import { Sidebar } from "../components/Sidebar.jsx";
import { Topbar } from "../components/Topbar.jsx";

export default function AppLayout() {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState(() => getUser());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await fetchMe();
        if (!mounted) return;
        setUser(me);
        setLocalUser(me);
      } catch {
        // api interceptor handles redirect for 401; keep UI stable otherwise.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const userDisplay = useMemo(() => {
    if (!user?.email) return "Account";
    return user.email;
  }, [user]);

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-slate-100">
      <div className="flex">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar userDisplay={userDisplay} onLogout={onLogout} />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

