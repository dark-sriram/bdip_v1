from __future__ import annotations

import io

import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .ai import AIEngine
from .alerts import evaluate_alerts
from .auth import router as auth_router
from .data_loader import load_events
from .db import init_db
from .decisions import router as decisions_router
from .forecasting import build_metrics_history, generate_forecasts
from .metrics import compute_core_metrics
from .nlquery import answer_nl_query
from .recommendations import generate_recommendations
from .schemas import (
    AISummary,
    DashboardPayload,
    MetricSummary,
    NLQueryRequest,
    NLQueryResponse,
    Recommendation,
    UploadResponse,
)
from .security import get_current_user

app = FastAPI(
    title="BDIP Backend v2",
    description=(
        "Business Decision Intelligence Platform — v2. "
        "Analytics, AI recommendations, decision tracking, alerts, forecasting, and NL querying."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(decisions_router)


@app.on_event("startup")
def startup() -> None:
    events = load_events()
    _, sessions = compute_core_metrics(events)

    engine = AIEngine()
    engine.train(sessions)

    init_db()

    app.state.ai_engine = engine


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok", "version": "2.0.0"}


# ── Metrics ──────────────────────────────────────────────────────────────────

@app.get("/metrics/summary", response_model=MetricSummary, tags=["metrics"])
def get_metrics_summary(_: dict = Depends(get_current_user)) -> MetricSummary:
    events = load_events()
    metrics, _ = compute_core_metrics(events)
    return metrics


# ── AI ────────────────────────────────────────────────────────────────────────

@app.get("/ai/summary", response_model=AISummary, tags=["ai"])
def get_ai_summary(_: dict = Depends(get_current_user)) -> AISummary:
    events = load_events()
    _, sessions = compute_core_metrics(events)
    engine: AIEngine = app.state.ai_engine
    return engine.summarize(sessions)


# ── Recommendations ───────────────────────────────────────────────────────────

@app.get("/recommendations", response_model=list[Recommendation], tags=["decision_engine"])
def get_recommendations(_: dict = Depends(get_current_user)) -> list[Recommendation]:
    events = load_events()
    metrics, sessions = compute_core_metrics(events)
    engine: AIEngine = app.state.ai_engine
    ai_summary = engine.summarize(sessions)
    return generate_recommendations(metrics, ai_summary)


# ── Alerts ────────────────────────────────────────────────────────────────────

@app.get("/alerts", tags=["alerts"])
def get_alerts(_: dict = Depends(get_current_user)):
    events = load_events()
    metrics, sessions = compute_core_metrics(events)
    engine: AIEngine = app.state.ai_engine
    ai_summary = engine.summarize(sessions)
    return evaluate_alerts(metrics, ai_summary)


# ── Forecasts ─────────────────────────────────────────────────────────────────

@app.get("/forecasts", tags=["forecasts"])
def get_forecasts(_: dict = Depends(get_current_user)):
    events = load_events()
    metrics, _ = compute_core_metrics(events)
    history = build_metrics_history(
        base_conversion=metrics.conversion_rate,
        base_revenue=metrics.total_revenue,
        base_engagement=metrics.engagement_score,
    )
    return generate_forecasts(history)


# ── NL Query ──────────────────────────────────────────────────────────────────

@app.post("/query", response_model=NLQueryResponse, tags=["nlquery"])
def natural_language_query(
    body: NLQueryRequest,
    _: dict = Depends(get_current_user),
) -> NLQueryResponse:
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    events = load_events()
    metrics, sessions = compute_core_metrics(events)
    engine: AIEngine = app.state.ai_engine
    ai_summary = engine.summarize(sessions)
    return answer_nl_query(body.question, metrics, ai_summary)


# ── Data Upload ───────────────────────────────────────────────────────────────

@app.post("/data/upload", response_model=UploadResponse, tags=["data"])
async def upload_events(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> UploadResponse:
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    required_cols = {"session_id", "user_id", "timestamp", "page", "event_type", "device", "source"}
    missing = required_cols - set(df.columns)
    validation_errors: list[str] = []

    if missing:
        validation_errors.append(f"Missing required columns: {', '.join(sorted(missing))}")
        return UploadResponse(
            rows_ingested=0,
            duplicates_skipped=0,
            validation_errors=validation_errors,
            message="Upload failed due to missing columns.",
        )

    # Fill optional numeric cols
    df["amount"] = pd.to_numeric(df.get("amount", 0), errors="coerce").fillna(0.0)
    df["converted"] = pd.to_numeric(df.get("converted", 0), errors="coerce").fillna(0).astype(int)

    # Validate rows
    for i, row in df.iterrows():
        if not str(row.get("session_id", "")).strip():
            validation_errors.append(f"Row {i}: missing session_id")
        if not str(row.get("timestamp", "")).strip():
            validation_errors.append(f"Row {i}: missing timestamp")

    ingested = 0
    skipped = 0

    from .db import get_db
    with get_db() as conn:
        for _, row in df.iterrows():
            try:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO uploaded_events
                    (session_id, user_id, timestamp, page, event_type, device, source, amount, converted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(row["session_id"]),
                        str(row["user_id"]),
                        str(row["timestamp"]),
                        str(row["page"]),
                        str(row["event_type"]),
                        str(row["device"]),
                        str(row["source"]),
                        float(row["amount"]),
                        int(row["converted"]),
                    ),
                )
                if conn.execute("SELECT changes()").fetchone()[0] > 0:
                    ingested += 1
                else:
                    skipped += 1
            except Exception as e:
                validation_errors.append(f"Row error: {e}")

    return UploadResponse(
        rows_ingested=ingested,
        duplicates_skipped=skipped,
        validation_errors=validation_errors[:10],  # cap error list
        message=f"Upload complete. {ingested} rows ingested, {skipped} duplicates skipped.",
    )


# ── Dashboard (combined) ──────────────────────────────────────────────────────

@app.get("/dashboard", response_model=DashboardPayload, tags=["dashboard"])
def get_dashboard_payload(_: dict = Depends(get_current_user)) -> DashboardPayload:
    events = load_events()
    metrics, sessions = compute_core_metrics(events)
    engine: AIEngine = app.state.ai_engine
    ai_summary = engine.summarize(sessions)
    recs = generate_recommendations(metrics, ai_summary)
    alerts = evaluate_alerts(metrics, ai_summary)
    history = build_metrics_history(
        base_conversion=metrics.conversion_rate,
        base_revenue=metrics.total_revenue,
        base_engagement=metrics.engagement_score,
    )
    forecasts = generate_forecasts(history)
    return DashboardPayload(
        metrics=metrics,
        ai=ai_summary,
        recommendations=recs,
        forecasts=forecasts,
        alerts=alerts,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


# ── Marketplace endpoints ─────────────────────────────────────────────────────

from .marketplace import (
    get_command_center,
    get_product_intelligence,
    get_profit_leakage,
    get_restock_planner,
)


@app.get("/marketplace/command-center", tags=["marketplace"])
def marketplace_command_center(_: dict = Depends(get_current_user)):
    return get_command_center()


@app.get("/marketplace/products", tags=["marketplace"])
def marketplace_products(_: dict = Depends(get_current_user)):
    return get_product_intelligence()


@app.get("/marketplace/profit-leakage", tags=["marketplace"])
def marketplace_profit_leakage(_: dict = Depends(get_current_user)):
    return get_profit_leakage()


@app.get("/marketplace/restock", tags=["marketplace"])
def marketplace_restock(_: dict = Depends(get_current_user)):
    return get_restock_planner()


# ── Marketplace CSV Upload ────────────────────────────────────────────────────

@app.post("/marketplace/upload", tags=["marketplace"])
async def marketplace_csv_upload(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> dict:
    """
    Accept a marketplace orders CSV and store rows in uploaded_marketplace_orders.
    Expected columns: platform, product_id, product_name, order_id, date,
                      selling_price, platform_fee, shipping_cost, cogs, quantity,
                      return_flag (0/1), rating (optional)
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

    required = {"platform", "product_id", "order_id", "date", "selling_price", "quantity"}
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(status_code=400,
            detail=f"Missing required columns: {', '.join(sorted(missing))}")

    # Fill optional columns with defaults
    for col, default in [("platform_fee", 0), ("shipping_cost", 0), ("cogs", 0),
                          ("return_flag", 0), ("rating", 0), ("product_name", "Unknown")]:
        if col not in df.columns:
            df[col] = default

    df["selling_price"] = pd.to_numeric(df["selling_price"], errors="coerce").fillna(0)
    df["platform_fee"]  = pd.to_numeric(df["platform_fee"],  errors="coerce").fillna(0)
    df["shipping_cost"] = pd.to_numeric(df["shipping_cost"], errors="coerce").fillna(0)
    df["cogs"]          = pd.to_numeric(df["cogs"],          errors="coerce").fillna(0)
    df["quantity"]      = pd.to_numeric(df["quantity"],      errors="coerce").fillna(1).astype(int)
    df["return_flag"]   = pd.to_numeric(df["return_flag"],   errors="coerce").fillna(0).astype(int)
    df["rating"]        = pd.to_numeric(df["rating"],        errors="coerce").fillna(0)

    ingested = skipped = 0
    from .db import get_db as _get_db
    with _get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS marketplace_orders (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              platform TEXT NOT NULL,
              product_id TEXT NOT NULL,
              product_name TEXT,
              order_id TEXT NOT NULL,
              date TEXT NOT NULL,
              selling_price REAL NOT NULL,
              platform_fee REAL DEFAULT 0,
              shipping_cost REAL DEFAULT 0,
              cogs REAL DEFAULT 0,
              quantity INTEGER DEFAULT 1,
              return_flag INTEGER DEFAULT 0,
              rating REAL DEFAULT 0,
              ingested_at TEXT DEFAULT (datetime('now')),
              UNIQUE(user_id, order_id, platform)
            )
        """)
        conn.commit()

        for _, row in df.iterrows():
            try:
                conn.execute("""
                    INSERT OR IGNORE INTO marketplace_orders
                    (user_id, platform, product_id, product_name, order_id, date,
                     selling_price, platform_fee, shipping_cost, cogs, quantity, return_flag, rating)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, (
                    user["id"],
                    str(row["platform"]).lower().strip(),
                    str(row["product_id"]).strip(),
                    str(row["product_name"]).strip(),
                    str(row["order_id"]).strip(),
                    str(row["date"]).strip(),
                    float(row["selling_price"]),
                    float(row["platform_fee"]),
                    float(row["shipping_cost"]),
                    float(row["cogs"]),
                    int(row["quantity"]),
                    int(row["return_flag"]),
                    float(row["rating"]),
                ))
                if conn.execute("SELECT changes()").fetchone()[0] > 0:
                    ingested += 1
                else:
                    skipped += 1
            except Exception:
                skipped += 1

    return {
        "rows_ingested": ingested,
        "duplicates_skipped": skipped,
        "message": f"{ingested} orders imported, {skipped} duplicates skipped.",
        "columns_detected": list(df.columns),
    }
