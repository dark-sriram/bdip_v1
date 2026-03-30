import axios from "axios";
import { API_BASE_URL } from "./config";
import { clearToken } from "./auth/authStore";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

export async function fetchDashboard() {
  const res = await api.get("/dashboard");
  return res.data;
}

export async function fetchMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

