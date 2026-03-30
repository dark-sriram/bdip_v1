from __future__ import annotations

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import router as auth_router
from .ai import AIEngine
from .data_loader import load_events
from .metrics import compute_core_metrics
from .recommendations import generate_recommendations
from .trading import router as trading_router
from .schemas import AISummary, DashboardPayload, MetricSummary, Recommendation
from .security import get_current_user

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
    allow_origins=["http://localhost:5173"],  # Frontend dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(trading_router)


@app.on_event("startup")
def startup() -> None:
    """
    Load data and train the AI engine at application startup.
    """
    events = load_events()
    _, sessions = compute_core_metrics(events)

    engine = AIEngine()
    engine.train(sessions)

    # Initialize auth DB tables
    from .db import init_db

    init_db()

    app.state.ai_engine = engine


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok"}


@app.get(
    "/metrics/summary",
    response_model=MetricSummary,
    tags=["metrics"],
)
def get_metrics_summary(_: dict = Depends(get_current_user)) -> MetricSummary:
    events = load_events()
    metrics, _ = compute_core_metrics(events)
    return metrics


@app.get("/ai/summary", response_model=AISummary, tags=["ai"])
def get_ai_summary(_: dict = Depends(get_current_user)) -> AISummary:
    events = load_events()
    _, sessions = compute_core_metrics(events)
    engine: AIEngine = app.state.ai_engine
    return engine.summarize(sessions)


@app.get(
    "/recommendations",
    response_model=list[Recommendation],
    tags=["decision_engine"],
)
def get_recommendations(_: dict = Depends(get_current_user)) -> list[Recommendation]:
    events = load_events()
    metrics, sessions = compute_core_metrics(events)
    engine: AIEngine = app.state.ai_engine
    ai_summary = engine.summarize(sessions)
    return generate_recommendations(metrics, ai_summary)


@app.get(
    "/dashboard",
    response_model=DashboardPayload,
    tags=["dashboard"],
)
def get_dashboard_payload(_: dict = Depends(get_current_user)) -> DashboardPayload:
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

