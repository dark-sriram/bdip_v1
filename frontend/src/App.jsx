import { Navigate, Route, Routes } from "react-router-dom";

import PrivateRoute from "./components/PrivateRoute.jsx";
import AppLayout from "./layout/AppLayout.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Insights from "./pages/Insights.jsx";
import Markets from "./pages/Markets.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Watchlist from "./pages/Watchlist.jsx";
import Orders from "./pages/Orders.jsx";
import Account from "./pages/Account.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/insights" element={<Insights />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/account" element={<Account />} />

          <Route path="/" element={<Navigate to="/insights" replace />} />
          <Route path="*" element={<Navigate to="/insights" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

