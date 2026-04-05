import { useEffect, useState } from "react";
import { fetchDecisionHistory, updateDecisionOutcome, deleteDecision } from "../api";

function StatusBadge({ status }) {
  return (
    <span className={`badge ${status === "approved" ? "badge-low" : "badge text-[var(--text-3)] border-[var(--border)] bg-[var(--bg-2)]"} text-[9px]`}>
      {status === "approved" ? "✓ Approved" : "✗ Rejected"}
    </span>
  );
}

function DecisionRow({ entry, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState(entry.actual_result || "");

  async function save() {
    if (!result.trim()) return;
    await onUpdate(entry.id, result);
    setEditing(false);
  }

  return (
    <div className="card p-4 fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <StatusBadge status={entry.status} />
            <span className="text-[10px] mono" style={{ color: "var(--text-3)" }}>#{entry.id} · {entry.created_at}</span>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-3)" }}>
            {entry.recommendation_id.replace(/-/g, " ")}
          </div>
          <div className="text-sm" style={{ color: "var(--text)" }}>{entry.action}</div>
        </div>
        <button onClick={() => onDelete(entry.id)}
          className="text-[10px] px-2 py-1 rounded transition-colors hover:bg-[var(--red-bg)] hover:text-[var(--red)]"
          style={{ color: "var(--text-3)" }}>
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entry.expected_outcome && (
          <div className="rounded-xl p-3 border" style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}>
            <div className="section-label mb-1">Expected Outcome</div>
            <div className="text-xs" style={{ color: "var(--text-2)" }}>{entry.expected_outcome}</div>
          </div>
        )}
        <div className="rounded-xl p-3 border" style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}>
          <div className="section-label mb-1">
            Actual Result{entry.resolved_at && <span className="ml-1 normal-case" style={{ color: "var(--text-3)" }}>— {entry.resolved_at}</span>}
          </div>
          {editing ? (
            <div className="flex gap-2 mt-1">
              <input className="input text-xs py-1 flex-1" value={result}
                onChange={e => setResult(e.target.value)} placeholder="What actually happened…" autoFocus />
              <button onClick={save} className="btn-primary text-xs px-2 py-1">Save</button>
              <button onClick={() => setEditing(false)} className="btn-ghost text-xs px-2 py-1">✕</button>
            </div>
          ) : entry.actual_result ? (
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs" style={{ color: "var(--text-2)" }}>{entry.actual_result}</div>
              <button onClick={() => setEditing(true)} className="text-[10px] shrink-0 transition-colors"
                style={{ color: "var(--accent)" }}>Edit</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-[10px] transition-colors" style={{ color: "var(--accent)" }}>
              + Record actual result
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Decisions() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDecisionHistory().then(setHistory).catch(() => setError("Failed to load.")).finally(() => setLoading(false));
  }, []);

  async function handleUpdate(id, actual_result) {
    try {
      const updated = await updateDecisionOutcome(id, actual_result);
      setHistory(prev => prev.map(e => e.id === id ? updated : e));
    } catch {}
  }

  async function handleDelete(id) {
    try {
      await deleteDecision(id);
      setHistory(prev => prev.filter(e => e.id !== id));
    } catch {}
  }

  const approved = history.filter(h => h.status === "approved");
  const withOutcome = history.filter(h => h.actual_result);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Decision Tracker</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Log of all approved and rejected recommendations</p>
        </div>
        <button onClick={() => fetchDecisionHistory().then(setHistory)} className="btn-ghost text-xs">Refresh</button>
      </div>

      <div className="page-body">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Decisions", value: history.length, color: "var(--text)" },
            { label: "Approved", value: approved.length, color: "var(--green)" },
            { label: "Outcomes Logged", value: withOutcome.length, color: "var(--accent)" },
          ].map((s, i) => (
            <div key={s.label} className={`card p-5 fade-up-${i+1}`}>
              <div className="section-label mb-2">{s.label}</div>
              <div className="kpi-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-sm flex items-center gap-2" style={{ color: "var(--text-3)" }}>
            <span className="skeleton w-3 h-3 rounded-full inline-block" /> Loading…
          </div>
        ) : error ? (
          <div className="card p-4" style={{ background: "var(--red-bg)", borderColor: "var(--red)", color: "var(--red)" }}>{error}</div>
        ) : history.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3" style={{ color: "var(--text-3)" }}>◎</div>
            <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>No decisions logged yet</div>
            <div className="text-xs" style={{ color: "var(--text-3)" }}>
              Approve or reject recommendations from the Dashboard to track decisions here.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(e => (
              <DecisionRow key={e.id} entry={e} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
