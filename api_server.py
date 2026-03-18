from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import os
import json
import logging
from datetime import datetime

from services.weather_service import get_weather, get_weather_bulk
from services.tracking_service import get_aircraft_position, get_all_aircraft_in_bounds
from services.route_service import get_route, get_route_ors
from services.ai_service import summarize_alert, rank_interventions, get_ai_status

logger = logging.getLogger("ship-risk-ai")

app = FastAPI(title="Ship Risk AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use relative paths for Windows compatibility
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(PROJECT_DIR, "data")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "outputs")
ARTIFACTS_DIR = os.path.join(PROJECT_DIR, "artifacts")

def parse_risk_factors(factors_str):
    """Parse string representation of list into actual list."""
    if pd.isna(factors_str) or factors_str is None:
        return []
    try:
        # Handle Python list string representation with single quotes
        import ast
        return ast.literal_eval(factors_str)
    except:
        return [str(factors_str)]

def parse_response_data(data):
    """Parse alert/shipment data and convert risk factors to proper format."""
    if isinstance(data, list):
        for item in data:
            if 'top_risk_factors' in item and isinstance(item['top_risk_factors'], str):
                item['top_risk_factors'] = parse_risk_factors(item['top_risk_factors'])
    elif isinstance(data, dict):
        if 'top_risk_factors' in data and isinstance(data['top_risk_factors'], str):
            data['top_risk_factors'] = parse_risk_factors(data['top_risk_factors'])
    return data

class InterventionRequest(BaseModel):
    shipment_id: str
    action: str

class RecommendationRequest(BaseModel):
    shipment_id: str

@app.get("/")
def read_root():
    return {
        "message": "Ship Risk AI API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/api/shipments")
