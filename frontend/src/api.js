import axios from "axios";
import { API_BASE_URL } from "./config";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export async function fetchDashboard() {
  const res = await api.get("/dashboard");
  return res.data;
}

