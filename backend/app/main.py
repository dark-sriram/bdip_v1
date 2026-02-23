from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .ai import AIEngine
from .data_loader import build_session_level, load_events
from .metrics import compute_core_metrics
from .recommendations import generate_recommendations
from .schemas import AISummary, DashboardPayload, MetricSummary, Recommendation

app = FastAPI(
    title="BDIP Backend",
    description=(
        "AI-Driven Business Decision Intelligence Platform backend. "
        "Combines analytics metrics, AI models, and decision logic to "
        "produce business-ready recommendations."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development; tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    """
    Load data and train the AI engine at application startup.
    """
    events = load_events()
    _, sessions = compute_core_metrics(events)

    engine = AIEngine()
    engine.train(sessions)

    app.state.ai_engine = engine


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok"}


@app.get("/metrics/summary", response_model=MetricSummary, tags=["metrics"])
def get_metrics_summary() -> MetricSummary:
    events = load_events()
    metrics, _ = compute_core_metrics(events)
    return metrics


@app.get("/ai/summary", response_model=AISummary, tags=["ai"])
def get_ai_summary() -> AISummary:
    events = load_events()
    _, sessions = compute_core_metrics(events)
    engine: AIEngine = app.state.ai_engine
    return engine.summarize(sessions)


@app.get("/recommendations", response_model=list[Recommendation], tags=["decision_engine"])
def get_recommendations() -> list[Recommendation]:
    events = load_events()
    metrics, sessions = compute_core_metrics(events)
    engine: AIEngine = app.state.ai_engine
    ai_summary = engine.summarize(sessions)
    return generate_recommendations(metrics, ai_summary)


@app.get("/dashboard", response_model=DashboardPayload, tags=["dashboard"])
def get_dashboard_payload() -> DashboardPayload:
    """
    Convenience endpoint for the frontend: returns metrics + AI + recommendations together.
    """
    events = load_events()
    metrics, sessions = compute_core_metrics(events)
    engine: AIEngine = app.state.ai_engine
    ai_summary = engine.summarize(sessions)
    recs = generate_recommendations(metrics, ai_summary)
    return DashboardPayload(metrics=metrics, ai=ai_summary, recommendations=recs)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

