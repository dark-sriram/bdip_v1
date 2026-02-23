## AI-Driven Business Decision Intelligence Platform (BDIP)

It implements:
- **Event-style analytics data** (simulated GA4-style events)
- **Business metrics layer** (conversion rate, funnel drop-off, LTV, etc.)
- **AI layer** (simple ML models and pattern detection using Python)
- **Decision logic engine** that converts metrics + AI outputs into **business recommendations**
- **Executive dashboard UI** in React to show **Problem, Evidence, Impact, Recommendation**

### Project Structure

- `backend/` – FastAPI backend with metrics, AI, and recommendation APIs
- `frontend/` – React + Vite + Tailwind executive dashboard
- `data/` – Sample/simulated analytics event data
- `.cursor/rules/` – Cursor rule with a short project structure guide

### 1. Backend (FastAPI)

- **Tech**: Python, FastAPI, Pandas, Scikit-learn
- **Key responsibilities**:
  - Load simulated analytics events from `data/sample_events.csv`
  - Compute **business KPIs** (conversion rate, funnel drop-off, LTV, retention proxy, engagement)
  - Train simple ML models to:
    - Predict **conversion probability**
    - Estimate **churn risk**
  - Run a **decision engine** that:
    - Reads metrics + AI outputs
    - Applies **business rules**
    - Returns a list of **recommendations** with problem, evidence, impact, and action

#### Backend – Setup & Run

From the project root (`C:\Users\srira\OneDrive\Desktop\bdip`):

```bash
cd backend
python -m venv venv
# Windows PowerShell
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000` (Swagger UI at `/docs`).

### 2. Frontend (React + Vite + Tailwind)

- **Tech**: React, Vite, Tailwind CSS, Recharts, Axios
- **Key responsibilities**:
  - Call backend APIs:
    - `/metrics/summary`
    - `/ai/summary`
    - `/recommendations`
  - Present data in an **executive-style dashboard**:
    - KPI cards
    - Trend and breakdown charts
    - **Recommendation feed** with:
      - Problem
      - Evidence
      - Impact
      - Recommended action

#### Frontend – Setup & Run

From the project root:

```bash
cd frontend
npm install
npm run dev
```

The dashboard will run (by default) at `http://localhost:5173` and will call the backend at `http://localhost:8000`.

#### Frontend – Backend URL configuration

By default the frontend uses:
- `VITE_API_BASE_URL` (if set), otherwise
- `http://localhost:8000`

To override, create `frontend/.env` with:

```text
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Data & Analytics Flow

Conceptually this follows the workflow defined in your specification and in `[BDIP_Workflow_TechStack_Impact.pdf](file://BDIP_Workflow_TechStack_Impact.pdf)`:

1. **Data Collection Layer**  
   - Simulated **GA4-style events** stored in `data/sample_events.csv`
2. **Data Processing & Storage Layer**  
   - Loaded into **Pandas** and modeled into **session-level** and **user-level** views
3. **Business Metrics Layer**  
   - Metrics such as **Conversion Rate**, **Funnel Drop-off %**, **LTV (simulated)**, **Engagement**, etc.
4. **AI & Decision Intelligence Layer**  
   - Simple ML models (Scikit-learn) for:
     - Conversion probability
     - Churn risk proxy
   - Anomaly-style rules on metrics
5. **Presentation & Recommendation Layer**  
   - React dashboard showing:
     - **Problem**
     - **Evidence**
     - **Impact**
     - **Recommended Action**

### 4. Where to Extend / Customize

- **Events & Data**: Replace or extend `data/sample_events.csv` with real GA4/BigQuery exports.
- **Metrics**: Modify or add metrics in `backend/app/metrics.py`.
- **AI Models**: Enhance models in `backend/app/ai.py` (better features, different algorithms).
- **Decision Logic**: Extend `backend/app/recommendations.py` with more domain-specific rules.
- **UI**: Customize the dashboard layout and add drill-down pages in `frontend/src`.

### 5. BigQuery Integration (Optional Next Step)

Currently, the system uses **local CSV data** to keep the project self-contained.  
To connect to **Google BigQuery** (as described in your PDF), you can:

- Add BigQuery client code in a new module (e.g., `backend/app/bigquery_client.py`)
- Replace the CSV loader in `data_loader.py` with queries to BigQuery views/tables
- Keep the rest of the pipeline (metrics, AI, recommendations, UI) unchanged

This preserves the **architecture and learning outcomes** from your original BDIP design.

