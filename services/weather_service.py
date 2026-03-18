"""Open-Meteo weather service — completely free, no API key needed."""

import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# Simple in-memory cache with TTL
_cache: Dict[str, tuple] = {}  # key -> (data, expiry_time)
CACHE_TTL_SECONDS = 3600  # 1 hour


def _cache_key(lat: float, lng: float) -> str:
    return f"weather:{round(lat, 2)}:{round(lng, 2)}"


def _get_cached(key: str) -> Optional[Dict[str, Any]]:
    if key in _cache:
        data, expiry = _cache[key]
        if datetime.now() < expiry:
            return data
        del _cache[key]
    return None


def _set_cached(key: str, data: Dict[str, Any]) -> None:
    _cache[key] = (data, datetime.now() + timedelta(seconds=CACHE_TTL_SECONDS))


async def get_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """Get current weather for a location from Open-Meteo."""
    key = _cache_key(latitude, longitude)
    cached = _get_cached(key)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            OPEN_METEO_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": "temperature_2m,weather_code,wind_speed_10m,cloud_cover",
                "hourly": "temperature_2m,precipitation,cloud_cover",
                "forecast_days": 2,
                "timezone": "auto",
            },
        )
        resp.raise_for_status()
        data = resp.json()

    _set_cached(key, data)
    return data


async def get_weather_bulk(locations: list[Dict[str, float]]) -> list[Dict[str, Any]]:
    """Get weather for multiple locations."""
    results = []
    for loc in locations:
        try:
            weather = await get_weather(loc["lat"], loc["lng"])
            results.append({"lat": loc["lat"], "lng": loc["lng"], "weather": weather})
        except Exception as e:
            results.append({"lat": loc["lat"], "lng": loc["lng"], "error": str(e)})
    return results
