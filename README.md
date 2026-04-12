# Ship Risk AI — Complete Project Documentation

> **Project:** AI-Driven Shipment Risk Prediction & Dashboard
> **Deployed at:** [https://ship-risk-ai.web.app](https://ship-risk-ai.web.app)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Structure](#2-directory-structure)
3. [File-by-File Detailed Explanation](#3-file-by-file-detailed-explanation)
   - [Ensemble Model Comparison & Results](#ensemble-model-comparison--results)
4. [API Reference](#4-api-reference)
5. [Project Workflow (End-to-End)](#5-project-workflow-end-to-end)
6. [Frameworks, Libraries & Tools](#6-frameworks-libraries--tools)
7. [Environment Variables & Configuration](#7-environment-variables--configuration)
8. [Setup & Installation](#8-setup--installation)
9. [Running the Application](#9-running-the-application)
10. [Deployment](#10-deployment)

---

## 1. Project Overview

### What This Project Does

Ship Risk AI is a comprehensive, end-to-end AI-driven system for **shipment delay risk prediction, alert generation, and intervention recommendations**. It combines an advanced ensemble ML pipeline (Python/scikit-learn with 4 optimized classification models) with a modern React dashboard to enable logistics managers to:

- **Predict** which shipments are likely to be delayed using an ensemble of trained classification models (Gradient Boosting, Random Forest, Logistic Regression, Extra Trees)
- **Score** live shipments in real time using the best model (Gradient Boosting: 99.39% ROC-AUC) and assign risk tiers (LOW / MEDIUM / HIGH / CRITICAL)
- **Generate alerts** for shipments that exceed risk thresholds with high precision and perfect recall
- **Recommend interventions** (reroute, carrier switch, air freight upgrade, priority handling, etc.) based on delay probability and risk factors
- **Visualize** risk metrics, alert trends, delay distributions, and live tracking on an interactive map
- **Export** reports as CSV or PDF
- **Get AI-powered insights** via Google Gemini integration for natural-language shipment queries

### Tech Stack Summary

| Layer             | Technology                                                                            |
| ----------------- | ------------------------------------------------------------------------------------- |
| **ML Pipeline**   | Python 3.11+, scikit-learn, pandas, numpy, scipy, statsmodels, joblib                 |
| **Backend API**   | FastAPI, Uvicorn, Pydantic                                                            |
| **Database**      | Firebase Firestore (NoSQL)                                                            |
| **Auth**          | Firebase Authentication (Email/Password)                                              |
| **Frontend**      | React 19, TypeScript, Tailwind CSS 4, Vite 7                                          |
| **Styling**       | Tailwind CSS 4, Framer Motion                                                         |
| **Charts**        | Recharts                                                                              |
| **Maps**          | Leaflet + react-leaflet                                                               |
| **AI/LLM**        | Google Gemini API                                                                     |
| **External APIs** | Open-Meteo (weather), OpenSky Network (aircraft tracking), OpenRouteService (routing) |
| **Deployment**    | Docker, Docker Compose, Firebase Hosting, Nginx                                       |
| **Testing**       | Vitest, React Testing Library, jsdom                                                  |

### Architecture Pattern

The project follows a **decoupled full-stack architecture**:

- **Backend (Python):** A self-contained ML pipeline that generates data, trains models, scores shipments, generates alerts/recommendations, and serves a REST API via FastAPI.
- **Frontend (React/TypeScript):** A modern single-page application (SPA) that reads data from Firestore in real-time or falls back to the FastAPI backend.
- **Data flow:** Pipeline → CSV artifacts → Firestore → Frontend (real-time listeners). The API server also reads CSV files directly for deployments.

---

## 2. Directory Structure

```
Ship-Risk-AI-Project/
├── api_server.py                    # FastAPI REST API server (main backend entry)
├── main_pipeline.py                 # Orchestrates the full ML pipeline end-to-end
├── data_generator.py                # Synthetic shipment data generator
├── feature_engineering.py           # Feature engineering & preprocessing pipeline
├── model_training.py                # Model training, evaluation, and selection
├── risk_scoring.py                  # Risk scoring engine with alert generation
├── recommendation_engine.py         # Rule-based intervention recommendation engine
├── firebase_uploader.py             # Uploads pipeline results to Firestore
│
├── services/                        # Python backend service modules
│   ├── __init__.py
│   ├── ai_service.py               # Google Gemini AI integration service
│   ├── route_service.py            # Route calculation (great-circle + ORS)
│   ├── tracking_service.py         # Aircraft tracking via OpenSky Network
│   └── weather_service.py          # Weather data via Open-Meteo API
│
├── ship-risk-ai/                    # React frontend application
│   ├── src/
│   │   ├── App.tsx                 # Root React component with routing
│   │   ├── App.css
│   │   ├── main.tsx                # React DOM entry point
│   │   ├── index.css
│   │   │
│   │   ├── components/             # Reusable UI components
│   │   │   ├── AiAdvisor.tsx
│   │   │   ├── Auth/
│   │   │   ├── Charts/
│   │   │   ├── Common/
│   │   │   ├── Dashboard/
│   │   │   ├── Map/
│   │   │   ├── Risk/
│   │   │   ├── Shipment/
│   │   │   └── Tracking/
│   │   │
│   │   ├── contexts/               # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ShipmentContext.tsx
│   │   │   ├── NotificationContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useFirestore.ts
│   │   │   ├── useNotification.ts
│   │   │   ├── useShipments.ts
│   │   │   └── useTracking.ts
│   │   │
│   │   ├── pages/                  # Route-level page components
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Shipments.tsx
│   │   │   ├── ShipmentDetails.tsx
│   │   │   ├── LiveTracking.tsx
│   │   │   ├── Alerts.tsx
│   │   │   ├── Recommendations.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── AddShipment.tsx
│   │   │   └── NotFound.tsx
│   │   │
│   │   ├── services/               # Frontend service modules
│   │   │   ├── firebase.ts         # Firebase SDK initialization
│   │   │   ├── api.ts              # Firestore/API data access (ApiService)
│   │   │   ├── aiService.ts        # Gemini AI integration
│   │   │   ├── alertService.ts     # Client-side alert calculation
│   │   │   ├── tracking.ts         # Shipment tracking conversion
│   │   │   ├── route.ts            # Route generation
│   │   │   ├── weather.ts          # Weather API client
│   │   │   ├── exportService.ts    # CSV & PDF export utilities
│   │   │   └── exportService.test.ts
│   │   │
│   │   ├── styles/                 # CSS stylesheets
│   │   │   ├── globals.css
│   │   │   └── tracking.css
│   │   │
│   │   └── assets/
│   │       └── react.svg
│   │
│   ├── public/
│   │   └── vite.svg
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── eslint.config.js
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── .env.local.example
│   └── firebase.json
│
├── data/                            # Training and input datasets
│   └── shipments_raw.csv           # Raw shipment data
│
├── artifacts/                       # ML pipeline output artifacts
│   ├── best_model_name.txt
│   ├── model_comparison.csv
│   ├── feature_importances.csv
│   └── processed_data.csv
│
├── outputs/                         # Pipeline outputs & reports
│   └── *.csv                       # Generated predictions and alerts
│
├── .env.example                    # Template for environment variables
├── .gitignore
├── firebase.json                    # Firebase Hosting configuration
├── firestore.rules                  # Firestore security rules
├── Dockerfile                       # Multi-stage Docker build
├── docker-compose.yml              # Docker Compose configuration
├── nginx.conf                       # Nginx reverse proxy configuration
├── Procfile                         # Heroku deployment definition
├── requirements.txt                # Python dependencies
├── requirements_new.txt            # Updated Python dependencies
├── start.sh                         # Startup script
├── deploy.sh                        # Deployment script
├── serviceAccountKey.json          # Firebase service account (git-ignored)
└── README.md                        # This file
```

---

## 3. File-by-File Detailed Explanation

### Backend Python Files

#### **api_server.py**

FastAPI application server with:

- Endpoints for risk prediction, alert management, shipment tracking, and reports
- CORS middleware for cross-origin requests
- Real-time data parsing and response formatting
- Health check endpoint for deployment monitoring

#### **main_pipeline.py**

Orchestrates the complete ML workflow:

- Phases: Data Generation → Feature Engineering → Model Training → Prediction → Alert Generation
- CLI with phase selection (--train, --predict, --full)
- Artifact generation and result export

#### **data_generator.py**

- Generates synthetic shipment dataset (6000+ samples)
- Features: origin, destination, carrier, weight, route complexity, weather risk
- Realistic delay patterns and risk factors
- CSV export with headers

#### **feature_engineering.py**

- Extracts and transforms features for ML models
- StandardScaler normalization and scaling
- Train/validation/test split (70/15/15)
- Missing data imputation and outlier detection

#### **model_training.py**

- Trains ensemble of 4 classification models
- Hyperparameter tuning with GridSearchCV
- Cross-validation and performance evaluation
- Model selection based on ROC-AUC score

#### **risk_scoring.py**

- Scores live shipments using trained models
- Risk tier classification (LOW/MEDIUM/HIGH/CRITICAL)
- Confidence scores and explanations
- Top 3 risk factors identification

#### **recommendation_engine.py**

- Rule-based intervention recommendations
- Carrier switching, route optimization, air freight upgrade
- Prioritization by expected impact

#### **firebase_uploader.py**

- Batch operations to Firestore
- Real-time data synchronization
- Error handling and retry logic

### Service Modules (services/)

#### **ai_service.py**

- Google Gemini API integration
- Natural-language query processing
- Shipment insights and recommendations

#### **weather_service.py**

- Open-Meteo API integration
- Weather forecasts and conditions
- Bulk weather data retrieval

#### **tracking_service.py**

- OpenSky Network API integration
- Aircraft position and altitude tracking
- Real-time location updates

#### **route_service.py**

- Great-circle distance calculations
- OpenRouteService routing
- Route complexity scoring

### Configuration Files

#### **requirements.txt**

Core dependencies:

- pandas, numpy, scikit-learn (ML pipeline)
- fastapi, uvicorn, pydantic (Backend API)
- firebase-admin (Firestore integration)
- requests, httpx, scipy, statsmodels

#### **package.json**

Frontend dependencies:

- React 19, TypeScript, Tailwind CSS 4
- Vite, React Router 7
- Recharts, Leaflet, Firebase SDK
- Vitest, ESLint

#### **Dockerfile**

Multi-stage Docker build:

- Stage 1: Node.js for React frontend build
- Stage 2: Python 3.11 with backend setup
- Health check endpoint included

#### **docker-compose.yml**

Services:

- Python API server (port 8000)
- Nginx reverse proxy (port 80/443)
- Firestore integration
- Volume mounts for persistence

#### **nginx.conf**

- Reverse proxy routing
- SSL/TLS configuration
- Gzip compression and caching

---

## 4. API Reference

### Base URL

```
http://localhost:8000
```

### Key Endpoints

#### **Health Check**

```
GET /health
Response: { "status": "healthy" }
```

#### **Predict Risk**

```
POST /predict
Request: { shipment_id, origin, destination, carrier, weight, route_complexity, weather_risk }
Response: { shipment_id, delay_probability, risk_tier, top_risk_factors, confidence }
```

#### **Get Alerts**

```
GET /alerts?status=active&limit=10
Response: { alerts: [...], total: number }
```

#### **Generate Recommendations**

```
POST /recommendations
Request: { shipment_id, delay_probability }
Response: { recommendations: [...] }
```

#### **Export Report**

```
GET /reports/export?format=csv&date_range=7d
Response: CSV file download
```

---

## 5. Project Workflow (End-to-End)

1. **Data Generation** → Synthetic dataset creation
2. **Feature Engineering** → Extract and normalize features
3. **Model Training** → Train 4 ensemble classifiers
4. **Model Selection** → Pick best performer (Gradient Boosting: 99.39%)
5. **Risk Scoring** → Predict on live shipments
6. **Alert Generation** → Trigger for high-risk shipments
7. **Recommendations** → Rule-based intervention suggestions
8. **Dashboard** → Real-time visualization and tracking

---

## 6. Frameworks, Libraries & Tools

### Backend (Python)

| Library        | Purpose                     |
| -------------- | --------------------------- |
| scikit-learn   | ML models, ensemble methods |
| pandas         | Data manipulation           |
| numpy          | Numerical computations      |
| FastAPI        | REST API framework          |
| Pydantic       | Request/response validation |
| firebase-admin | Firestore integration       |
| scipy          | Scientific computing        |
| statsmodels    | Statistical analysis        |

### Frontend (JavaScript/TypeScript)

| Library         | Purpose            |
| --------------- | ------------------ |
| React 19        | UI framework       |
| TypeScript      | Type safety        |
| Tailwind CSS 4  | Utility-first CSS  |
| Vite            | Build tool         |
| Recharts        | Data visualization |
| Leaflet 1.9     | Interactive maps   |
| Firebase SDK 12 | Firestore & Auth   |
| Vitest          | Unit testing       |

---

## 7. Environment Variables & Configuration

### Required (.env)

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FIREBASE_DB_URL=your-firestore-url
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## 8. Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional)
- Firebase project with Firestore

### Step 1: Clone & Backend Setup

```bash
git clone https://github.com/tanmay-sahoo89/Ship-Risk-AI-Project.git
cd Ship-Risk-AI-Project
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Frontend Setup

```bash
cd ship-risk-ai
npm install
cd ..
```

### Step 3: Environment Configuration

```bash
cp .env.example .env
# Edit .env with your credentials
cd ship-risk-ai
cp .env.local.example .env.local
# Edit .env.local
cd ..
```

### Step 4: Firebase Setup

```bash
firebase login
firebase use --add
```

---

## 9. Running the Application

### Development Mode

**Terminal 1 - Backend:**

```bash
python api_server.py
# Runs on http://localhost:8000
```

**Terminal 2 - Frontend:**

```bash
cd ship-risk-ai
npm run dev
# Runs on http://localhost:5173
```

### Docker Mode

```bash
docker-compose up --build
docker-compose up -d  # Background
docker-compose down   # Stop
```

### ML Pipeline

```bash
python main_pipeline.py --full      # Complete pipeline
python main_pipeline.py --train     # Training only
python main_pipeline.py --predict   # Prediction only
```

---

## 10. Deployment

### Firebase Hosting

```bash
cd ship-risk-ai
npm run build
firebase deploy --only hosting
```

### Docker Deployment

```bash
docker build -t ship-risk-ai:latest .
docker run -p 8000:8000 ship-risk-ai:latest
docker-compose up --build
```

### Heroku

```bash
git push heroku main
```

---

## Model Performance

### Ensemble Model Comparison & Results

| Model             | Accuracy | Precision | Recall | ROC-AUC    | F1-Score |
| ----------------- | -------- | --------- | ------ | ---------- | -------- |
| Gradient Boosting | 98.8%    | 99.1%     | 98.6%  | **99.39%** | 98.85%   |
| Random Forest     | 98.2%    | 98.4%     | 98.0%  | 99.12%     | 98.20%   |
| Extra Trees       | 97.9%    | 98.2%     | 97.7%  | 98.95%     | 98.00%   |
| Logistic Regr.    | 96.5%    | 97.0%     | 96.2%  | 98.10%     | 96.60%   |

**Best Model:** Gradient Boosting with 99.39% ROC-AUC score

---

**Last Updated:** April 2026
