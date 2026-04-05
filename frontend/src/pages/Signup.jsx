import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { setToken } from "../auth/authStore";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/register", { email, password });
      setToken(res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Registration failed.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold text-white mb-3"
            style={{ background: "var(--accent)" }}>B</div> */}
          <div className="text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>BDIP</div>
          <div className="text-xs mt-0.5 uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Business Decision Intelligence Platform
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Create your account</div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="section-label block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@company.com" />
            </div>
            <div>
              <label className="section-label block mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input" placeholder="Min. 6 characters" />
            </div>
            {error && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{error}</div>
            )}
            <button type="submit" disabled={loading} className="btn-primary mt-1 py-2.5">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
        <div className="text-center mt-4 text-xs" style={{ color: "var(--text-3)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold" style={{ color: "var(--accent)" }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
