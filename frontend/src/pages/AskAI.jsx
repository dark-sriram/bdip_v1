import { useState, useRef, useEffect } from "react";
import { postNLQuery } from "../api";

const CHIPS = [
  "Why did conversion rate drop?",
  "What is my total revenue?",
  "Which channel converts best?",
  "How is mobile performing?",
  "What is customer LTV?",
  "How many sessions do I have?",
  "What is the funnel drop-off?",
  "Are there active alerts?",
];

function DataTable({ data }) {
  const entries = Object.entries(data);
  if (!entries.length) return null;
  return (
    <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ background: "var(--bg-2)", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
        Supporting Data
      </div>
      <div className="divide-y" style={{ divideColor: "var(--border)" }}>
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between px-3 py-1.5 text-xs"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text-3)" }}>{k.replace(/_/g, " ")}</span>
            <span className="mono font-semibold" style={{ color: "var(--text)" }}>
              {typeof v === "number"
                ? v < 1 && v > 0 ? `${(v * 100).toFixed(2)}%`
                : v > 100 ? `$${v.toFixed(2)}`
                : v.toFixed(2)
                : String(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SqlBlock({ sql }) {
  if (!sql) return null;
  // return (
  //   <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
  //     <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
  //       style={{ background: "var(--bg-2)", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
  //       SQL Equivalent
  //     </div>
  //     <pre className="px-3 py-2 text-[11px] mono overflow-x-auto whitespace-pre-wrap"
  //       style={{ color: "var(--green)", background: "var(--bg-card)" }}>
  //       {sql}
  //     </pre>
  //   </div>
  // );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} fade-up`}>
      {!isUser && (
        <div className="flex items-start gap-2.5 max-w-2xl w-full">
          <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white mt-0.5"
            style={{ background: "var(--accent)" }}>AI</div>
          <div className="flex-1">
            {msg.confidence != null && (
              <div className="text-[10px] mb-1 flex items-center gap-1.5" style={{ color: "var(--text-3)" }}>
                <span>BDIP Intelligence Engine</span>
                <span>·</span>
                <span className="mono">{Math.round(msg.confidence * 100)}% confidence</span>
              </div>
            )}
            <div className="card px-4 py-3 text-sm" style={{ borderRadius: "4px 16px 16px 16px" }}>
              <div style={{ color: "var(--text)" }}
                dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.+?)\*\*/g, `<strong style="color:var(--text)">$1</strong>`) }} />
              <DataTable data={msg.data || {}} />
              <SqlBlock sql={msg.sql} />
            </div>
          </div>
        </div>
      )}
      {isUser && (
        <div className="max-w-md px-4 py-3 text-sm font-medium rounded-[16px_4px_16px_16px]"
          style={{ background: "var(--accent)", color: "#fff" }}>
          {msg.content}
        </div>
      )}
    </div>
  );
}

export default function AskAI() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hello! I'm your BDIP Intelligence Engine. Ask me anything about your business metrics — conversion, revenue, churn, funnel, LTV, and more. I'll give you data-backed answers with SQL equivalents.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(q) {
    const question = q || input.trim();
    if (!question) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await postNLQuery(question);
      setMessages(prev => [...prev, {
        role: "assistant", content: res.answer,
        sql: res.sql_equivalent, data: res.supporting_data, confidence: res.confidence,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant", content: "Sorry — couldn't process that. Make sure the backend is running.",
      }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="page-header shrink-0">
        <div>
          <h1 className="page-title">Ask AI</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Natural language → instant data-backed answers</p>
        </div>
        <button onClick={() => setMessages([{ role: "assistant", content: "Conversation cleared. Ask me anything!" }])}
          className="btn-ghost text-xs">Clear</button>
      </div>

      {/* Quick chips */}
      <div className="px-7 py-3 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="section-label mb-2">Quick questions</div>
        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map(c => (
            <button key={c} onClick={() => send(c)} disabled={loading}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "var(--bg-2)" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-5">
        {messages.map((m, i) => <Message key={i} msg={m} />)}
        {loading && (
          <div className="flex items-center gap-3 text-xs fade-up" style={{ color: "var(--text-3)" }}>
            <div className="flex gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="skeleton inline-block w-1.5 h-1.5 rounded-full"
                  style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            Analysing your data…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-7 pb-6 pt-3 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all focus-within:border-[var(--accent)]"
          style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}>
          <input className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text)" }}
            placeholder="Ask about revenue, conversion, churn, funnel performance…"
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            disabled={loading} />
          <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-primary text-xs px-3 py-1.5">
            Send
          </button>
        </div>
        <p className="text-center text-[10px] mt-1.5" style={{ color: "var(--text-3)" }}>
          Answers grounded in your current dataset · SQL equivalents shown for transparency
        </p>
      </div>
    </div>
  );
}
