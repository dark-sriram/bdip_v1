# BDIP v2.0 — Business Decision Intelligence Platform

A full-stack AI-powered decision intelligence platform built with **FastAPI** (backend) + **React + Vite** (frontend).

---

## What's New in v2.0

### Backend
| Module | What's new |
|---|---|
| `schemas.py` | `confidence_score`, `confidence_range`, `input_variables` on every Recommendation; `ForecastSummary`, `AlertRule`, `AlertsPayload`, `NLQueryRequest/Response`, `DecisionLogEntry`, `UploadResponse` |
| `recommendations.py` | Every recommendation now includes a confidence score (0–1), confidence range string, and input variable list (explainable AI) |
| `forecasting.py` | **NEW** — 4-week-ahead linear trend forecasting for conversion rate, weekly revenue, and engagement score |
| `alerts.py` | **NEW** — 8 threshold-based alert rules across all KPIs with severity levels (High / Medium / Low) |
| `nlquery.py` | **NEW** — Natural language query engine: keyword → data → structured answer with SQL equivalent |
| `decisions.py` | **NEW** — Full CRUD router: approve, reject, list history, record actual outcomes, delete |
| `db.py` | Added `decision_log` table and `uploaded_events` table (append-only, deduplication via UNIQUE constraint) |
| `metrics.py` | Added `total_revenue` and `total_conversions` to `MetricSummary` |
| `ai.py` | Added `top_converting_source` and `top_converting_device` to `AISummary` |
| `main.py` | New endpoints: `POST /query`, `GET /alerts`, `GET /forecasts`, `POST /data/upload`; wires all new routers |

### Frontend
| Page | Description |
|---|---|
| **Dashboard** | KPI grid (8 tiles), 3-metric forecast charts (area + forecast dots), AI signals panel, device comparison bar chart, funnel breakdown, recommendations with inline approve/reject workflow |
| **Decision Tracker** | Full log of every approved/rejected recommendation; record actual outcomes; delete entries |
| **Alerts** | Real-time threshold evaluation across 8 rules; filter by triggered/severity; pulsing indicators |
| **Ask AI** | Chat interface for natural language queries; answers backed by live metrics; SQL equivalent shown |
| **Data Upload** | Drag-and-drop CSV ingest with validation, deduplication reporting, schema guide |
| **Account** | User profile, tier display, sign out |

**Removed**: Portfolio, Watchlist, Orders, Markets (stock trading UI — not relevant to BDIP)

---

## Architecture

```
bdip_v2/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, all routes
│   │   ├── schemas.py       # Pydantic models
│   │   ├── ai.py            # RandomForest AI engine
│   │   ├── recommendations.py # Rule engine + confidence scores
│   │   ├── forecasting.py   # 4-week linear trend forecasting
│   │   ├── alerts.py        # Threshold alert evaluation
│   │   ├── nlquery.py       # Natural language → insights
│   │   ├── decisions.py     # Decision log CRUD router
│   │   ├── metrics.py       # Core KPI computation
│   │   ├── data_loader.py   # CSV event loader (cached)
│   │   ├── auth.py          # JWT register/login
│   │   ├── security.py      # Token validation
│   │   └── db.py            # SQLite + table init
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/           # Dashboard, Decisions, AlertsPage, AskAI, DataUpload, Account
│       ├── components/      # Sidebar, Topbar, PrivateRoute
│       ├── auth/            # authStore (JWT localStorage)
│       ├── api.js           # All axios API calls
│       └── styles.css       # DM Sans + JetBrains Mono + design tokens
└── data/
    └── sample_events.csv
```

---

## Setup & Run

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## API Endpoints (v2)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |
| GET | `/auth/me` | Current user info |
| GET | `/dashboard` | Full dashboard payload (metrics + AI + recs + alerts + forecasts) |
| GET | `/metrics/summary` | KPI metrics only |
| GET | `/ai/summary` | AI model summary |
| GET | `/recommendations` | AI recommendations with confidence scores |
| GET | `/alerts` | Evaluated alert rules |
| GET | `/forecasts` | 4-week forecasts for 3 metrics |
| POST | `/query` | Natural language query |
| POST | `/data/upload` | CSV file ingest |
| POST | `/decisions/approve` | Log approved decision |
| POST | `/decisions/reject` | Log rejected decision |
| GET | `/decisions/history` | Decision log |
| PATCH | `/decisions/{id}/outcome` | Record actual result |
| DELETE | `/decisions/{id}` | Remove log entry |

---

## Business Rules Implemented

### Data Rules
- ✅ Data validated before ingestion (missing columns → error)
- ✅ No duplicate records (UNIQUE on session_id + event_type + timestamp)
- ✅ Ingestion timestamp tracked per record
- ✅ Historical data never overwritten (append-only)

### Decision Rules
- ✅ Every recommendation includes confidence score + confidence range
- ✅ No automatic execution — user must explicitly Approve or Reject
- ✅ All decisions versioned in `decision_log` table with timestamps
- ✅ Actual outcome can be recorded post-decision (feedback loop)

### KPI Rules
- ✅ KPIs clearly defined with formulas in `metrics.py`
- ✅ Consistent across all dashboard views
- ✅ Dashboard refreshes on-demand

### Alert Rules
- ✅ 8 threshold-based rules with severity (High / Medium / Low)
- ✅ Each alert shows current value vs threshold
- ✅ Actionable messages (not just informational)

### AI / ML Rules
- ✅ Explainable AI: every recommendation lists input variables that triggered it
- ✅ Confidence score + range on every recommendation
- ✅ Model notes shown in UI ("directional signal, not exact forecast")
- ✅ No black-box decisions — rules are fully traceable

---

## Unique Differentiators

1. **Decision recommendation + approval workflow** — not just a BI dashboard
2. **Feedback loop** — log actual outcomes against expected outcomes
3. **Chat-based analytics** — natural language → instant data-backed answers
4. **Explainable AI** — every recommendation shows which metrics triggered it and confidence level
5. **Forecasting** — 4-week ahead outlook on conversion, revenue, engagement
6. **Threshold alerts** — 8 configurable rules evaluated in real-time
