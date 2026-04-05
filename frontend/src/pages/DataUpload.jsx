import { useRef, useState } from "react";
import { uploadCSV } from "../api";

const REQUIRED = ["session_id","user_id","timestamp","page","event_type","device","source"];
const OPTIONAL = ["amount","converted"];

export default function DataUpload() {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function pick(f) {
    if (f?.name.endsWith(".csv")) { setFile(f); setResult(null); setError(""); }
    else setError("Only .csv files are accepted.");
  }

  async function upload() {
    if (!file) return;
    setUploading(true); setError(""); setResult(null);
    try {
      setResult(await uploadCSV(file));
    } catch (e) {
      setError(e?.response?.data?.detail || "Upload failed.");
    } finally { setUploading(false); }
  }

  const ok = result?.rows_ingested > 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Upload</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Ingest CSV event data · Validated · Deduplicated · Append-only</p>
        </div>
      </div>

      <div className="page-body">
        {/* Schema reference */}
        <div className="card p-5">
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Expected CSV Schema</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="section-label mb-2">Required Columns</div>
              <div className="flex flex-wrap gap-1.5">
                {REQUIRED.map(c => (
                  <span key={c} className="badge badge-accent mono text-[10px]">{c}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label mb-2">Optional Columns</div>
              <div className="flex flex-wrap gap-1.5">
                {OPTIONAL.map(c => (
                  <span key={c} className="badge mono text-[10px]"
                    style={{ background: "var(--bg-2)", color: "var(--text-3)", borderColor: "var(--border)" }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
          onClick={() => ref.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all"
          style={{
            borderColor: dragging ? "var(--accent)" : "var(--border-2)",
            background: dragging ? "var(--accent-bg)" : "var(--bg-2)",
          }}>
          <input ref={ref} type="file" accept=".csv" className="hidden" onChange={e => pick(e.target.files[0])} />
          <div className="text-3xl mb-3" style={{ color: "var(--text-3)" }}>↑</div>
          {file ? (
            <>
              <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{file.name}</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{(file.size / 1024).toFixed(1)} KB</div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Drop your CSV file here</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-3)" }}>or click to browse</div>
            </>
          )}
        </div>

        {file && !result && (
          <button onClick={upload} disabled={uploading} className="btn-primary w-full py-3 text-sm">
            {uploading ? "Ingesting & validating…" : "Upload & Ingest Data"}
          </button>
        )}

        {error && (
          <div className="card p-4 text-sm" style={{ background: "var(--red-bg)", borderColor: "var(--red)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        {result && (
          <div className="card p-5 fade-up"
            style={{ background: ok ? "var(--green-bg)" : "var(--amber-bg)", borderColor: ok ? "var(--green)" : "var(--amber)" }}>
            <div className="text-sm font-semibold mb-3" style={{ color: ok ? "var(--green)" : "var(--amber)" }}>
              {ok ? "✓ Upload complete" : "⚠ Upload completed with warnings"}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              {[
                { label: "Rows Ingested", value: result.rows_ingested, color: "var(--text)" },
                { label: "Duplicates Skipped", value: result.duplicates_skipped, color: "var(--amber)" },
                { label: "Errors", value: result.validation_errors.length, color: result.validation_errors.length ? "var(--red)" : "var(--text-3)" },
              ].map(s => (
                <div key={s.label}>
                  <div className="section-label mb-1">{s.label}</div>
                  <div className="text-2xl font-bold mono" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="text-xs" style={{ color: "var(--text-2)" }}>{result.message}</div>
            {result.validation_errors.length > 0 && (
              <div className="mt-3 rounded-xl p-3 border" style={{ background: "var(--red-bg)", borderColor: "var(--red)" }}>
                <div className="section-label mb-1.5" style={{ color: "var(--red)" }}>Validation Errors</div>
                {result.validation_errors.map((e, i) => (
                  <div key={i} className="text-xs mono" style={{ color: "var(--red)" }}>{e}</div>
                ))}
              </div>
            )}
            <button onClick={() => { setFile(null); setResult(null); if (ref.current) ref.current.value = ""; }}
              className="mt-3 text-xs transition-colors" style={{ color: "var(--text-3)" }}>
              Upload another →
            </button>
          </div>
        )}

        {/* Business rules */}
        <div className="card p-4" style={{ background: "var(--bg-2)" }}>
          <div className="section-label mb-2">Business Rules Enforced</div>
          <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--text-3)" }}>
            <div>✓ Data validated before ingestion</div>
            <div>✓ Duplicate records auto-skipped</div>
            <div>✓ Ingestion timestamp tracked per record</div>
            <div>✓ Historical data never overwritten (append-only)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
