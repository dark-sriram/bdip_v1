import axios from "axios";
import { API_BASE_URL } from "./config";
import { clearToken } from "./auth/authStore";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bdip_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      clearToken();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const fetchDashboard = () => api.get("/dashboard").then((r) => r.data);
export const fetchMetrics = () => api.get("/metrics/summary").then((r) => r.data);
export const fetchRecommendations = () => api.get("/recommendations").then((r) => r.data);
export const fetchAlerts = () => api.get("/alerts").then((r) => r.data);
export const fetchForecasts = () => api.get("/forecasts").then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data);

export const postNLQuery = (question) =>
  api.post("/query", { question }).then((r) => r.data);

export const approveDecision = (recommendation_id, action, expected_outcome) =>
  api.post("/decisions/approve", { recommendation_id, action, expected_outcome }).then((r) => r.data);

export const rejectDecision = (recommendation_id, reason) =>
  api.post("/decisions/reject", { recommendation_id, reason }).then((r) => r.data);

export const fetchDecisionHistory = () =>
  api.get("/decisions/history").then((r) => r.data);

export const updateDecisionOutcome = (id, actual_result) =>
  api.patch(`/decisions/${id}/outcome`, { actual_result }).then((r) => r.data);

export const deleteDecision = (id) =>
  api.delete(`/decisions/${id}`);

export const uploadCSV = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/data/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

// ── Marketplace ───────────────────────────────────────────────────────────────
export const fetchMarketplaceHub      = () => api.get("/marketplace/command-center").then(r => r.data);
export const fetchMarketplaceProducts = () => api.get("/marketplace/products").then(r => r.data);
export const fetchMarketplaceProfit   = () => api.get("/marketplace/profit-leakage").then(r => r.data);
export const fetchMarketplaceRestock  = () => api.get("/marketplace/restock").then(r => r.data);

export const uploadMarketplaceCSV = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/marketplace/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);
};
