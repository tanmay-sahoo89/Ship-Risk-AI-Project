"""AI service using Google Gemini API (free tier).

Get your API key at: https://aistudio.google.com/apikey
Set env var: GEMINI_API_KEY=your_key_here
"""

import os
import httpx
from typing import Dict, Any, Optional, List

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


async def _gemini_available() -> bool:
    """Check if Gemini API key is configured."""
    return bool(GEMINI_API_KEY)


async def generate_text(prompt: str, max_tokens: int = 300) -> Optional[str]:
    """Generate text using Google Gemini API."""
    if not GEMINI_API_KEY:
        return None

    try:
        url = f"{GEMINI_BASE_URL}/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "maxOutputTokens": max_tokens,
                        "temperature": 0.7,
                    },
                },
            )
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
        return None
    except Exception as e:
        print(f"Gemini API error: {e}")
        return None


async def summarize_alert(alert: Dict[str, Any]) -> str:
    """Generate a concise AI summary of a risk alert."""
    prompt = (
        f"You are a logistics risk analyst. Summarize this shipment alert in 2 sentences "
        f"for a logistics manager.\n\n"
        f"Shipment: {alert.get('shipment_id', 'Unknown')}\n"
        f"Route: {alert.get('origin', '?')} → {alert.get('destination', '?')}\n"
        f"Risk Tier: {alert.get('risk_tier', '?')}\n"
        f"Delay Probability: {alert.get('delay_probability', 0):.0%}\n"
        f"Risk Factors: {', '.join(alert.get('top_risk_factors', []))}\n\n"
        f"Summary:"
    )

    result = await generate_text(prompt, max_tokens=100)
    if result:
        return result.strip()

    # Fallback: generate summary without AI
    risk_factors = alert.get("top_risk_factors", [])
    factor_text = risk_factors[0] if risk_factors else "multiple risk factors"
    return (
        f"Shipment {alert.get('shipment_id', 'Unknown')} on route "
        f"{alert.get('origin', '?')} → {alert.get('destination', '?')} "
        f"has a {alert.get('delay_probability', 0):.0%} delay probability "
        f"due to {factor_text}. "
        f"Risk tier: {alert.get('risk_tier', 'Unknown')}."
    )


async def rank_interventions(
    shipment_id: str, recommendations: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Re-rank interventions using AI evaluation."""
    if not recommendations:
        return recommendations

    rec_descriptions = "\n".join(
        f"- {r.get('primary_action', '?')}: {r.get('primary_description', '?')} "
        f"(cost: {r.get('cost_impact', '?')}, time saving: {r.get('estimated_time_saving', '?')})"
        for r in recommendations
    )

    prompt = (
        f"You are a logistics optimization expert. Rank these interventions for shipment "
        f"{shipment_id} from most effective to least effective. Return only the ranked list "
        f"with brief justification.\n\n{rec_descriptions}\n\nRanked list:"
    )

    await generate_text(prompt, max_tokens=200)
    return recommendations


async def get_ai_status() -> Dict[str, Any]:
    """Check AI service availability."""
    available = await _gemini_available()
    return {
        "gemini_available": available,
        "model": GEMINI_MODEL if available else None,
        "provider": "Google Gemini",
    }
