# Ship Risk AI - ML Pipeline & Dashboard

A comprehensive AI-driven system for shipment risk prediction, alert generation, and intervention recommendations. Combines advanced ML models with a modern React frontend for real-time logistics optimization.

## Project Overview

This project orchestrates an end-to-end ML pipeline for shipping logistics:

1. **Data Generation** → **Feature Engineering** → **Model Training** → **Risk Scoring** → **Recommendations** → **Firebase Upload** → **Real-time Dashboard**

## Currently Deployed at: [https://ship-risk-ai.web.app](https://ship-risk-ai.web.app)

## File Structure

```
ship-risk-ai/
├── api_server.py
├── main_pipeline.py
├── data_generator.py
├── feature_engineering.py
├── model_training.py
├── risk_scoring.py
├── recommendation_engine.py
├── firebase_uploader.py
├── requirements.txt
├── start.sh
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── Procfile
├── deploy.sh
├── serviceAccountKey.json
├── .gitignore
├── artifacts/
│   ├── best_model_name.txt
│   ├── feature_importances.csv
│   ├── model_comparison.csv
│   ├── processed_data.csv
│   ├── best_model.pkl
│   ├── scaler.pkl
│   └── label_encoders.pkl
├── data/
│   ├── live_shipments.csv
│   └── shipments_raw.csv
├── outputs/
│   ├── alerts.csv
│   └── recommendations.csv
├── services/
│   ├── __init__.py
│   ├── ai_service.py
│   ├── route_service.py
│   ├── tracking_service.py
│   └── weather_service.py
└── ship-risk-ai/
    ├── src/
    │   ├── components/
    │   │   ├── Auth/
    │   │   ├── Charts/
    │   │   ├── Common/
    │   │   ├── Dashboard/
    │   │   ├── Layout/
    │   │   ├── Map/
    │   │   ├── Risk/
    │   │   ├── Shipment/
    │   │   └── Tracking/
    │   ├── contexts/
    │   │   ├── AuthContext.tsx
    │   │   ├── NotificationContext.tsx
    │   │   ├── ShipmentContext.tsx
    │   │   └── ThemeContext.tsx
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   ├── useFirestore.ts
    │   │   ├── useNotification.ts
    │   │   ├── useShipments.ts
    │   │   └── useTracking.ts
    │   ├── services/
    │   │   ├── api.ts
    │   │   ├── firebase.ts
    │   │   ├── alertService.ts
    │   │   ├── exportService.ts
    │   │   ├── route.ts
    │   │   ├── tracking.ts
    │   │   └── weather.ts
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── Shipments.tsx
    │   │   ├── Alerts.tsx
    │   │   ├── Recommendations.tsx
    │   │   ├── Analytics.tsx
    │   │   ├── ShipmentDetails.tsx
    │   │   ├── AddShipment.tsx
    │   │   ├── LiveTracking.tsx
    │   │   ├── Login.tsx
    │   │   ├── Signup.tsx
    │   │   └── NotFound.tsx
    │   ├── types/
    │   │   ├── alert.ts
    │   │   ├── risk.ts
    │   │   ├── shipment.ts
    │   │   ├── tracking.ts
    │   │   └── user.ts
    │   ├── utils/
    │   │   ├── constants.ts
    │   │   ├── formatters.ts
    │   │   ├── helpers.ts
    │   │   └── riskCalculations.ts
    │   ├── styles/
    │   │   ├── globals.css
    │   │   ├── index.css
    │   │   └── tracking.css
    │   ├── assets/
    │   ├── App.tsx
    │   ├── App.css
    │   ├── index.css
    │   ├── main.tsx
    │   └── vitest.setup.ts
    ├── public/
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── eslint.config.js
    ├── firebase.json
    ├── package.json
    ├── vitest.config.ts
    └── README.md
```

## API Endpoints

- `GET /shipments` - List all shipments
- `GET /alerts` - Fetch risk alerts
- `GET /recommendations/{shipment_id}` - Get recommendations for a shipment
- `GET /metrics` - Dashboard metrics

## Technologies

**Backend:**

- Python 3.8+
- Scikit-learn, Pandas, NumPy
- Firebase Admin SDK
- FastAPI

**Frontend:**

- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Firebase SDK
