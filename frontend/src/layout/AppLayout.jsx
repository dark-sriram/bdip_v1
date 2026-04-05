import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.jsx";

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto" style={{ color: "var(--text)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
