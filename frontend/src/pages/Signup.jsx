import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { API_BASE_URL } from "../config";
import { setToken, setUser } from "../auth/authStore";
import { fetchMe } from "../api";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
      });
      setToken(res.data.access_token);
      const me = await fetchMe();
      setUser(me);
      navigate("/insights", { replace: true });
    } catch (err) {
      setError("Signup failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#988aec]/30">
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-slate-800 bg-white p-6 shadow-xl shadow-slate-950/60">
          <div className="text-sm font-semibold text-black">
            BDIP
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-black">
            Create account
          </div>
          <div className="mt-1 text-sm text-black">
            Your JWT-protected dashboard.
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="space-y-1">
              <div className="text-sm text-black">Email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-[#988aec]/30 px-3 py-2 text-sm text-black outline-none focus:border-sky-500/60"
                placeholder="you@example.com"
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-black">Password</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full rounded-xl bg-[#988aec]/30 px-3 py-2 text-sm text-black outline-none focus:border-sky-500/60"
                placeholder="At least 8 characters"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-[#372aac]/50 px-4 py-2 text-sm font-semibold text-[#372aac] shadow-sm shadow-sky-500/30 transition hover:bg-[#372aac]/20 disabled:opacity-60"
              type="submit"
            >
              {loading ? "Creating..." : "Create account"}
            </button>

            <div className="text-center text-sm text-black">
              Already have an account?{" "}
              <a className="text-[#372aac] hover:text-[#372aac]/50" href="/login">
                Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