def get_shipments(limit: int = 100, offset: int = 0):
    try:
        live_data_path = os.path.join(DATA_DIR, "live_shipments.csv")
        if not os.path.exists(live_data_path):
            raw_data_path = os.path.join(DATA_DIR, "shipments_raw.csv")
            if os.path.exists(raw_data_path):
                df = pd.read_csv(raw_data_path)
            else:
                return []
        else:
            df = pd.read_csv(live_data_path)

        df = df.iloc[offset:offset + limit]

        df = df.replace({np.nan: None})

        return df.to_dict('records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading shipments: {str(e)}")

@app.post("/api/shipments")
def create_shipment(shipment: Dict[str, Any]):
    """Add a new shipment to the CSV data store."""
    try:
        if not shipment.get("shipment_id"):
            raise HTTPException(status_code=400, detail="shipment_id is required")

        live_data_path = os.path.join(DATA_DIR, "live_shipments.csv")
        raw_data_path = os.path.join(DATA_DIR, "shipments_raw.csv")

        # Load existing data or create empty DataFrame
        if os.path.exists(live_data_path):
            df = pd.read_csv(live_data_path)
        elif os.path.exists(raw_data_path):
            df = pd.read_csv(raw_data_path)
        else:
            df = pd.DataFrame()

        # Check for duplicate ID
        if not df.empty and shipment["shipment_id"] in df["shipment_id"].values:
            raise HTTPException(status_code=409, detail=f"Shipment {shipment['shipment_id']} already exists")

        # Append new row
        new_row = pd.DataFrame([shipment])
        df = pd.concat([df, new_row], ignore_index=True)

        # Write back to the live file
        os.makedirs(DATA_DIR, exist_ok=True)
        df.to_csv(live_data_path, index=False)

        return {
            "success": True,
            "message": f"Shipment {shipment['shipment_id']} created successfully",
            "shipment_id": shipment["shipment_id"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating shipment: {str(e)}")


@app.get("/api/shipments/{shipment_id}")
def get_shipment(shipment_id: str):
    try:
        live_data_path = os.path.join(DATA_DIR, "live_shipments.csv")
        if os.path.exists(live_data_path):
            df = pd.read_csv(live_data_path)
        else:
            raw_data_path = os.path.join(DATA_DIR, "shipments_raw.csv")
            df = pd.read_csv(raw_data_path)

        shipment = df[df['shipment_id'] == shipment_id]
        if shipment.empty:
            raise HTTPException(status_code=404, detail="Shipment not found")

        shipment = shipment.replace({np.nan: None})
        return shipment.to_dict('records')[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading shipment: {str(e)}")

@app.get("/api/alerts")
def get_alerts(min_tier: str = "LOW"):
    try:
        alerts_path = os.path.join(OUTPUT_DIR, "alerts.csv")
        if not os.path.exists(alerts_path):
            return []

        df = pd.read_csv(alerts_path)

        tier_order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
        min_tier_value = tier_order.get(min_tier.upper(), 0)

        df['tier_value'] = df['risk_tier'].map(tier_order)
        df = df[df['tier_value'] >= min_tier_value]
        df = df.drop('tier_value', axis=1)

        df = df.replace({np.nan: None})

        alerts = df.to_dict('records')
        # Parse risk factors from string to list
        return parse_response_data(alerts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading alerts: {str(e)}")

@app.post("/api/recommendations")
def get_recommendations(request: RecommendationRequest):
    try:
        recommendations_path = os.path.join(OUTPUT_DIR, "recommendations.csv")
        if not os.path.exists(recommendations_path):
            return []

        df = pd.read_csv(recommendations_path)

        recs = df[df['shipment_id'] == request.shipment_id]

        if recs.empty:
            return []

        recs = recs.replace({np.nan: None})

        def parse_reasoning(reasoning_str):
            if pd.isna(reasoning_str) or reasoning_str is None:
                return []
            try:
                return json.loads(reasoning_str.replace("'", '"'))
            except:
                return [str(reasoning_str)]

        result = recs.to_dict('records')
        for rec in result:
            if 'reasoning' in rec:
                rec['reasoning'] = parse_reasoning(rec['reasoning'])

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading recommendations: {str(e)}")

@app.get("/api/analytics")
def get_analytics():
    try:
        live_data_path = os.path.join(DATA_DIR, "live_shipments.csv")
        alerts_path = os.path.join(OUTPUT_DIR, "alerts.csv")

        shipments_df = None
        if os.path.exists(live_data_path):
            shipments_df = pd.read_csv(live_data_path)
        elif os.path.exists(os.path.join(DATA_DIR, "shipments_raw.csv")):
            shipments_df = pd.read_csv(os.path.join(DATA_DIR, "shipments_raw.csv"))

        alerts_df = None
        if os.path.exists(alerts_path):
            alerts_df = pd.read_csv(alerts_path)

        total_shipments = len(shipments_df) if shipments_df is not None else 0

        if alerts_df is not None and not alerts_df.empty:
            critical_alerts = len(alerts_df[alerts_df['risk_tier'] == 'CRITICAL'])
            high_alerts = len(alerts_df[alerts_df['risk_tier'] == 'HIGH'])
            medium_alerts = len(alerts_df[alerts_df['risk_tier'] == 'MEDIUM'])
            low_alerts = len(alerts_df[alerts_df['risk_tier'] == 'LOW'])
        else:
            critical_alerts = high_alerts = medium_alerts = low_alerts = 0

        if shipments_df is not None and not shipments_df.empty:
            average_risk_score = float(shipments_df['delay_probability'].mean())
            shipments_at_risk = len(shipments_df[shipments_df['delay_probability'] >= 0.5])
        else:
            average_risk_score = 0.0
            shipments_at_risk = 0

        return {
            "total_shipments": total_shipments,
            "critical_alerts": critical_alerts,
            "high_alerts": high_alerts,
            "medium_alerts": medium_alerts,
            "low_alerts": low_alerts,
            "average_risk_score": average_risk_score,
            "shipments_at_risk": shipments_at_risk,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing analytics: {str(e)}")

@app.post("/api/interventions")
def execute_intervention(request: InterventionRequest):
    try:
        return {
            "success": True,
            "message": f"Intervention '{request.action}' scheduled for {request.shipment_id}",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing intervention: {str(e)}")

# ── Weather Endpoints ────────────────────────────────────────────────────────

@app.get("/api/weather/{latitude}/{longitude}")
async def get_location_weather(latitude: float, longitude: float):
    """Get current weather for a location (Open-Meteo, unlimited, no auth)."""
    try:
        data = await get_weather(latitude, longitude)
        return data
    except Exception as e:
        logger.warning(f"Weather API error: {e}")
        return {"error": str(e), "fallback": {"temperature": 20, "status": "unavailable"}}


class BulkWeatherRequest(BaseModel):
    locations: List[Dict[str, float]]


@app.post("/api/weather/bulk")
async def get_bulk_weather(request: BulkWeatherRequest):
    """Get weather for multiple locations in one request."""
    try:
        results = await get_weather_bulk(request.locations)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk weather error: {str(e)}")


# ── Tracking Endpoints ───────────────────────────────────────────────────────

@app.get("/api/track/aircraft/{icao24}")
async def track_aircraft(icao24: str):
    """Get aircraft position from OpenSky Network (free, no auth)."""
    result = await get_aircraft_position(icao24)
    if result is None:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    return result


@app.get("/api/track/aircraft")
async def track_aircraft_area(
    lat_min: float = -90, lat_max: float = 90,
    lng_min: float = -180, lng_max: float = 180
):
    """Get all aircraft in a bounding box."""
    aircraft = await get_all_aircraft_in_bounds(lat_min, lat_max, lng_min, lng_max)
    return {"count": len(aircraft), "aircraft": aircraft}


# ── Route Endpoints ──────────────────────────────────────────────────────────

@app.get("/api/route")
def get_route_endpoint(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float,
    transport_mode: str = "Sea"
):
    """Calculate route and ETA between two points."""
    return get_route(origin_lat, origin_lng, dest_lat, dest_lng, transport_mode)


@app.get("/api/route/ors")
async def get_ors_route(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float,
    profile: str = "driving-car"
):
    """Get route from OpenRouteService (requires free API key)."""
    result = await get_route_ors(origin_lat, origin_lng, dest_lat, dest_lng, profile)
    if result is None:
        return {"error": "OpenRouteService not configured. Set OPENROUTESERVICE_API_KEY env var."}
    return result


# ── Tracking Stats Endpoint ──────────────────────────────────────────────────

@app.get("/api/tracking/stats")
def get_tracking_stats():
    """Get live tracking statistics for dashboard."""
    try:
        live_data_path = os.path.join(DATA_DIR, "live_shipments.csv")
        alerts_path = os.path.join(OUTPUT_DIR, "alerts.csv")

        shipments_df = None
        if os.path.exists(live_data_path):
            shipments_df = pd.read_csv(live_data_path)
        elif os.path.exists(os.path.join(DATA_DIR, "shipments_raw.csv")):
            shipments_df = pd.read_csv(os.path.join(DATA_DIR, "shipments_raw.csv"))

        alerts_df = None
        if os.path.exists(alerts_path):
            alerts_df = pd.read_csv(alerts_path)

        total = len(shipments_df) if shipments_df is not None else 0

        # Count by transport mode
        mode_counts = {}
        if shipments_df is not None and 'transport_mode' in shipments_df.columns:
            mode_counts = shipments_df['transport_mode'].value_counts().to_dict()

        # Count by risk tier from alerts
        tier_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        if alerts_df is not None and not alerts_df.empty:
            for tier in tier_counts:
                tier_counts[tier] = int((alerts_df['risk_tier'] == tier).sum())

        avg_delay = 0.0
        if shipments_df is not None and 'delay_probability' in shipments_df.columns:
            avg_delay = float(shipments_df['delay_probability'].mean())

        return {
            "shipments_in_transit": total,
            "by_transport_mode": mode_counts,
            "by_risk_tier": tier_counts,
            "avg_delay_probability": round(avg_delay, 3),
            "critical_alerts": tier_counts.get("CRITICAL", 0),
            "high_alerts": tier_counts.get("HIGH", 0),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing tracking stats: {str(e)}")


# ── AI Endpoints ─────────────────────────────────────────────────────────────

class AlertSummaryRequest(BaseModel):
    shipment_id: str
    origin: str = ""
    destination: str = ""
    risk_tier: str = ""
    delay_probability: float = 0.0
    top_risk_factors: List[str] = []


class AISummaryRequest(BaseModel):
    shipment_id: str
    query: str = "Summarize this shipment status and risks"


@app.post("/api/ai/summarize-alert")
async def ai_summarize_alert(request: AlertSummaryRequest):
    """Generate AI summary of alert using Ollama (local LLM)."""
    summary = await summarize_alert(request.model_dump())
    return {"summary": summary}


@app.post("/api/ai/summary")
async def ai_shipment_summary(request: AISummaryRequest):
    """Generate AI summary for a shipment based on user query."""
    try:
        # Load shipment data
        live_data_path = os.path.join(DATA_DIR, "live_shipments.csv")
        raw_data_path = os.path.join(DATA_DIR, "shipments_raw.csv")

        shipment_data = None
        for path in [live_data_path, raw_data_path]:
            if os.path.exists(path):
                df = pd.read_csv(path)
                match = df[df['shipment_id'] == request.shipment_id]
                if not match.empty:
                    shipment_data = match.iloc[0].replace({np.nan: None}).to_dict()
                    break

        if not shipment_data:
            raise HTTPException(status_code=404, detail="Shipment not found")

        # Load alerts
        alerts_path = os.path.join(OUTPUT_DIR, "alerts.csv")
        alert_data = []
        if os.path.exists(alerts_path):
            alerts_df = pd.read_csv(alerts_path)
            alert_matches = alerts_df[alerts_df['shipment_id'] == request.shipment_id]
            if not alert_matches.empty:
                alert_data = alert_matches.replace({np.nan: None}).to_dict('records')

        # Load recommendations
        recs_path = os.path.join(OUTPUT_DIR, "recommendations.csv")
        rec_data = []
        if os.path.exists(recs_path):
            recs_df = pd.read_csv(recs_path)
            rec_matches = recs_df[recs_df['shipment_id'] == request.shipment_id]
            if not rec_matches.empty:
                rec_data = rec_matches.replace({np.nan: None}).to_dict('records')

        # Build context for AI
        context = (
            f"SHIPMENT DATA:\n"
            f"- ID: {shipment_data.get('shipment_id')}\n"
            f"- Carrier: {shipment_data.get('carrier')}\n"
            f"- Route: {shipment_data.get('origin')} → {shipment_data.get('destination')}\n"
            f"- Transport Mode: {shipment_data.get('transport_mode')}\n"
            f"- Status: {shipment_data.get('shipment_status', 'In Transit')}\n"
            f"- ETA: {shipment_data.get('planned_eta')}\n"
            f"- Progress: {shipment_data.get('days_in_transit', 0)}/{shipment_data.get('planned_transit_days', 0)} days\n"
            f"- Delay Probability: {shipment_data.get('delay_probability', 0)}\n"
            f"- Weather: {shipment_data.get('weather_condition')} (severity: {shipment_data.get('weather_severity_score', 0)})\n"
            f"- Disruption: {shipment_data.get('disruption_type')} (impact: {shipment_data.get('disruption_impact_score', 0)})\n\n"
        )

        if alert_data:
            context += f"ALERTS ({len(alert_data)}):\n"
            for a in alert_data[:3]:
                context += f"- {a.get('risk_tier')}: {a.get('top_risk_factors', '')}\n"
            context += "\n"

        if rec_data:
            context += f"RECOMMENDATIONS ({len(rec_data)}):\n"
            for r in rec_data[:3]:
                context += f"- {r.get('primary_action', '')}: cost={r.get('cost_impact', '')} saving={r.get('estimated_time_saving', '')}\n"
            context += "\n"

        context += f"USER QUESTION: {request.query}"

        prompt = (
            f"You are an expert logistics advisor for Ship Risk AI platform. "
            f"Provide clear, actionable insights about shipments. "
            f"Keep responses concise (2-4 sentences).\n\n{context}"
        )

        from services.ai_service import generate_text
        result = await generate_text(prompt, max_tokens=300)

        if result:
            return {"shipment_id": request.shipment_id, "summary": result.strip(), "source": "ai"}
        else:
            # Fallback: generate a rule-based summary
            delay_prob = shipment_data.get('delay_probability', 0) or 0
            risk_level = "CRITICAL" if delay_prob >= 0.9 else "HIGH" if delay_prob >= 0.6 else "MEDIUM" if delay_prob >= 0.3 else "LOW"
            progress = shipment_data.get('days_in_transit', 0) or 0
            total = shipment_data.get('planned_transit_days', 1) or 1
            pct = min(round(progress / total * 100), 100)

            fallback = (
                f"Shipment {request.shipment_id} from {shipment_data.get('origin')} to "
                f"{shipment_data.get('destination')} via {shipment_data.get('carrier')} "
                f"({shipment_data.get('transport_mode')}) is {pct}% through transit. "
                f"Risk level: {risk_level} with {delay_prob:.0%} delay probability. "
            )
            weather = shipment_data.get('weather_condition', 'Clear')
            if weather and weather != 'Clear':
                fallback += f"Weather conditions ({weather}) may impact delivery. "
            disruption = shipment_data.get('disruption_type', 'None')
            if disruption and disruption != 'None':
                fallback += f"Active disruption: {disruption}. "
            if rec_data:
                fallback += f"There are {len(rec_data)} recommended intervention(s) available."

            return {"shipment_id": request.shipment_id, "summary": fallback, "source": "fallback"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI summary failed: {str(e)}")


class RankInterventionsRequest(BaseModel):
    shipment_id: str
    recommendations: List[Dict[str, Any]]


@app.post("/api/ai/rank-interventions")
async def ai_rank_interventions(request: RankInterventionsRequest):
    """Re-rank interventions using AI model evaluation."""
    ranked = await rank_interventions(request.shipment_id, request.recommendations)
    return {"ranked_recommendations": ranked}


@app.get("/api/ai/status")
async def ai_status():
    """Check AI service availability."""
    return await get_ai_status()


# ── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    ai = await get_ai_status()
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "data_available": {
            "shipments": os.path.exists(os.path.join(DATA_DIR, "live_shipments.csv")) or
                        os.path.exists(os.path.join(DATA_DIR, "shipments_raw.csv")),
            "alerts": os.path.exists(os.path.join(OUTPUT_DIR, "alerts.csv")),
            "recommendations": os.path.exists(os.path.join(OUTPUT_DIR, "recommendations.csv"))
        },
        "services": {
            "weather": "Open-Meteo (free, unlimited)",
            "aircraft_tracking": "OpenSky Network (free, 400 req/hr)",
            "ai": ai,
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
