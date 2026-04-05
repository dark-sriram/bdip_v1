import { Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute.jsx";
import AppLayout from "./layout/AppLayout.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Decisions from "./pages/Decisions.jsx";
import Alerts from "./pages/AlertsPage.jsx";
import AskAI from "./pages/AskAI.jsx";
import DataUpload from "./pages/DataUpload.jsx";
import Account from "./pages/Account.jsx";
import MarketplaceHub from "./pages/marketplace/MarketplaceHub.jsx";
import MarketplaceProducts from "./pages/marketplace/MarketplaceProducts.jsx";
import MarketplaceProfitLeakage from "./pages/marketplace/MarketplaceProfitLeakage.jsx";
import MarketplaceRestock from "./pages/marketplace/MarketplaceRestock.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/ask" element={<AskAI />} />
          <Route path="/upload" element={<DataUpload />} />
          <Route path="/account" element={<Account />} />
          <Route path="/marketplace" element={<MarketplaceHub />} />
          <Route path="/marketplace/products" element={<MarketplaceProducts />} />
          <Route path="/marketplace/profit" element={<MarketplaceProfitLeakage />} />
          <Route path="/marketplace/restock" element={<MarketplaceRestock />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
