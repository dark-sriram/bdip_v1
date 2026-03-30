import { Navigate, Outlet } from "react-router-dom";

import { getToken } from "../auth/authStore";

export default function PrivateRoute() {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

