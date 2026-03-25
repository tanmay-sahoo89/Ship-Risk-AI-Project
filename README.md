# Ship Risk AI — Complete Project Documentation

> **Generated:** 2026-03-25
> **Project:** AI-Driven Shipment Risk Prediction & Dashboard
> **Deployed at:** [https://ship-risk-ai.web.app](https://ship-risk-ai.web.app)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Structure](#2-directory-structure)
3. [File-by-File Detailed Explanation](#3-file-by-file-detailed-explanation)
4. [Complete Function & Method Reference](#4-complete-function--method-reference)
5. [API Reference](#5-api-reference)
6. [Project Workflow (End-to-End)](#6-project-workflow-end-to-end)
7. [Frameworks, Libraries & Tools](#7-frameworks-libraries--tools)
8. [Environment Variables & Configuration](#8-environment-variables--configuration)
9. [Database Schema & Models](#9-database-schema--models)
10. [Authentication & Authorization Flow](#10-authentication--authorization-flow)
11. [Error Handling Patterns](#11-error-handling-patterns)
12. [Testing](#12-testing)

---

## 1. Project Overview

### What This Project Does

Ship Risk AI is a comprehensive, end-to-end AI-driven system for **shipment delay risk prediction, alert generation, and intervention recommendations**. It combines an ML pipeline (Python/scikit-learn) with a modern React dashboard to enable logistics managers to:

- **Predict** which shipments are likely to be delayed using trained classification models
- **Score** live shipments in real time and assign risk tiers (LOW / MEDIUM / HIGH / CRITICAL)
- **Generate alerts** for shipments that exceed risk thresholds
- **Recommend interventions** (reroute, carrier switch, air freight upgrade, priority handling, etc.)
- **Visualize** risk metrics, alert trends, delay distributions, and live tracking on an interactive map
- **Export** reports as CSV or PDF
- **Get AI-powered insights** via Google Gemini integration for natural-language shipment queries

### Tech Stack Summary

| Layer             | Technology                                                                            |
| ----------------- | ------------------------------------------------------------------------------------- |
| **ML Pipeline**   | Python 3.11+, scikit-learn, pandas, numpy, joblib                                     |
| **Backend API**   | FastAPI, Uvicorn, Pydantic                                                            |
| **Database**      | Firebase Firestore (NoSQL), CSV files (local data store)                              |
| **Auth**          | Firebase Authentication (Email/Password)                                              |
| **Frontend**      | React 19, TypeScript, Vite 7                                                          |
| **Styling**       | Tailwind CSS 4, Framer Motion                                                         |
| **Charts**        | Recharts                                                                              |
| **Maps**          | Leaflet + react-leaflet                                                               |
| **AI/LLM**        | Google Gemini API (free tier)                                                         |
| **External APIs** | Open-Meteo (weather), OpenSky Network (aircraft tracking), OpenRouteService (routing) |
| **Deployment**    | Firebase Hosting (frontend), Docker, Heroku (Procfile), Nginx                         |
| **Testing**       | Vitest, React Testing Library, jsdom                                                  |

### Architecture Pattern

The project follows a **decoupled monolith** pattern:

- **Backend (Python):** A self-contained ML pipeline that generates data, trains models, scores shipments, generates alerts/recommendations, and uploads results to Firebase Firestore. It also serves as a REST API via FastAPI.
- **Frontend (React/TypeScript):** A single-page application (SPA) that reads data from Firestore in real-time (primary) or falls back to the FastAPI backend. It uses a Context-based state management pattern with React Context API.
- **Data flow:** Pipeline → CSV artifacts → Firestore → Frontend (real-time listeners). The API server also reads CSV files directly for non-Firestore deployments.

---

## 2. Directory Structure

```
GIET-HACKTHON/
├── .env.example                          # Template for environment variables
├── .firebase/                            # Firebase deployment cache (root-level hosting)
│   └── hosting.c2hpcC1yaXNrLWFpXGRpc3Q.cache  # Cached deployment manifest
├── .firebaserc                           # Firebase project alias configuration (root)
├── .gitignore                            # Git ignore rules for secrets, builds, caches
├── api_server.py                         # FastAPI REST API server (main backend entry)
├── artifacts/                            # ML pipeline output artifacts
│   ├── best_model_name.txt               # Name of the best-performing model
│   ├── feature_importances.csv           # Feature importance scores from best model
│   ├── model_comparison.csv              # Comparison metrics for all trained models
│   └── processed_data.csv               # Fully processed/scaled training data
├── data_generator.py                     # Synthetic shipment data generator
├── deploy.sh                             # Production deployment preparation script
├── docker-compose.yml                    # Docker Compose for API + Nginx services
├── Dockerfile                            # Multi-stage Docker build (frontend + backend)
├── feature_engineering.py                # Feature engineering & preprocessing pipeline
├── firebase.json                         # Firebase Hosting configuration (root)
├── firebase_uploader.py                  # Uploads pipeline results to Firestore
├── main_pipeline.py                      # Orchestrates the full ML pipeline end-to-end
├── model_training.py                     # Model training, evaluation, and selection
├── nginx.conf                            # Nginx reverse proxy configuration
├── Procfile                              # Heroku deployment process definition
├── README.md                             # Project overview and setup instructions
├── recommendation_engine.py              # Rule-based intervention recommendation engine
├── requirements.txt                      # Python dependency manifest
├── risk_scoring.py                       # Risk scoring engine with alert generation
├── services/                             # Python backend service modules
│   ├── __init__.py                       # Package initializer (empty)
│   ├── ai_service.py                     # Google Gemini AI integration service
│   ├── route_service.py                  # Route calculation (great-circle + ORS)
│   ├── tracking_service.py               # Aircraft tracking via OpenSky Network
│   └── weather_service.py                # Weather data via Open-Meteo API
├── ship-risk-ai/                         # React frontend application
│   ├── .env.local.example                # Frontend environment variable template
│   ├── .firebase/                        # Firebase deployment cache (frontend)
│   │   └── hosting.ZGlzdA.cache          # Cached deployment manifest
│   ├── .firebaserc                       # Firebase project alias (frontend)
│   ├── eslint.config.js                  # ESLint configuration for TypeScript/React
│   ├── firebase.json                     # Firebase Hosting config (frontend dist)
│   ├── index.html                        # HTML entry point (Vite SPA shell)
│   ├── package.json                      # Node.js dependency manifest & scripts
│   ├── postcss.config.js                 # PostCSS configuration (Tailwind plugin)
│   ├── public/                           # Static assets served as-is
│   │   └── vite.svg                      # Vite logo favicon
│   ├── src/                              # Application source code
│   │   ├── App.css                       # Reset CSS (defers to globals.css)
│   │   ├── App.tsx                       # Root React component with routing
│   │   ├── assets/                       # Bundled static assets
│   │   │   └── react.svg                 # React logo asset
│   │   ├── components/                   # Reusable UI components
│   │   │   ├── AiAdvisor.tsx             # AI chatbot panel for shipment queries
│   │   │   ├── Auth/                     # Authentication components
│   │   │   │   ├── ForgotPasswordModal.tsx  # Password reset modal
│   │   │   │   ├── LoginModal.tsx        # Role selection modal (User/Admin)
│   │   │   │   └── ProtectedRoute.tsx    # Auth guard for protected pages
│   │   │   ├── Charts/                   # Data visualization charts
│   │   │   │   ├── AlertTrendChart.tsx   # Line chart: alert trends over 5 days
│   │   │   │   ├── DelayProbabilityChart.tsx  # Bar chart: delay probability distribution
│   │   │   │   └── RiskDistributionChart.tsx  # Donut chart: risk tier distribution
│   │   │   ├── Common/                   # Shared/layout components
│   │   │   │   ├── ErrorBoundary.tsx     # React error boundary with friendly UI
│   │   │   │   ├── ExportToolbar.tsx     # CSV/PDF export buttons
│   │   │   │   ├── Footer.tsx            # Site footer with links
│   │   │   │   ├── Header.tsx            # Top navbar with notifications & auth
│   │   │   │   ├── NotificationToast.tsx # Toast notification renderer
│   │   │   │   └── Sidebar.tsx           # Navigation sidebar
│   │   │   ├── Dashboard/               # Dashboard-specific components
│   │   │   │   ├── RiskMetrics.tsx       # KPI cards (shipments, alerts, risk score)
│   │   │   │   └── ShipmentAlerts.tsx    # Paginated, filterable alert list
│   │   │   ├── Layout/                  # Layout wrappers
│   │   │   │   └── DashboardLayout.tsx   # Header + Sidebar + Outlet + Footer
│   │   │   ├── Map/                     # Map components
│   │   │   │   ├── LayerControls.tsx     # Map layer visibility toggles
│   │   │   │   └── MapView.tsx           # Leaflet map with shipment markers
│   │   │   ├── Risk/                    # Risk display components
│   │   │   │   ├── RiskFactorsList.tsx   # Animated risk factor bullet list
│   │   │   │   ├── RiskIndicator.tsx     # SVG circular gauge for risk score
│   │   │   │   ├── RiskTier.test.tsx     # Unit tests for RiskTier component
│   │   │   │   └── RiskTier.tsx          # Risk tier badge (colored pill)
│   │   │   ├── Shipment/               # Shipment display components
│   │   │   │   ├── ShipmentCard.tsx      # Compact shipment summary card
│   │   │   │   ├── ShipmentDetail.tsx    # Full shipment detail modal
│   │   │   │   ├── ShipmentFilter.tsx    # Multi-select filter panel
│   │   │   │   └── ShipmentList.tsx      # Grid of ShipmentCards with detail modal
│   │   │   └── Tracking/               # Live tracking components
│   │   │       ├── EventFeed.tsx         # Scrollable live event feed
│   │   │       ├── LiveStats.tsx         # Tracking stats bar
│   │   │       ├── SearchBar.tsx         # Shipment search with dropdown
│   │   │       └── TrackingDetails.tsx   # Selected shipment detail side panel
│   │   ├── contexts/                    # React Context providers
│   │   │   ├── AuthContext.tsx           # Auth state & Firebase auth methods
│   │   │   ├── NotificationContext.tsx   # Toast notification state management
│   │   │   ├── ShipmentContext.tsx       # Global shipment/alert/rec data (Firestore real-time)
│   │   │   └── ThemeContext.tsx          # Dark/light theme toggle
│   │   ├── hooks/                       # Custom React hooks
│   │   │   ├── useAuth.ts               # Re-exports useAuth from AuthContext
│   │   │   ├── useFirestore.ts           # Generic Firestore real-time listener
│   │   │   ├── useNotification.ts        # Re-exports useNotification from NotificationContext
│   │   │   ├── useShipments.ts           # Fetches shipments via ApiService
│   │   │   └── useTracking.ts            # Builds tracked shipment data with weather
│   │   ├── index.css                    # Minimal body reset CSS
│   │   ├── main.tsx                     # React DOM entry point (renders App)
│   │   ├── pages/                       # Route-level page components
│   │   │   ├── AddShipment.tsx           # Form to add new shipments (manual + CSV)
│   │   │   ├── Alerts.tsx                # Alerts page with filters & export
│   │   │   ├── Analytics.tsx             # Analytics dashboard with charts
│   │   │   ├── Dashboard.tsx             # Main dashboard overview
│   │   │   ├── Home.tsx                  # Landing page (unauthenticated)
│   │   │   ├── LiveTracking.tsx          # Live map tracking page
│   │   │   ├── Login.tsx                 # Login page with email/password & demo
│   │   │   ├── NotFound.tsx              # 404 page
│   │   │   ├── Recommendations.tsx       # Recommendations list page
│   │   │   ├── ShipmentDetails.tsx       # Single shipment detail page with AI advisor
│   │   │   ├── Shipments.tsx             # Shipments list page with filters
│   │   │   └── Signup.tsx                # Signup page
│   │   ├── services/                    # Frontend service modules
│   │   │   ├── aiService.ts              # Gemini AI integration (browser-direct)
│   │   │   ├── alertService.ts           # Client-side alert calculation (singleton)
│   │   │   ├── api.ts                    # Firestore/API data access (ApiService class)
│   │   │   ├── exportService.ts          # CSV & PDF export utilities
│   │   │   ├── exportService.test.ts     # Tests for export service
│   │   │   ├── firebase.ts               # Firebase SDK initialization
│   │   │   ├── route.ts                  # Great-circle route generation (client-side)
│   │   │   ├── tracking.ts               # Shipment → TrackedShipment conversion
│   │   │   └── weather.ts                # Open-Meteo weather client (browser)
│   │   ├── styles/                      # CSS stylesheets
│   │   │   ├── globals.css               # Theme variables, Tailwind layers, animations
│   │   │   └── tracking.css              # Leaflet dark theme overrides
│   │   ├── types/                       # TypeScript type definitions
│   │   │   ├── alert.ts                  # ShipmentAlert, RiskTier, AlertType
│   │   │   ├── risk.ts                   # Recommendation, RiskMetrics
│   │   │   ├── shipment.ts               # Shipment, TransportMode, etc.
│   │   │   ├── tracking.ts              # TrackedShipment, WeatherData, city coords
│   │   │   └── user.ts                   # User, UserRole, AuthContextType
│   │   ├── utils/                       # Utility functions
│   │   │   ├── constants.ts              # Risk colors, carriers, API base URL
│   │   │   ├── csvHelpers.ts             # CSV parsing & validation (file-based)
│   │   │   ├── csvValidator.ts           # CSV validation with PapaParse
│   │   │   ├── formatters.test.ts        # Tests for formatter functions
│   │   │   ├── formatters.ts             # Number/date/percentage formatters
│   │   │   ├── helpers.ts                # getRiskTierColor, debounce, classNames
│   │   │   └── riskCalculations.ts       # Client-side risk scoring functions
│   │   └── vitest.setup.ts              # Test setup: cleanup, Firebase mock, env vars
│   ├── tailwind.config.js               # Tailwind theme extension (custom colors)
│   ├── tsconfig.app.json                # TypeScript config for app source
│   ├── tsconfig.json                    # Root TypeScript project references
│   ├── tsconfig.node.json               # TypeScript config for Node.js (Vite config)
│   ├── vite.config.ts                   # Vite bundler configuration
│   └── vitest.config.ts                 # Vitest test runner configuration
└── start.sh                             # Development startup script (API + frontend)
```

---

## 3. File-by-File Detailed Explanation

### 3.1 Root-Level Configuration Files

#### `.env.example`

- **Purpose:** Template showing all environment variables the project needs. Developers copy this to `.env` and fill in real values.
- **Language/Format:** Shell environment variable format
- **Sections:** Database (MongoDB), Firebase config, API server settings, Frontend (VITE\_ prefixed), ML model paths, data paths, logging, CORS, security (JWT), external APIs (Open-Meteo, OpenRouteService, OpenSky), AI config (Ollama/Gemini).
- **Exports:** None (template file)

#### `.firebaserc`

- **Purpose:** Maps Firebase project aliases for the CLI. The `"default"` alias points to the `"ship-risk-ai"` Firebase project.
- **Language/Format:** JSON
- **Content:** `{ "projects": { "default": "ship-risk-ai" } }`

#### `.gitignore`

- **Purpose:** Prevents sensitive files, build artifacts, and environment-specific files from being committed to Git.
- **Language/Format:** Gitignore syntax
- **Key entries:** `serviceAccountKey.json`, `.env*`, `PROJECT_DOCUMENTATION.md`, `venv/`, `__pycache__/`, `node_modules/`, `dist/`, `*.pkl`, `*.joblib`, `data/*.csv`, IDE configs, OS files, logs.

#### `README.md`

- **Purpose:** Project overview documentation. Describes the pipeline flow, file structure, API endpoints, and technology stack.
- **Language/Format:** Markdown
- **Key info:** Pipeline is Data Generation → Feature Engineering → Model Training → Risk Scoring → Recommendations → Firebase Upload → Dashboard. Lists 4 REST API endpoints and separates backend (Python) vs frontend (React) technologies.

#### `firebase.json`

- **Purpose:** Configures Firebase Hosting for the root-level deployment. Points to `ship-risk-ai/dist` as the public directory and uses SPA rewrites (all routes → `index.html`).
- **Language/Format:** JSON
- **Rewrites:** `"source": "**"` → `"/index.html"` (standard SPA configuration)

#### `requirements.txt`

- **Purpose:** Python dependency manifest. Lists all required packages with minimum version constraints.
- **Language/Format:** pip requirements format
- **Dependencies:** pandas ≥2.2.0, numpy ≥1.26.0, scikit-learn ≥1.4.0, firebase-admin ≥6.4.0, fastapi ≥0.109.0, uvicorn ≥0.27.0, gunicorn ≥21.2.0, python-dotenv ≥1.0.0, requests ≥2.31.0, pydantic ≥2.5.0, statsmodels ≥0.14.0, shap ≥0.44.0, scipy ≥1.13.0, httpx ≥0.24.0

#### `Procfile`

- **Purpose:** Heroku deployment configuration. Tells Heroku to run the API server via Gunicorn with 4 worker processes.
- **Language/Format:** Procfile (Heroku)
- **Content:** `web: gunicorn -w 4 -b 0.0.0.0:$PORT api_server:app`

#### `Dockerfile`

- **Purpose:** Multi-stage Docker build that first builds the React frontend (Node 20 Alpine), then sets up the Python backend (Python 3.11 slim), copies all pipeline files, artifacts, data, and the built frontend.
- **Language/Format:** Dockerfile
- **Stage 1 (frontend-builder):** Installs npm dependencies, runs `npm run build`, produces `dist/`
- **Stage 2 (Python backend):** Installs system deps (curl), pip installs requirements, copies all Python files plus artifacts/data, copies built frontend from stage 1. Exposes ports 8000 and 5173. Health check curls `/health`. Entry point: `python api_server.py`.

#### `docker-compose.yml`

- **Purpose:** Defines two services: `api` (the Python backend built from the Dockerfile) and `nginx` (an Nginx Alpine container serving the frontend and proxying API requests).
- **Language/Format:** Docker Compose v3.8
- **Services:**
  - `api`: Builds from `.`, maps port 8000, mounts `artifacts/`, `data/`, `outputs/` as volumes, health check on `/health`
  - `nginx`: Uses `nginx:alpine` image, maps ports 80/443, mounts `nginx.conf`, `ship-risk-ai/dist`, and `certs/`, depends on `api`
- **Network:** `ship-risk-network`

#### `nginx.conf`

- **Purpose:** Nginx reverse proxy configuration that serves the React SPA on ports 80/443 and proxies `/api/` requests to the Python backend at `api:8000`.
- **Language/Format:** Nginx configuration
- **Key features:** HTTP→HTTPS redirect, SSL/TLS configuration (TLS 1.2/1.3), security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, CSP, Referrer-Policy), gzip compression, static file caching (1 year for assets), SPA fallback (`try_files $uri /index.html`), denies access to dotfiles.

#### `deploy.sh`

- **Purpose:** Production deployment preparation script. Validates prerequisites, builds frontend, installs Python dependencies, creates directories, and verifies configurations.
- **Language/Format:** Bash script
- **Steps:** Checks `.env` exists (copies from example if not), checks `serviceAccountKey.json` exists, builds React frontend (`npm ci && npm run build`), creates Python venv, installs requirements + gunicorn, creates `artifacts/`, `data/`, `outputs/`, `logs/` directories, verifies Python imports work. Outputs next-step deployment options (Docker, manual, Heroku, cloud).

#### `start.sh`

- **Purpose:** Development startup script that launches both the Python API server and the React frontend dev server simultaneously.
- **Language/Format:** Bash script
- **Steps:** Checks venv exists, checks node_modules exists, if no data files exist runs the full pipeline to generate them, starts API server on port 8000 in background, waits up to 30s for API health check, starts React dev server on port 5173 in background, prints URLs, traps SIGINT/SIGTERM to cleanly kill both processes.

### 3.2 Python Backend — ML Pipeline

#### `data_generator.py`

- **Purpose:** Generates synthetic shipment data with realistic distributions for training and testing the ML pipeline.
- **Language:** Python
- **Imports:** pandas, numpy, datetime, timedelta, random, warnings
- **Constants:** `CARRIERS` (6 shipping companies), `ORIGINS` (6 cities), `DESTINATIONS` (6 cities), `TRANSPORT` (Air/Sea/Road/Rail), `STATUSES` (5 shipment states), `WEATHER_COND` (7 weather types), `DISRUPTIONS` (5 disruption types), `CARRIER_RELIABILITY` (reliability scores per carrier), `WEATHER_SEVERITY` (severity scores per weather), `DISRUPTION_IMPACT` (impact scores per disruption), `ROUTE_RISK` (risk scores for specific origin-destination pairs).
- **Functions:** `_route_risk(origin, dest)` looks up route risk or generates random; `_traffic_score(transport_mode)` generates congestion score by mode; `_compute_delay_probability(row)` applies a weighted heuristic formula to compute ground-truth delay probability; `generate_shipment_data(n)` generates n synthetic records with 25+ features and delay labels.
- **Main block:** Generates 5000 records, saves to `data/shipments_raw.csv`.

#### `feature_engineering.py`

- **Purpose:** Full preprocessing pipeline: cleaning, feature engineering, categorical encoding, scaling, and train/val/test splitting.
- **Language:** Python
- **Imports:** pandas, numpy, sklearn (LabelEncoder, MinMaxScaler, train_test_split), joblib, os, warnings
- **Class `ShipmentFeatureEngineer`:**
  - `clean(df)` — Drops duplicates, clamps scores to valid ranges, fills NaN values
  - `engineer_features(df)` — Creates `transit_progress_ratio`, `composite_risk_score` (weighted blend of all risk signals), `log_weight`, `sla_pressure`
  - `encode(df, fit)` — Label-encodes 7 categorical columns into numeric `_enc` columns
  - `scale(df, fit)` — MinMaxScaler on all numeric features
  - `split(df)` — 70/15/15 stratified train/val/test split
  - `fit_transform(df)` — Runs all 5 steps, persists label_encoders.pkl, scaler.pkl, feature_cols.pkl, processed_data.csv
  - `transform(df)` — Loads saved artifacts, applies pipeline without fitting (for inference)

#### `model_training.py`

- **Purpose:** Trains 4 classification models, evaluates them, selects the best, and saves it.
- **Language:** Python
- **Imports:** pandas, numpy, joblib, sklearn (LogisticRegression, RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier, classification_report, roc_auc_score, f1_score, precision_score, recall_score, confusion_matrix)
- **Functions:**
  - `build_models()` — Returns dict of 4 configured classifiers
  - `train_all(X_train, y_train, X_val, y_val)` — Trains all models, computes ROC-AUC, F1, Precision, Recall
  - `select_and_evaluate(results, X_test, y_test)` — Selects best by ROC-AUC, prints classification report, confusion matrix, and top-10 feature importances
  - `save_model(model, name)` — Saves best model as `best_model.pkl` and name as `best_model_name.txt`
  - `print_comparison(results)` — Prints comparison table and saves `model_comparison.csv`
- **Best model:** Gradient Boosting (ROC-AUC: 0.9939, F1: 0.9972)

#### `risk_scoring.py`

- **Purpose:** Loads the trained model, scores new shipments, classifies risk tiers, and generates structured alerts.
- **Language:** Python
- **Imports:** pandas, numpy, joblib, json, datetime, dataclasses
- **Constants:** `RISK_TIERS` (threshold ranges), `TIER_COLORS` (emoji icons), `TIER_ACTIONS` (action strings per tier)
- **Dataclass `ShipmentAlert`:** 13 fields including shipment_id, risk_tier, delay_probability, eta, hours_to_sla, origin, destination, carrier, transport_mode, top_risk_factors, action_required, alert_generated_at, alert_type
- **Class `RiskScoringEngine`:**
  - `__init__()` — Loads model, feature_cols, model_name from artifacts
  - `score(X)` — Returns delay probabilities from the model
  - `classify_tier(prob)` — Maps probability to risk tier string
  - `_top_factors(row)` — Extracts top 3 human-readable risk drivers
  - `_alert_type(hours_to_sla)` — IMMEDIATE (≤24h), 48H_WARNING (≤48h), or 72H_WARNING
  - `generate_alerts(raw_df, feature_matrix, min_tier)` — Scores all shipments, creates ShipmentAlert objects for those at/above threshold
- **Functions:** `print_alert_summary(alerts)` prints tier counts; `export_alerts_csv(alerts, path)` saves to CSV

#### `recommendation_engine.py`

- **Purpose:** Maps alert attributes to ranked intervention actions using a rule-based decision tree.
- **Language:** Python
- **Imports:** pandas, dataclasses, typing
- **Constants:** `INTERVENTIONS` — Dict of 7 intervention types (REROUTE, ALT_CARRIER, MODE_SWITCH_AIR, PRIORITY_HANDLING, CUSTOMER_ALERT, CUSTOMS_EXPEDITE, WAREHOUSE_HOLD), each with label, description, triggers, applicable modes, cost impact, time saving, SLA impact.
- **Dataclass `Recommendation`:** 11 fields including shipment_id, risk_tier, delay_probability, primary_action, primary_description, fallback_action, cost_impact, estimated_time_saving, sla_impact, confidence, reasoning
- **Class `RecommendationEngine`:**
  - `recommend(alert_row, raw_row)` — Decision tree: checks SLA urgency → disruption type → customs → carrier reliability → port congestion → weather severity → fallback to priority handling. Always appends customer alert as fallback.
  - `batch_recommend(alerts, raw_df, min_tier)` — Filters alerts by min tier, generates recommendation for each
- **Function:** `export_recommendations_csv(recs, path)` saves to CSV

#### `main_pipeline.py`

- **Purpose:** Orchestrates the complete ML pipeline from data generation through Firebase upload.
- **Language:** Python
- **Imports:** os, sys, argparse, time, pandas
- **Functions:**
  - `banner(title)` — Prints formatted section headers
  - `run_training(n_samples)` — Phase 1-3: generates data, runs feature engineering, trains models, selects best
  - `run_prediction(fe, n_live)` — Phase 4-5: generates live data, scores with trained model, generates alerts and recommendations
  - `run_scenario_demo()` — Phase 6: hardcoded scenario (Shanghai→New York, Storm + Port Strike) demonstrating system detection and response
  - `print_final_summary()` — Lists all output files with existence check and file sizes
- **CLI:** `--mode` (train/predict/full/demo), `--train-samples`, `--live-samples`
- **Post-pipeline:** Attempts Firebase upload via `firebase_uploader.upload_all()`

#### `firebase_uploader.py`

- **Purpose:** Pushes ML pipeline results (shipments, alerts, recommendations, metrics) to Firebase Firestore.
- **Language:** Python
- **Imports:** os, json, ast, pandas, numpy, firebase_admin (credentials, firestore)
- **Functions:**
  - `_init_firebase()` — Initializes Firebase Admin SDK from `serviceAccountKey.json` (idempotent)
  - `_clean_value(v)` — Converts numpy/pandas types to native Python for Firestore compatibility
  - `_clean_record(record)` — Applies `_clean_value` to all dict values
  - `_parse_list_field(value)` — Parses stringified Python lists back into real lists
  - `upload_shipments(db)` — Uploads to `shipments` collection (batch writes, 450 per batch)
  - `upload_alerts(db)` — Uploads to `alerts` collection with parsed risk factors
  - `upload_recommendations(db)` — Uploads to `recommendations` collection with parsed reasoning
  - `upload_metrics(db)` — Computes and uploads aggregated metrics to `metrics/summary` document
  - `upload_all()` — Runs all 4 upload functions

### 3.3 Python Backend — Services

#### `services/__init__.py`

- **Purpose:** Makes the `services/` directory a Python package. Empty file.
- **Language:** Python

#### `services/ai_service.py`

- **Purpose:** Provides AI text generation using Google Gemini API (free tier).
- **Language:** Python
- **Imports:** os, httpx, typing
- **Functions:**
  - `_gemini_available()` — Checks if GEMINI_API_KEY env var is set
  - `generate_text(prompt, max_tokens)` — Calls Gemini API's `generateContent` endpoint, returns generated text or None on failure
  - `summarize_alert(alert)` — Generates 2-sentence alert summary via Gemini, falls back to template-based summary
  - `rank_interventions(shipment_id, recommendations)` — Sends recommendations to Gemini for re-ranking (currently returns unchanged)
  - `get_ai_status()` — Returns dict with gemini availability, model name, provider

#### `services/route_service.py`

- **Purpose:** Calculates routes between two geographic points using great-circle math, with optional OpenRouteService integration.
- **Language:** Python
- **Imports:** math, os, httpx, typing
- **Functions:**
  - `haversine_distance(lat1, lng1, lat2, lng2)` — Calculates distance in km between two points using the Haversine formula
  - `great_circle_points(lat1, lng1, lat2, lng2, n)` — Generates n intermediate points along the great circle path
  - `get_route(origin_lat, origin_lng, dest_lat, dest_lng, transport_mode)` — Returns distance, duration (based on mode-specific speeds), and geometry
  - `get_route_ors(origin_lat, origin_lng, dest_lat, dest_lng, profile)` — Calls OpenRouteService API if API key is set
- **Constants:** `SPEED_KMH` — Speeds by transport mode (Air: 800, Sea: 30, Road: 60, Rail: 80 km/h)

#### `services/tracking_service.py`

- **Purpose:** Retrieves aircraft positions from the OpenSky Network API.
- **Language:** Python
- **Imports:** httpx, typing
- **Functions:**
  - `get_aircraft_position(icao24)` — Gets single aircraft position by ICAO24 identifier. Returns dict with icao24, callsign, lat/lng, altitude, speed, heading, on_ground, last_update.
  - `get_all_aircraft_in_bounds(lat_min, lat_max, lng_min, lng_max)` — Gets all aircraft in a geographic bounding box.

#### `services/weather_service.py`

- **Purpose:** Fetches weather data from Open-Meteo API with in-memory caching (1-hour TTL).
- **Language:** Python
- **Imports:** httpx, datetime, timedelta, typing
- **Functions:**
  - `_cache_key(lat, lng)` — Generates cache key from rounded coordinates
  - `_get_cached(key)` — Retrieves cached data if not expired
  - `_set_cached(key, data)` — Stores data with expiry timestamp
  - `get_weather(latitude, longitude)` — Fetches current weather + 2-day hourly forecast, caches result
  - `get_weather_bulk(locations)` — Fetches weather for multiple locations sequentially

### 3.4 Python Backend — API Server

#### `api_server.py`

- **Purpose:** The FastAPI REST API server exposing all backend functionality as HTTP endpoints.
- **Language:** Python
- **Imports:** fastapi, pydantic, pandas, numpy, os, json, logging, datetime, all 4 service modules
- **Setup:** Creates FastAPI app with CORS (allow all origins), defines project directories
- **Helper functions:** `parse_risk_factors(factors_str)` parses string lists; `parse_response_data(data)` cleans response data
- **Request models:** `InterventionRequest`, `RecommendationRequest`, `BulkWeatherRequest`, `AlertSummaryRequest`, `AISummaryRequest`, `RankInterventionsRequest`
- **See Section 5 for complete endpoint documentation.**

### 3.5 Artifact Files

#### `artifacts/best_model_name.txt`

- **Purpose:** Stores the name of the best-performing model selected during training.
- **Content:** `Gradient Boosting`

#### `artifacts/model_comparison.csv`

- **Purpose:** Comparison of all 4 trained models with their validation metrics.
- **Content:** Gradient Boosting (ROC-AUC: 0.9939), Random Forest (0.9811), Logistic Regression (0.9803), Extra Trees (0.9704)

#### `artifacts/feature_importances.csv`

- **Purpose:** Feature importance scores from the best model (Gradient Boosting).
- **Top features:** `composite_risk_score` (0.217), `transit_progress_ratio` (0.124), `route_risk_score` (0.091), `historical_delay_rate` (0.070), `log_weight` (0.069)

#### `artifacts/processed_data.csv`

- **Purpose:** The fully preprocessed and scaled training dataset (all numeric features normalized to 0-1 range).
- **Format:** CSV with all original and engineered features

### 3.6 Frontend — Configuration Files

#### `ship-risk-ai/package.json`

- **Purpose:** Node.js project manifest defining dependencies, dev dependencies, and npm scripts.
- **Scripts:** `dev` (Vite dev server), `build` (TypeScript compile + Vite build), `lint` (ESLint), `preview` (Vite preview), `test` (Vitest), `test:ui` (Vitest UI), `coverage` (Vitest coverage)

#### `ship-risk-ai/vite.config.ts`

- **Purpose:** Vite bundler configuration. Uses React plugin and configures dev server on port 5174.

#### `ship-risk-ai/vitest.config.ts`

- **Purpose:** Vitest test runner configuration. Uses jsdom environment, React plugin, setup file, V8 coverage provider, and `@` path alias.

#### `ship-risk-ai/tsconfig.json`

- **Purpose:** Root TypeScript configuration using project references to `tsconfig.app.json` and `tsconfig.node.json`.

#### `ship-risk-ai/tsconfig.app.json`

- **Purpose:** TypeScript config for the application source. Targets ES2022, uses react-jsx, bundler module resolution, strict mode enabled.

#### `ship-risk-ai/tsconfig.node.json`

- **Purpose:** TypeScript config for Node.js files (e.g., vite.config.ts). Targets ES2023.

#### `ship-risk-ai/tailwind.config.js`

- **Purpose:** Tailwind CSS theme customization. Extends default theme with custom color palette: `primary` (#2A0800), `secondary` (#775144), `accent` (#C09891), `background` (#FADBD8), `darkBg` (#0F0F0F), and risk tier colors (low: green, medium: amber, high: orange, critical: red).

#### `ship-risk-ai/postcss.config.js`

- **Purpose:** PostCSS configuration using the `@tailwindcss/postcss` plugin for Tailwind CSS 4 processing.

#### `ship-risk-ai/eslint.config.js`

- **Purpose:** ESLint flat config for TypeScript and React. Includes `@eslint/js` recommended rules, `typescript-eslint` recommended rules, `react-hooks` rules, and `react-refresh` Vite config. Ignores `dist/` directory.

#### `ship-risk-ai/index.html`

- **Purpose:** The HTML shell for the Vite SPA. Contains the `<div id="root">` mount point and a script tag loading `src/main.tsx`.

#### `ship-risk-ai/firebase.json`

- **Purpose:** Firebase Hosting config for the frontend. Serves from `dist/`, ignores Firebase config and dotfiles, rewrites all routes to `index.html`.

#### `ship-risk-ai/.firebaserc`

- **Purpose:** Maps Firebase project alias to `"ship-risk-ai"`.

#### `ship-risk-ai/.env.local.example`

- **Purpose:** Template for frontend-specific environment variables: Firebase config (6 VITE\_ vars), API base URL, Gemini API key.

### 3.7 Frontend — Entry Points & Styles

#### `ship-risk-ai/src/main.tsx`

- **Purpose:** React DOM entry point. Creates root on `#root` element and renders `<App />` within `<StrictMode>`.
- **Imports:** React (StrictMode), react-dom/client (createRoot), App, globals.css

#### `ship-risk-ai/src/App.tsx`

- **Purpose:** Root React component. Sets up the complete application with providers, routing, and lazy-loaded pages.
- **Provider hierarchy:** ErrorBoundary → ThemeProvider → BrowserRouter → NotificationProvider → AuthProvider → ShipmentProvider
- **Routing:** Public routes (`/`, `/login`, `/signup`), Protected routes inside DashboardLayout (`/dashboard`, `/shipments`, `/shipments/:id`, `/alerts`, `/recommendations`, `/analytics`, `/live-tracking`, `/add-shipment`), 404 catch-all
- **Code splitting:** All dashboard pages are lazy-loaded via `React.lazy()` and `import()`

#### `ship-risk-ai/src/styles/globals.css`

- **Purpose:** Global stylesheet defining CSS custom properties for dark/light themes, Tailwind CSS layers (base, components, utilities), and animations.
- **Themes:** Dark theme (default) with dark backgrounds and light text; Light theme with light backgrounds and dark text. Toggled via `data-theme` attribute.
- **Component classes:** `.btn-primary`, `.btn-secondary`, `.card` (glassmorphism), `.input-field`
- **Utility classes:** `.glass`, `.glass-light`, `.gradient-primary`, `.gradient-accent`, `.text-shadow`
- **Animations:** `fadeIn`, `slideIn`, `.animate-fadeIn`, `.animate-slideIn`
- **Scrollbar:** Custom scrollbar styling matching accent color

#### `ship-risk-ai/src/styles/tracking.css`

- **Purpose:** Leaflet map theme overrides for dark and light modes. Styles zoom controls, attribution, popups, tooltips, markers. Includes `pulse-critical` keyframe animation for critical markers.

#### `ship-risk-ai/src/App.css` / `ship-risk-ai/src/index.css`

- **Purpose:** Minimal reset styles. All actual styling is handled by `globals.css` and Tailwind.

### 3.8 Frontend — Type Definitions

#### `types/shipment.ts`

- Defines `TransportMode` ('Air' | 'Sea' | 'Road' | 'Rail'), `ShipmentStatus`, `WeatherCondition`, `DisruptionType` union types, and the `Shipment` interface with 24 fields.

#### `types/alert.ts`

- Defines `RiskTier` ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'), `AlertType` ('IMMEDIATE' | '48H_WARNING' | '72H_WARNING'), and `ShipmentAlert` interface with 13 fields.

#### `types/risk.ts`

- Defines `Recommendation` interface (11 fields) and `RiskMetrics` interface (7 fields: total_shipments, critical_alerts, high_alerts, medium_alerts, low_alerts, average_risk_score, shipments_at_risk).

#### `types/tracking.ts`

- Defines `LatLng`, `MapBounds`, `WeatherData`, `WeatherForecast`, `AircraftPosition`, `VesselPosition`, `RouteInfo`, `TrackedShipment` (28 fields including geo positions), `TrackingEvent`, `TrackingStats`, `LayerVisibility` interfaces.
- Exports `WEATHER_CODES` (WMO code → description + emoji mapping) and `CITY_COORDS` (70+ city → lat/lng coordinate lookup table).

#### `types/user.ts`

- Defines `UserRole` ('admin' | 'user'), `User` interface (6 fields), `AuthContextType` interface (9 fields including login/signup/logout/loginAsDemo methods).

### 3.9 Frontend — Services

#### `services/firebase.ts`

- **Purpose:** Initializes Firebase SDK with environment variables. Conditionally creates `auth`, `db` (Firestore), and `analytics` instances. Exports them for use throughout the app. If config is missing, Firebase features are disabled gracefully.

#### `services/api.ts`

- **Purpose:** `ApiService` class providing data access methods. Reads from Firestore as primary source, falls back to mock data. Also supports writing shipments to both the backend CSV API and Firestore.
- **Methods:** `getShipments()`, `getShipmentById(id)`, `addShipment(data)`, `getAlerts()`, `getRecommendations(shipmentId)`, `getAllRecommendations()`, `getRiskMetrics()`, `executeIntervention(shipmentId, action)`, plus mock fallbacks.

#### `services/aiService.ts`

- **Purpose:** AI-powered shipment analysis using Google Gemini. Provides a 3-tier approach: try backend API → try Gemini directly from browser → smart rule-based fallback.
- **Functions:** `buildPrompt()` creates context-rich prompts from shipment data, `callGeminiDirect()` calls Gemini REST API, `classifyQuery()` categorizes user queries, 5 fallback generators (summary, risks, recommendations, ETA, actions), `generateAISummary()` main entry point.

#### `services/alertService.ts`

- **Purpose:** Singleton service for client-side alert calculations. Computes risk tiers, hours to SLA, alert types, top risk factors, and action requirements from shipment data.
- **Methods:** `calculateRiskTier()`, `calculateHoursToSLA()`, `getAlertType()`, `generateTopRiskFactors()`, `getActionRequired()`, `shouldTriggerAlert()`, `prioritizeAlerts()`

#### `services/exportService.ts`

- **Purpose:** Handles data export to CSV and PDF formats. CSV uses blob download; PDF generates HTML and opens in a new window for browser printing.
- **Functions:** `exportToCSV()`, `generateShipmentReportPDF()` (detailed multi-section report), `exportAlertsToPDF()`, `exportService` object (convenience methods).

#### `services/route.ts`

- **Purpose:** Client-side great-circle route generation for map visualization. Calculates intermediate points, distance (Haversine), and estimated duration.
- **Functions:** `generateGreatCircleRoute()`, `haversineDistance()`, `buildRouteInfo()`

#### `services/tracking.ts`

- **Purpose:** Converts raw Shipment data into geo-enriched TrackedShipment objects for the map. Uses CITY_COORDS lookup, interpolates current position based on transit progress.
- **Functions:** `shipmentToTracked()`, `computeTrackingStats()`, `generateEvents()`

#### `services/weather.ts`

- **Purpose:** Client-side Open-Meteo weather API client. Fetches current weather and 2-day forecasts, supports batch fetching with rate-limit-aware batching (5 at a time).
- **Functions:** `getWeather()`, `getWeatherForecast()`, `getWeatherBatch()`

### 3.10 Frontend — Contexts

#### `contexts/AuthContext.tsx`

- **Purpose:** Manages authentication state using Firebase Auth. Provides login, signup, logout, and demo login methods. Stores user info and role in state. Listens to `onAuthStateChanged` for persistent sessions.
- **Demo mode:** Creates a fake user object with `uid: "demo-user-{timestamp}"` without touching Firebase.

#### `contexts/NotificationContext.tsx`

- **Purpose:** Manages toast notification state. Provides `addNotification(type, message, duration)` and `removeNotification(id)`. Auto-removes notifications after duration (default 5s).

#### `contexts/ShipmentContext.tsx`

- **Purpose:** Central data store for shipments, alerts, recommendations, and metrics. Sets up real-time Firestore `onSnapshot` listeners for all 3 collections. Detects newly added shipments for notification events. Falls back to API service when Firestore is unavailable. Computes metrics from shipments and alerts.

#### `contexts/ThemeContext.tsx`

- **Purpose:** Manages dark/light theme preference. Persists to localStorage, respects system preference on first visit, applies `data-theme` attribute and `dark` class to `<html>`.

### 3.11 Frontend — Hooks

#### `hooks/useAuth.ts` — Re-exports `useAuth` from AuthContext.

#### `hooks/useNotification.ts` — Re-exports `useNotification` from NotificationContext.

#### `hooks/useFirestore.ts` — Generic Firestore real-time listener hook. Accepts collection name and query constraints, returns `{ data, loading, error }`.

#### `hooks/useShipments.ts` — Fetches shipments via `apiService.getShipments()`, returns `{ shipments, loading, error, refetch }`.

#### `hooks/useTracking.ts` — Builds tracked shipment data from ShipmentContext, computes stats and events, fetches weather on demand, auto-refreshes every 30 seconds.

### 3.12 Frontend — Components

(Detailed descriptions of all 30 components were read and analyzed. Key highlights:)

- **AiAdvisor.tsx:** AI chatbot panel with 5 suggestion buttons, text input, calls `generateAISummary`, shows response with source attribution
- **Auth components:** ForgotPasswordModal (Firebase password reset), LoginModal (role selection: User/Admin), ProtectedRoute (auth guard → Navigate to /)
- **Chart components:** AlertTrendChart (line, mock data), DelayProbabilityChart (bar, real data), RiskDistributionChart (donut, metrics data)
- **Common components:** ErrorBoundary (class-based), ExportToolbar (CSV/PDF), Footer, Header (notifications dropdown, theme toggle), NotificationToast (framer-motion toasts), Sidebar (navigation links)
- **Dashboard components:** RiskMetrics (4 KPI cards), ShipmentAlerts (paginated, filterable alerts)
- **Layout:** DashboardLayout (Header + Sidebar + Outlet + Footer, responsive)
- **Map components:** LayerControls (5 layer toggles), MapView (Leaflet map with shipment markers, route polylines, weather icons)
- **Risk components:** RiskFactorsList (animated bullet list), RiskIndicator (SVG circular gauge), RiskTier (colored badge)
- **Shipment components:** ShipmentCard, ShipmentDetail (modal), ShipmentFilter (4 dropdowns), ShipmentList (grid + detail modal)
- **Tracking components:** EventFeed (horizontal scroll, filterable), LiveStats (stats bar), SearchBar (search with dropdown), TrackingDetails (side panel with weather fetch)

### 3.13 Frontend — Pages

- **Home.tsx:** Marketing landing page with hero section, feature cards, stats counters, and CTA to login/dashboard
- **Login.tsx:** Login form with email/password fields, "Forgot Password" link, demo login options (Admin/User), signup link
- **Signup.tsx:** Signup form with email, password, confirm password, and role selection (User/Admin)
- **Dashboard.tsx:** Renders RiskMetrics, RiskDistributionChart, AlertTrendChart, DelayProbabilityChart, ShipmentAlerts
- **Shipments.tsx:** Shipments list page with search, multi-filter panel (risk tier, status, carrier, transport mode), pagination, sorting, ExportToolbar, ShipmentList grid
- **ShipmentDetails.tsx:** Single shipment detail page with full risk assessment, AI Advisor panel, alerts and recommendations for the specific shipment
- **Alerts.tsx:** Alerts page with tier filter tabs, sorting by probability, ExportToolbar, paginated alert list
- **Recommendations.tsx:** Recommendations list page with risk tier filters and confidence indicators
- **Analytics.tsx:** Analytics page with all 3 chart types plus additional computed analytics
- **LiveTracking.tsx:** Interactive map page with SearchBar, LayerControls, MapView, LiveStats, EventFeed, and TrackingDetails side panel
- **AddShipment.tsx:** Two-mode form (manual entry with validated fields or CSV file upload with validation/preview), writes to backend API + Firestore
- **NotFound.tsx:** 404 page with animated illustration and navigation links

### 3.14 Frontend — Utility Files

#### `utils/constants.ts`

- Risk tier colors, icons, labels; carrier list; transport modes; API_BASE_URL from env

#### `utils/formatters.ts`

- `formatPercentage()`, `formatNumber()`, `formatCurrency()`, `formatDate()`, `formatDateTime()`, `formatHours()`, `truncateText()`

#### `utils/helpers.ts`

- `getRiskTierColor()`, `calculateDaysRemaining()`, `classNames()`, `debounce()`

#### `utils/riskCalculations.ts`

- `calculateCompositeRiskScore()`, `calculateTransitProgress()`, `estimateDelayHours()`, `calculateSLABuffer()`, `isHighPriority()`, `getRiskLevel()`, `calculateCarrierPerformanceScore()`, `predictArrivalWindow()`

#### `utils/csvHelpers.ts`

- File-based CSV parser: `parseCSV(file)`, `validateCSVRow()`, `validateCSVBatch()`, `downloadSampleCSV()`

#### `utils/csvValidator.ts`

- PapaParse-based CSV validator: `validateCSV(csvText, fileSize)`, `validateCSVFile(file)`

---

## 4. Complete Function & Method Reference

### 4.1 Python — data_generator.py

| Function                          | Parameters                 | Returns        | Description                                                                      | Called From                                                                               | Side Effects            |
| --------------------------------- | -------------------------- | -------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------- |
| `_route_risk(origin, dest)`       | `origin: str`, `dest: str` | `float`        | Looks up route risk from ROUTE_RISK dict or generates random 0.10-0.45           | `generate_shipment_data()`                                                                | None                    |
| `_traffic_score(transport_mode)`  | `transport_mode: str`      | `int`          | Returns base traffic score by mode + random 0-3                                  | `generate_shipment_data()`                                                                | None                    |
| `_compute_delay_probability(row)` | `row: dict`                | `float`        | Weighted heuristic combining all risk signals + Gaussian noise, clamped to [0,1] | `generate_shipment_data()`                                                                | None                    |
| `generate_shipment_data(n)`       | `n: int = 5000`            | `pd.DataFrame` | Generates n synthetic shipment records with 25+ features and delay labels        | `main_pipeline.py: run_training()`, `run_prediction()`, `run_scenario_demo()`, standalone | Prints generation stats |

### 4.2 Python — feature_engineering.py (ShipmentFeatureEngineer)

| Method                  | Parameters                      | Returns           | Description                                                                    | Called From                                                 | Side Effects                  |
| ----------------------- | ------------------------------- | ----------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- | ----------------------------- |
| `clean(df)`             | `df: pd.DataFrame`              | `pd.DataFrame`    | Drops duplicates, clamps scores, fills NaNs                                    | `fit_transform()`, `transform()`                            | Prints stats                  |
| `engineer_features(df)` | `df: pd.DataFrame`              | `pd.DataFrame`    | Creates transit_progress_ratio, composite_risk_score, log_weight, sla_pressure | `fit_transform()`, `transform()`                            | Prints stats                  |
| `encode(df, fit)`       | `df: pd.DataFrame`, `fit: bool` | `pd.DataFrame`    | Label-encodes 7 categorical columns                                            | `fit_transform()`, `transform()`                            | Stores/loads label_encoders   |
| `scale(df, fit)`        | `df: pd.DataFrame`, `fit: bool` | `pd.DataFrame`    | MinMaxScaler on all numeric features                                           | `fit_transform()`, `transform()`                            | Stores/loads scaler           |
| `split(df)`             | `df: pd.DataFrame`              | `tuple` (6 items) | 70/15/15 stratified train/val/test split                                       | `fit_transform()`                                           | Prints split sizes            |
| `fit_transform(df)`     | `df: pd.DataFrame`              | `tuple` (7 items) | Full pipeline: clean→engineer→encode→scale→split                               | `main_pipeline.py: run_training()`                          | Saves .pkl and .csv artifacts |
| `transform(df)`         | `df: pd.DataFrame`              | `pd.DataFrame`    | Applies saved pipeline without fitting                                         | `main_pipeline.py: run_prediction()`, `run_scenario_demo()` | Loads .pkl artifacts          |

### 4.3 Python — model_training.py

| Function                                       | Parameters                   | Returns             | Description                                                    | Called From                        | Side Effects                               |
| ---------------------------------------------- | ---------------------------- | ------------------- | -------------------------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| `build_models()`                               | None                         | `dict`              | Returns 4 configured sklearn classifiers                       | `train_all()`                      | None                                       |
| `train_all(X_train, y_train, X_val, y_val)`    | Training and validation data | `dict`              | Trains all 4 models, computes metrics                          | `main_pipeline.py: run_training()` | Prints training progress                   |
| `select_and_evaluate(results, X_test, y_test)` | `results: dict`, test data   | `tuple(str, model)` | Selects best by ROC-AUC, prints report and feature importances | `main_pipeline.py: run_training()` | Saves feature_importances.csv              |
| `save_model(model, name)`                      | `model`, `name: str`         | None                | Saves model as .pkl                                            | `main_pipeline.py: run_training()` | Writes best_model.pkl, best_model_name.txt |
| `print_comparison(results)`                    | `results: dict`              | None                | Prints and saves model comparison table                        | `main_pipeline.py: run_training()` | Writes model_comparison.csv                |

### 4.4 Python — risk_scoring.py (RiskScoringEngine)

| Method                                              | Parameters                  | Returns               | Description                               | Called From                                                 | Side Effects     |
| --------------------------------------------------- | --------------------------- | --------------------- | ----------------------------------------- | ----------------------------------------------------------- | ---------------- |
| `__init__()`                                        | None                        | `RiskScoringEngine`   | Loads model, feature_cols, model_name     | `main_pipeline.py: run_prediction()`, `run_scenario_demo()` | Reads .pkl files |
| `score(X)`                                          | `X: pd.DataFrame`           | `np.ndarray`          | Returns delay probability for each row    | `generate_alerts()`                                         | None             |
| `classify_tier(prob)`                               | `prob: float`               | `str`                 | Maps probability to RISK_TIERS key        | `generate_alerts()`                                         | None             |
| `_top_factors(row)`                                 | `row: pd.Series`            | `list[str]`           | Top 3 human-readable risk drivers         | `generate_alerts()`                                         | None             |
| `_alert_type(hours_to_sla)`                         | `hours_to_sla: float`       | `str`                 | IMMEDIATE/48H_WARNING/72H_WARNING         | `generate_alerts()`                                         | None             |
| `generate_alerts(raw_df, feature_matrix, min_tier)` | DataFrames, `min_tier: str` | `list[ShipmentAlert]` | Scores and creates alerts above threshold | `main_pipeline.py: run_prediction()`, `run_scenario_demo()` | None             |

### 4.5 Python — recommendation_engine.py (RecommendationEngine)

| Method                                      | Parameters                    | Returns                | Description                                             | Called From                                                 | Side Effects |
| ------------------------------------------- | ----------------------------- | ---------------------- | ------------------------------------------------------- | ----------------------------------------------------------- | ------------ |
| `recommend(alert_row, raw_row)`             | `dict`, `pd.Series`           | `Recommendation`       | Decision tree mapping alert attributes to interventions | `batch_recommend()`                                         | None         |
| `batch_recommend(alerts, raw_df, min_tier)` | `list`, `pd.DataFrame`, `str` | `list[Recommendation]` | Generates recommendations for alerts above threshold    | `main_pipeline.py: run_prediction()`, `run_scenario_demo()` | Prints count |

### 4.6 Python — API Server Functions

| Function                          | Parameters   | Returns      | Description                           | Called From             | Side Effects |
| --------------------------------- | ------------ | ------------ | ------------------------------------- | ----------------------- | ------------ |
| `parse_risk_factors(factors_str)` | `str`        | `list`       | Parses string representation of list  | `parse_response_data()` | None         |
| `parse_response_data(data)`       | `list\|dict` | `list\|dict` | Converts risk factor strings to lists | `get_alerts()`          | None         |

### 4.7 Python — Service Functions

See individual service file descriptions in Section 3.3.

### 4.8 Frontend — Key Functions (TypeScript)

| Function                      | File                  | Parameters                                          | Returns                     | Description                                       |
| ----------------------------- | --------------------- | --------------------------------------------------- | --------------------------- | ------------------------------------------------- |
| `generateAISummary`           | `aiService.ts`        | `shipmentId, query, context?`                       | `Promise<AIResponse>`       | Main AI entry: tries backend → Gemini → fallback  |
| `buildPrompt`                 | `aiService.ts`        | `context, query`                                    | `string`                    | Builds rich context prompt for Gemini             |
| `callGeminiDirect`            | `aiService.ts`        | `prompt`                                            | `Promise<string>`           | Calls Gemini REST API from browser                |
| `generateGreatCircleRoute`    | `route.ts`            | `originLat, originLng, destLat, destLng, numPoints` | `[number, number][]`        | Generates intermediate great-circle points        |
| `haversineDistance`           | `route.ts`            | `lat1, lng1, lat2, lng2`                            | `number` (km)               | Calculates distance between two points            |
| `shipmentToTracked`           | `tracking.ts`         | `shipment, alerts`                                  | `TrackedShipment`           | Converts Shipment to geo-enriched TrackedShipment |
| `computeTrackingStats`        | `tracking.ts`         | `tracked[]`                                         | `TrackingStats`             | Computes aggregate tracking statistics            |
| `generateEvents`              | `tracking.ts`         | `tracked[]`                                         | `TrackingEvent[]`           | Generates event feed from tracked shipments       |
| `exportToCSV`                 | `exportService.ts`    | `data[], filename`                                  | `void`                      | Downloads data as CSV file                        |
| `generateShipmentReportPDF`   | `exportService.ts`    | `shipment, alerts, recommendations`                 | `void`                      | Generates and opens detailed HTML PDF report      |
| `parseCSV`                    | `csvHelpers.ts`       | `file: File`                                        | `Promise<ShipmentCSVRow[]>` | Parses and validates CSV file                     |
| `validateCSVBatch`            | `csvHelpers.ts`       | `rows[]`                                            | `CSVValidationResult`       | Validates entire CSV dataset                      |
| `calculateCompositeRiskScore` | `riskCalculations.ts` | `shipment: Shipment`                                | `number`                    | Weighted risk score calculation                   |
| `formatPercentage`            | `formatters.ts`       | `value: number`                                     | `string`                    | Formats decimal as "XX.X%"                        |
| `formatDate`                  | `formatters.ts`       | `dateString`                                        | `string`                    | Formats as "Mon DD, YYYY"                         |
| `formatHours`                 | `formatters.ts`       | `hours: number`                                     | `string`                    | Formats as "Xd Xh" or "Xh"                        |

---

## 5. API Reference

All API endpoints are served by `api_server.py` via FastAPI. Base URL: `http://localhost:8000`.

### 5.1 Root

| Route         | Method | Description                      | Auth | Handler          |
| ------------- | ------ | -------------------------------- | ---- | ---------------- |
| `GET /`       | GET    | API info & status                | No   | `read_root()`    |
| `GET /health` | GET    | Health check with service status | No   | `health_check()` |

**`GET /` Response:**

```json
{ "message": "Ship Risk AI API", "version": "1.0.0", "status": "operational" }
```

**`GET /health` Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-03-25T12:00:00",
  "version": "2.0.0",
  "data_available": {
    "shipments": true,
    "alerts": true,
    "recommendations": true
  },
  "services": {
    "weather": "Open-Meteo (free, unlimited)",
    "aircraft_tracking": "OpenSky Network (free, 400 req/hr)",
    "ai": {
      "gemini_available": true,
      "model": "gemini-2.0-flash",
      "provider": "Google Gemini"
    }
  }
}
```

### 5.2 Shipments

| Route                              | Method | Params                            | Description                | Handler             |
| ---------------------------------- | ------ | --------------------------------- | -------------------------- | ------------------- |
| `GET /api/shipments`               | GET    | `limit: int=100`, `offset: int=0` | List shipments (paginated) | `get_shipments()`   |
| `POST /api/shipments`              | POST   | Body: shipment object (JSON)      | Create new shipment        | `create_shipment()` |
| `GET /api/shipments/{shipment_id}` | GET    | `shipment_id: str` (path)         | Get single shipment        | `get_shipment()`    |

**`POST /api/shipments` Request Body:** Any JSON object with required `shipment_id` field.
**Response:** `{ "success": true, "message": "...", "shipment_id": "..." }`

### 5.3 Alerts

| Route             | Method | Params                  | Description                         | Handler        |
| ----------------- | ------ | ----------------------- | ----------------------------------- | -------------- |
| `GET /api/alerts` | GET    | `min_tier: str = "LOW"` | Get alerts filtered by minimum tier | `get_alerts()` |

### 5.4 Recommendations

| Route                       | Method | Params                           | Description                      | Handler                 |
| --------------------------- | ------ | -------------------------------- | -------------------------------- | ----------------------- |
| `POST /api/recommendations` | POST   | Body: `{ "shipment_id": "..." }` | Get recommendations for shipment | `get_recommendations()` |

### 5.5 Analytics

| Route                | Method | Description               | Handler           |
| -------------------- | ------ | ------------------------- | ----------------- |
| `GET /api/analytics` | GET    | Aggregated risk analytics | `get_analytics()` |

**Response:**

```json
{
  "total_shipments": 500,
  "critical_alerts": 12,
  "high_alerts": 45,
  "medium_alerts": 128,
  "low_alerts": 315,
  "average_risk_score": 0.34,
  "shipments_at_risk": 185
}
```

### 5.6 Interventions

| Route                     | Method | Params                                            | Description           | Handler                  |
| ------------------------- | ------ | ------------------------------------------------- | --------------------- | ------------------------ |
| `POST /api/interventions` | POST   | Body: `{ "shipment_id": "...", "action": "..." }` | Schedule intervention | `execute_intervention()` |

### 5.7 Weather

| Route                                     | Method | Params                                          | Description                    | Handler                  |
| ----------------------------------------- | ------ | ----------------------------------------------- | ------------------------------ | ------------------------ |
| `GET /api/weather/{latitude}/{longitude}` | GET    | Path: lat, lng (float)                          | Current weather for location   | `get_location_weather()` |
| `POST /api/weather/bulk`                  | POST   | Body: `{ "locations": [{"lat": N, "lng": N}] }` | Weather for multiple locations | `get_bulk_weather()`     |

### 5.8 Tracking

| Route                              | Method | Params                                       | Description                  | Handler                 |
| ---------------------------------- | ------ | -------------------------------------------- | ---------------------------- | ----------------------- |
| `GET /api/track/aircraft/{icao24}` | GET    | `icao24: str` (path)                         | Get aircraft position        | `track_aircraft()`      |
| `GET /api/track/aircraft`          | GET    | `lat_min, lat_max, lng_min, lng_max` (query) | Get aircraft in bounding box | `track_aircraft_area()` |
| `GET /api/tracking/stats`          | GET    | None                                         | Live tracking statistics     | `get_tracking_stats()`  |

### 5.9 Routes

| Route                | Method | Params                                                       | Description                    | Handler                |
| -------------------- | ------ | ------------------------------------------------------------ | ------------------------------ | ---------------------- |
| `GET /api/route`     | GET    | `origin_lat, origin_lng, dest_lat, dest_lng, transport_mode` | Calculate route (great-circle) | `get_route_endpoint()` |
| `GET /api/route/ors` | GET    | `origin_lat, origin_lng, dest_lat, dest_lng, profile`        | Route via OpenRouteService     | `get_ors_route()`      |

### 5.10 AI

| Route                             | Method | Params                                                     | Description                         | Handler                   |
| --------------------------------- | ------ | ---------------------------------------------------------- | ----------------------------------- | ------------------------- |
| `POST /api/ai/summarize-alert`    | POST   | Body: AlertSummaryRequest                                  | Generate AI alert summary           | `ai_summarize_alert()`    |
| `POST /api/ai/summary`            | POST   | Body: `{ "shipment_id": "...", "query": "..." }`           | AI shipment summary (context-aware) | `ai_shipment_summary()`   |
| `POST /api/ai/rank-interventions` | POST   | Body: `{ "shipment_id": "...", "recommendations": [...] }` | AI-ranked interventions             | `ai_rank_interventions()` |
| `GET /api/ai/status`              | GET    | None                                                       | Check AI service availability       | `ai_status()`             |

**Middleware chain:** All endpoints pass through CORS middleware (allow all origins, methods, headers). No authentication middleware is applied to API endpoints — auth is handled at the frontend level via Firebase.

---

## 6. Project Workflow (End-to-End)

### 6.1 Startup Sequence

**Development (`start.sh`):**

1. Checks for virtual environment and node_modules
2. If no data files exist, runs `main_pipeline.py --mode full` to generate everything
3. Starts `python api_server.py` on port 8000 (background)
4. Waits for `/health` to respond (up to 30s)
5. Starts `npm run dev` in `ship-risk-ai/` on port 5173 (background)
6. Both processes run until SIGINT/SIGTERM

**Production (Docker):**

1. `docker-compose up` starts `api` and `nginx` services
2. API container runs `python api_server.py`, exposes port 8000
3. Nginx container serves built frontend from `dist/`, proxies `/api/` to backend

### 6.2 ML Pipeline Flow

```
main_pipeline.py --mode full
├── PHASE 1: Data Generation
│   └── generate_shipment_data(6000) → data/shipments_raw.csv
├── PHASE 2: Feature Engineering
│   └── ShipmentFeatureEngineer.fit_transform()
│       ├── clean() → drop duplicates, clamp, fill NaN
│       ├── engineer_features() → transit_progress_ratio, composite_risk_score, log_weight, sla_pressure
│       ├── encode() → label-encode 7 categoricals → artifacts/label_encoders.pkl
│       ├── scale() → MinMaxScale numerics → artifacts/scaler.pkl, feature_cols.pkl
│       └── split() → 70/15/15 stratified split
├── PHASE 3: Model Training
│   ├── train_all() → trains Logistic Regression, Random Forest, Gradient Boosting, Extra Trees
│   ├── print_comparison() → artifacts/model_comparison.csv
│   └── select_and_evaluate() → artifacts/best_model.pkl, best_model_name.txt, feature_importances.csv
├── PHASE 4: Live Shipment Scoring
│   ├── generate_shipment_data(500) → data/live_shipments.csv
│   ├── ShipmentFeatureEngineer.transform() → preprocessed features
│   ├── RiskScoringEngine.generate_alerts() → outputs/alerts.csv
│   └── print_alert_summary()
├── PHASE 5: Recommendation Engine
│   └── RecommendationEngine.batch_recommend() → outputs/recommendations.csv
├── PHASE 6: Scenario Demo (optional)
│   └── Hardcoded Shanghai→New York storm+strike scenario
└── FIREBASE UPLOAD
    └── upload_all() → shipments, alerts, recommendations, metrics → Firestore
```

### 6.3 Request Lifecycle (Frontend)

1. User navigates to a page (e.g., `/dashboard`)
2. `ProtectedRoute` checks `AuthContext.user` — redirects to `/` if not authenticated
3. `DashboardLayout` renders Header, Sidebar, and `<Outlet />` (the page)
4. Page component reads from `ShipmentContext` which:
   - **If Firestore is configured:** Real-time `onSnapshot` listeners fire immediately with cached data, then update on any Firestore changes
   - **If Firestore is not configured:** Falls back to `apiService` which calls FastAPI endpoints
5. Components render data with React, Tailwind CSS, and Framer Motion animations
6. User interactions (filter, search, click) update local component state
7. Write operations (add shipment, execute intervention) → POST to backend API + write to Firestore

### 6.4 Data Flow

```
[Python ML Pipeline]
    ↓ generates
[CSV files: data/, outputs/, artifacts/]
    ↓ uploads via firebase_uploader.py
[Firebase Firestore] ←→ [React Frontend (real-time listeners)]
    ↑ also serves via
[FastAPI Server] ← reads CSV files directly
    ↑ called by
[React Frontend (fallback when Firestore unavailable)]
```

### 6.5 User Flow — Major Features

**Dashboard:**
User logs in → sees KPI cards (total shipments, critical alerts, at-risk count, avg risk) → views risk distribution donut chart + alert trend line chart + delay probability bar chart → scrolls to active alerts list → can filter by tier → clicks "View Details" to navigate to shipment

**Live Tracking:**
User navigates to `/live-tracking` → sees world map with shipment markers (colored by risk tier) → route polylines drawn between origin/destination → can search for shipments → clicking a marker or search result opens TrackingDetails side panel with weather data → EventFeed shows live risk events at bottom

**Add Shipment (Manual):**
User navigates to `/add-shipment` → fills form fields (ID, origin, destination, carrier, mode, dates, weight, etc.) → clicks "Add Shipment" → POST to `/api/shipments` → also writes to Firestore → notification toast confirms success → ShipmentContext auto-updates via listener

**Add Shipment (CSV Upload):**
User switches to CSV tab → downloads sample CSV → fills data → uploads file → client-side validation (headers, types, ranges) → preview table shown → clicks "Import X Shipments" → each row POSTed to API + written to Firestore

**AI Advisor:**
User views a shipment detail page → AI Advisor panel shows 5 suggestion buttons → clicks one or types custom query → tries backend AI endpoint → tries Gemini directly → falls back to rule-based analysis → shows response with source attribution

### 6.6 Build & Deploy Pipeline

**Frontend Build:**

```bash
cd ship-risk-ai
npm ci          # Install exact dependencies
npm run build   # tsc -b && vite build → produces dist/
```

**Firebase Deployment:**

```bash
firebase deploy --only hosting  # Deploys dist/ to ship-risk-ai.web.app
```

**Docker Deployment:**

```bash
docker-compose build    # Builds multi-stage Docker image
docker-compose up -d    # Starts API + Nginx containers
```

**Heroku Deployment:**

```bash
git push heroku main    # Uses Procfile: gunicorn api_server:app
```

---

## 7. Frameworks, Libraries & Tools

### 7.1 Python Dependencies (runtime)

| Name           | Version                | Description               | Role in Project                                                                      | Used In                                                                                                                                      |
| -------------- | ---------------------- | ------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| pandas         | ≥2.2.0                 | Data manipulation library | DataFrame operations for all pipeline stages                                         | data_generator.py, feature_engineering.py, model_training.py, risk_scoring.py, recommendation_engine.py, firebase_uploader.py, api_server.py |
| numpy          | ≥1.26.0                | Numerical computing       | Array operations, NaN handling                                                       | data_generator.py, feature_engineering.py, risk_scoring.py, firebase_uploader.py, api_server.py                                              |
| scikit-learn   | ≥1.4.0                 | Machine learning library  | Model training (LR, RF, GB, ET), preprocessing (LabelEncoder, MinMaxScaler), metrics | feature_engineering.py, model_training.py                                                                                                    |
| firebase-admin | ≥6.4.0                 | Firebase Admin SDK        | Server-side Firestore writes                                                         | firebase_uploader.py                                                                                                                         |
| fastapi        | ≥0.109.0               | Async web framework       | REST API endpoints                                                                   | api_server.py                                                                                                                                |
| uvicorn        | ≥0.27.0                | ASGI server               | Runs FastAPI app                                                                     | api_server.py (main block)                                                                                                                   |
| gunicorn       | ≥21.2.0                | WSGI/ASGI server          | Production server for Heroku                                                         | Procfile                                                                                                                                     |
| python-dotenv  | ≥1.0.0                 | .env file loader          | Environment variable management                                                      | (available for import)                                                                                                                       |
| requests       | ≥2.31.0                | HTTP client               | Sync HTTP requests                                                                   | (available for import)                                                                                                                       |
| pydantic       | ≥2.5.0                 | Data validation           | Request/response models in FastAPI                                                   | api_server.py                                                                                                                                |
| statsmodels    | ≥0.14.0                | Statistical modeling      | (available for advanced analysis)                                                    | (installed but not directly used)                                                                                                            |
| shap           | ≥0.44.0                | Model interpretability    | (available for SHAP analysis)                                                        | (installed but not directly used)                                                                                                            |
| scipy          | ≥1.13.0                | Scientific computing      | (available for advanced math)                                                        | (installed but not directly used)                                                                                                            |
| httpx          | ≥0.24.0                | Async HTTP client         | External API calls (Gemini, OpenSky, Open-Meteo, ORS)                                | services/ai_service.py, services/tracking_service.py, services/weather_service.py, services/route_service.py                                 |
| joblib         | (bundled with sklearn) | Object serialization      | Saves/loads .pkl model artifacts                                                     | feature_engineering.py, model_training.py, risk_scoring.py                                                                                   |

### 7.2 Frontend Dependencies (runtime)

| Name                 | Version  | Description                 | Role in Project                                           | Used In                                                                                       |
| -------------------- | -------- | --------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| react                | ^19.2.0  | UI component library        | Core rendering framework                                  | All .tsx files                                                                                |
| react-dom            | ^19.2.0  | React DOM renderer          | Renders React to browser DOM                              | main.tsx                                                                                      |
| react-router-dom     | ^7.13.1  | Client-side routing         | SPA navigation (BrowserRouter, Routes, NavLink)           | App.tsx, pages, components                                                                    |
| firebase             | ^12.10.0 | Firebase JS SDK             | Auth, Firestore, Analytics                                | services/firebase.ts, contexts/AuthContext.tsx, services/api.ts, contexts/ShipmentContext.tsx |
| react-firebase-hooks | ^5.1.1   | React hooks for Firebase    | (available but custom hooks used instead)                 | (installed but not directly used)                                                             |
| tailwindcss          | ^4.2.1   | Utility-first CSS framework | All styling via utility classes                           | All components, globals.css                                                                   |
| @tailwindcss/postcss | ^4.2.1   | Tailwind PostCSS plugin     | Processes Tailwind directives                             | postcss.config.js                                                                             |
| framer-motion        | ^12.35.2 | Animation library           | Page transitions, component animations, AnimatePresence   | Most components                                                                               |
| recharts             | ^3.8.0   | React charting library      | Risk distribution, alert trends, delay probability charts | Charts/ components, Analytics page                                                            |
| leaflet              | ^1.9.4   | Interactive maps            | Live tracking map                                         | MapView.tsx                                                                                   |
| react-leaflet        | ^5.0.0   | React wrapper for Leaflet   | (available but raw Leaflet API used)                      | (installed but MapView uses L directly)                                                       |
| lucide-react         | ^0.577.0 | Icon library                | All icons throughout the UI                               | Most components                                                                               |
| papaparse            | ^5.5.3   | CSV parser                  | CSV file validation                                       | utils/csvValidator.ts                                                                         |
| postcss              | ^8.5.8   | CSS transformation tool     | Processes PostCSS plugins                                 | postcss.config.js                                                                             |
| autoprefixer         | ^10.4.27 | CSS vendor prefixing        | Adds browser prefixes                                     | (available via PostCSS)                                                                       |
| react-is             | ^19.2.4  | React type checking         | (peer dependency)                                         | (not directly imported)                                                                       |
| @types/leaflet       | ^1.9.21  | Leaflet TypeScript types    | Type safety for Leaflet API                               | MapView.tsx                                                                                   |
| @types/papaparse     | ^5.5.2   | PapaParse TypeScript types  | Type safety for CSV parsing                               | csvValidator.ts                                                                               |

### 7.3 Frontend Dev Dependencies

| Name                        | Version  | Description                 | Role in Project                                   |
| --------------------------- | -------- | --------------------------- | ------------------------------------------------- |
| vite                        | ^7.3.1   | Build tool / dev server     | Bundles and serves the application                |
| @vitejs/plugin-react        | ^5.1.1   | React support for Vite      | JSX transform, fast refresh                       |
| typescript                  | ~5.9.3   | TypeScript compiler         | Type checking and compilation                     |
| typescript-eslint           | ^8.48.0  | TS ESLint parser/plugin     | TypeScript-aware linting                          |
| eslint                      | ^9.39.1  | JavaScript linter           | Code quality enforcement                          |
| eslint-plugin-react-hooks   | ^7.0.1   | React Hooks lint rules      | Ensures hooks rules compliance                    |
| eslint-plugin-react-refresh | ^0.4.24  | React Refresh lint rules    | Ensures HMR compatibility                         |
| @eslint/js                  | ^9.39.1  | ESLint JS recommended rules | Base linting rules                                |
| globals                     | ^16.5.0  | Global variable definitions | Browser globals for ESLint                        |
| vitest                      | ^4.1.0   | Test framework              | Unit and component testing                        |
| @vitest/ui                  | ^4.1.0   | Vitest web UI               | Visual test results interface                     |
| jsdom                       | ^23.0.1  | DOM implementation          | Browser environment for tests                     |
| @testing-library/react      | ^14.1.2  | React testing utilities     | Component rendering and querying                  |
| @testing-library/jest-dom   | ^6.1.5   | DOM matchers                | Extended DOM assertions (toBeInTheDocument, etc.) |
| @testing-library/user-event | ^14.5.1  | User interaction simulation | Click, type, etc. in tests                        |
| @types/react                | ^19.2.7  | React TypeScript types      | Type safety for React                             |
| @types/react-dom            | ^19.2.3  | ReactDOM TypeScript types   | Type safety for ReactDOM                          |
| @types/node                 | ^24.10.1 | Node.js TypeScript types    | Type safety for Node APIs                         |

---

## 8. Environment Variables & Configuration

### 8.1 Backend Environment Variables

| Variable                        | Purpose                      | Default                                  | Used In                                 |
| ------------------------------- | ---------------------------- | ---------------------------------------- | --------------------------------------- |
| `DATABASE_URL`                  | MongoDB connection string    | (none)                                   | .env.example (not used in current code) |
| `DATABASE_NAME`                 | MongoDB database name        | `ship_risk_ai`                           | .env.example                            |
| `FIREBASE_API_KEY`              | Firebase Web API key         | (none)                                   | .env.example                            |
| `FIREBASE_AUTH_DOMAIN`          | Firebase Auth domain         | (none)                                   | .env.example                            |
| `FIREBASE_PROJECT_ID`           | Firebase project ID          | (none)                                   | .env.example                            |
| `FIREBASE_STORAGE_BUCKET`       | Firebase storage bucket      | (none)                                   | .env.example                            |
| `FIREBASE_MESSAGING_SENDER_ID`  | Firebase messaging sender    | (none)                                   | .env.example                            |
| `FIREBASE_APP_ID`               | Firebase app ID              | (none)                                   | .env.example                            |
| `FIREBASE_DATABASE_URL`         | Firebase Realtime DB URL     | (none)                                   | .env.example                            |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account key  | `./serviceAccountKey.json`               | firebase_uploader.py                    |
| `API_HOST`                      | API server bind host         | `0.0.0.0`                                | api_server.py, docker-compose.yml       |
| `API_PORT`                      | API server port              | `8000`                                   | api_server.py, docker-compose.yml       |
| `API_WORKERS`                   | Gunicorn worker count        | `4`                                      | docker-compose.yml                      |
| `MODEL_PATH`                    | Path to trained model        | `./artifacts/best_model.pkl`             | .env.example                            |
| `SCALER_PATH`                   | Path to scaler artifact      | `./artifacts/scaler.pkl`                 | .env.example                            |
| `LABEL_ENCODERS_PATH`           | Path to encoders artifact    | `./artifacts/label_encoders.pkl`         | .env.example                            |
| `DATA_PATH`                     | Data directory               | `./data`                                 | .env.example                            |
| `PROCESSED_DATA_PATH`           | Processed data path          | `./artifacts/processed_data.csv`         | .env.example                            |
| `LOG_LEVEL`                     | Logging level                | `INFO`                                   | .env.example, docker-compose.yml        |
| `LOG_FORMAT`                    | Logging format               | `json`                                   | .env.example                            |
| `ENVIRONMENT`                   | Runtime environment          | `development`                            | .env.example, docker-compose.yml        |
| `CORS_ORIGINS`                  | Allowed CORS origins         | `http://localhost:5173,...`              | .env.example                            |
| `SECRET_KEY`                    | Application secret key       | (none)                                   | .env.example                            |
| `JWT_SECRET`                    | JWT signing secret           | (none)                                   | .env.example                            |
| `JWT_ALGORITHM`                 | JWT algorithm                | `HS256`                                  | .env.example                            |
| `JWT_EXPIRATION_HOURS`          | JWT token lifetime           | `24`                                     | .env.example                            |
| `OPEN_METEO_API_URL`            | Open-Meteo API endpoint      | `https://api.open-meteo.com/v1/forecast` | services/weather_service.py             |
| `OPENROUTESERVICE_API_KEY`      | ORS API key (free tier)      | (none)                                   | services/route_service.py               |
| `OPENSKY_API_URL`               | OpenSky Network API endpoint | `https://opensky-network.org/api`        | services/tracking_service.py            |
| `GEMINI_API_KEY`                | Google Gemini API key        | (none)                                   | services/ai_service.py                  |
| `GEMINI_MODEL`                  | Gemini model name            | `gemini-2.0-flash`                       | services/ai_service.py                  |
| `OLLAMA_BASE_URL`               | Ollama local LLM URL         | `http://localhost:11434`                 | .env.example (deprecated)               |
| `OLLAMA_MODEL`                  | Ollama model name            | `mistral:latest`                         | .env.example (deprecated)               |

### 8.2 Frontend Environment Variables

| Variable                            | Purpose                         | Default                 | Used In                                                    |
| ----------------------------------- | ------------------------------- | ----------------------- | ---------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase Web API key            | (none)                  | services/firebase.ts                                       |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase Auth domain            | (none)                  | services/firebase.ts                                       |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID             | (none)                  | services/firebase.ts                                       |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket         | (none)                  | services/firebase.ts                                       |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender       | (none)                  | services/firebase.ts                                       |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID                 | (none)                  | services/firebase.ts                                       |
| `VITE_API_BASE_URL`                 | Backend API base URL            | `http://localhost:8000` | utils/constants.ts, services/api.ts, services/aiService.ts |
| `VITE_GEMINI_API_KEY`               | Google Gemini API key (browser) | (none)                  | services/aiService.ts                                      |

---

## 9. Database Schema & Models

### 9.1 Firebase Firestore Collections

The project uses Firebase Firestore as its primary database. There are no traditional SQL migrations — Firestore is schemaless. The structure is defined by the data uploaded from the ML pipeline.

#### Collection: `shipments`

**Document ID:** `shipment_id` (e.g., "SHP100000")

| Field                       | Type   | Description                                                             |
| --------------------------- | ------ | ----------------------------------------------------------------------- |
| `shipment_id`               | string | Unique shipment identifier                                              |
| `origin`                    | string | Origin city                                                             |
| `destination`               | string | Destination city                                                        |
| `carrier`                   | string | Shipping carrier name                                                   |
| `transport_mode`            | string | Air / Sea / Road / Rail                                                 |
| `shipment_date`             | string | Date shipped (YYYY-MM-DD)                                               |
| `planned_eta`               | string | Planned ETA (YYYY-MM-DD)                                                |
| `planned_transit_days`      | number | Planned transit duration (days)                                         |
| `days_in_transit`           | number | Current days in transit                                                 |
| `shipment_status`           | string | In Transit / Customs Hold / Out for Delivery / Delayed / At Port        |
| `package_weight_kg`         | number | Package weight in kg                                                    |
| `num_stops`                 | number | Number of intermediate stops                                            |
| `customs_clearance_flag`    | number | 0 or 1 (customs required)                                               |
| `weather_condition`         | string | Clear / Rain / Heavy Rain / Storm / Fog / Snow / Blizzard               |
| `weather_severity_score`    | number | 0-10 scale                                                              |
| `traffic_congestion_level`  | number | 1-10 scale                                                              |
| `port_congestion_score`     | number | 1-10 scale                                                              |
| `disruption_type`           | string | None / Port Strike / Traffic Jam / Natural Disaster / Equipment Failure |
| `disruption_impact_score`   | number | 0-10 scale                                                              |
| `carrier_reliability_score` | number | 0-1 scale                                                               |
| `historical_delay_rate`     | number | 0-1 scale                                                               |
| `route_risk_score`          | number | 0-1 scale                                                               |
| `delay_probability`         | number | 0-1 (ML-predicted)                                                      |
| `is_delayed`                | number | 0 or 1                                                                  |
| `actual_delay_hours`        | number | Hours of actual delay                                                   |

#### Collection: `alerts`

**Document ID:** `shipment_id`

| Field                | Type          | Description                           |
| -------------------- | ------------- | ------------------------------------- |
| `shipment_id`        | string        | Reference to shipment                 |
| `risk_tier`          | string        | LOW / MEDIUM / HIGH / CRITICAL        |
| `delay_probability`  | number        | 0-1 scale                             |
| `eta`                | string        | Planned ETA                           |
| `hours_to_sla`       | number        | Hours remaining to SLA breach         |
| `origin`             | string        | Origin city                           |
| `destination`        | string        | Destination city                      |
| `carrier`            | string        | Carrier name                          |
| `transport_mode`     | string        | Transport mode                        |
| `top_risk_factors`   | array<string> | Top 3 risk factor descriptions        |
| `action_required`    | string        | Recommended action text               |
| `alert_generated_at` | string        | Timestamp of alert generation         |
| `alert_type`         | string        | IMMEDIATE / 48H_WARNING / 72H_WARNING |

#### Collection: `recommendations`

**Document ID:** `shipment_id`

| Field                   | Type          | Description                             |
| ----------------------- | ------------- | --------------------------------------- |
| `shipment_id`           | string        | Reference to shipment                   |
| `risk_tier`             | string        | Risk tier                               |
| `delay_probability`     | number        | Delay probability                       |
| `primary_action`        | string        | Recommended action label                |
| `primary_description`   | string        | Action description                      |
| `fallback_action`       | string        | Alternative action                      |
| `cost_impact`           | string        | Cost level (None / Low / Medium / High) |
| `estimated_time_saving` | string        | Time saving estimate                    |
| `sla_impact`            | string        | SLA impact level                        |
| `confidence`            | string        | Low / Medium / High                     |
| `reasoning`             | array<string> | Reasoning explanations                  |

#### Collection: `metrics` → Document: `summary`

| Field                | Type   | Description                   |
| -------------------- | ------ | ----------------------------- |
| `total_shipments`    | number | Total shipment count          |
| `critical_alerts`    | number | Count of CRITICAL tier alerts |
| `high_alerts`        | number | Count of HIGH tier alerts     |
| `medium_alerts`      | number | Count of MEDIUM tier alerts   |
| `low_alerts`         | number | Count of LOW tier alerts      |
| `average_risk_score` | number | Mean delay probability        |
| `shipments_at_risk`  | number | Count with probability ≥ 0.5  |

#### Collection: `users`

**Document ID:** Firebase Auth UID

| Field       | Type   | Description       |
| ----------- | ------ | ----------------- |
| `uid`       | string | Firebase Auth UID |
| `email`     | string | User email        |
| `userRole`  | string | "admin" or "user" |
| `createdAt` | string | ISO timestamp     |

### 9.2 CSV Data Store (Local Fallback)

When Firestore is not configured, the API server reads from CSV files:

- `data/shipments_raw.csv` — Raw training data (6000 rows)
- `data/live_shipments.csv` — Live scored shipments (500 rows)
- `outputs/alerts.csv` — Generated alerts
- `outputs/recommendations.csv` — Generated recommendations

### 9.3 ML Artifact Files (.pkl)

- `artifacts/best_model.pkl` — Serialized Gradient Boosting classifier
- `artifacts/scaler.pkl` — Fitted MinMaxScaler
- `artifacts/label_encoders.pkl` — Dict of fitted LabelEncoders
- `artifacts/feature_cols.pkl` — List of feature column names

---

## 10. Authentication & Authorization Flow

### 10.1 How Users Authenticate

The project uses **Firebase Authentication** with two methods:

1. **Email/Password Authentication:**
   - User signs up at `/signup` with email, password, and role selection (User/Admin)
   - `createUserWithEmailAndPassword()` creates the Firebase Auth account
   - A Firestore document is created in `users/{uid}` with role information
   - User logs in at `/login` with email/password
   - `signInWithEmailAndPassword()` authenticates and triggers `onAuthStateChanged`

2. **Demo Login (No Firebase Required):**
   - User clicks "Continue as Demo Admin" or "Continue as Demo User"
   - A mock user object is created in React state with `uid: "demo-user-{timestamp}"`
   - No Firebase calls are made — works even without Firebase configured

### 10.2 Token/Session Management

- Firebase handles session persistence automatically via `onAuthStateChanged` listener
- The auth state persists across page refreshes (Firebase uses IndexedDB by default)
- On logout, `signOut(auth)` clears the session (for real users), or state is simply cleared (demo users)

### 10.3 Role-Based Access Control

- Two roles: `admin` and `user`
- Role is stored in Firestore `users/{uid}.userRole`
- `AuthContext` fetches the role on login and stores it in `userRole` state
- Currently, both roles have access to all features — the role is displayed in the Header UI
- **Note:** No server-side role enforcement exists on API endpoints

### 10.4 Protected Routes

- `ProtectedRoute` component wraps all dashboard routes
- Checks `AuthContext.user` — if null, redirects to `/`
- While loading auth state, shows a spinner
- Public routes (`/`, `/login`, `/signup`) are accessible without auth

### 10.5 Password Reset

- `ForgotPasswordModal` calls `sendPasswordResetEmail(auth, email)`
- Handles Firebase error codes: `auth/user-not-found`, `auth/invalid-email`, `auth/too-many-requests`

---

## 11. Error Handling Patterns

### 11.1 Frontend Error Handling

**Global Error Boundary:**

- `ErrorBoundary` class component wraps the entire app
- Catches rendering errors via `getDerivedStateFromError` and `componentDidCatch`
- Shows a friendly error page with "Try Again" and "Go Home" buttons
- Displays error message only in development mode

**Context-Level Error Handling:**

- `ShipmentContext` catches Firestore listener errors and falls back to API
- `AuthContext` catches Firebase auth errors and sets an `error` state
- Both expose `error` string to consuming components

**API Error Handling:**

- `ApiService` wraps all Firestore/API calls in try/catch blocks
- Returns mock data on failure (ensures UI always renders something)
- `aiService.ts` implements a 3-tier fallback (backend → Gemini → rule-based)
- Network requests use `AbortController` with 5-second timeouts

**Component-Level:**

- Loading states show skeleton placeholders (pulsing animations)
- Error states show contextual error messages
- Toast notifications for user-facing success/error messages via `NotificationContext`

### 11.2 Backend Error Handling

**FastAPI Exception Handling:**

- All endpoint functions wrap logic in try/except blocks
- Raise `HTTPException` with appropriate status codes (400, 404, 409, 500)
- Re-raise `HTTPException` instances to avoid wrapping them

**Pipeline Error Handling:**

- `main_pipeline.py` wraps Firebase upload in try/except, prints warning on failure
- Individual pipeline stages print errors but don't halt execution
- `firebase_uploader.py` uses batch writes with 450-per-batch commits to stay under Firestore's 500 limit

**Service Error Handling:**

- All external API calls (Gemini, OpenSky, Open-Meteo, ORS) use try/except and return `None` or empty lists on failure
- Weather service uses in-memory cache to reduce API failures
- `api_server.py` returns fallback responses for weather errors

### 11.3 Logging Strategy

- Backend uses Python `logging` module with a logger named `"ship-risk-ai"`
- Pipeline functions print status with `[ModuleName]` prefixes and emoji indicators
- Frontend uses `console.error` for critical errors and `console.warn` for non-critical failures
- No centralized logging service is configured

---

## 12. Testing

### 12.1 Test Framework

- **Framework:** Vitest 4.1.0
- **Environment:** jsdom (browser simulation)
- **Assertion library:** Vitest built-in (`expect`) + `@testing-library/jest-dom` matchers
- **Component testing:** `@testing-library/react` for rendering and querying
- **User simulation:** `@testing-library/user-event`
- **Coverage:** V8 provider, reports in text/json/html formats

### 12.2 Test Setup

`vitest.setup.ts`:

- Imports `@testing-library/jest-dom` for DOM matchers
- Runs `cleanup()` after each test
- Mocks `./services/firebase` (auth, db, analytics as null)
- Sets mock environment variables for Firebase

### 12.3 Test Files

| File                                | What It Tests                                                                  | Test Count |
| ----------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| `utils/formatters.test.ts`          | `formatNumber`, `formatPercentage`, `formatDate`, `formatHours` functions      | 10 tests   |
| `components/Risk/RiskTier.test.tsx` | `RiskTier` component rendering for all tier levels, probability display toggle | 5 tests    |
| `services/exportService.test.ts`    | `exportAlertsAsCSV` (empty/non-empty), `exportAlertsToPDF` HTML generation     | 3 tests    |

### 12.4 How to Run Tests

```bash
cd ship-risk-ai

# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run coverage
```

### 12.5 Coverage

Coverage configuration excludes `node_modules/` and `vitest.setup.ts`. Reports are generated in text, JSON, and HTML formats. Exact coverage numbers depend on the current test suite.

---

_End of documentation. This file covers every file, function, API endpoint, data model, and workflow in the Ship Risk AI project._
