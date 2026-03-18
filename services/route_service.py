"""Route service using great-circle calculations.

For enhanced routing with turn-by-turn directions, integrate OpenRouteService
by registering a free key at openrouteservice.org and setting the
OPENROUTESERVICE_API_KEY environment variable.
"""

import math
import os
from typing import Dict, Any, Optional

import httpx

ORS_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY", "")
ORS_URL = "https://api.openrouteservice.org/v2/directions"


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km between two points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def great_circle_points(
    lat1: float, lng1: float, lat2: float, lng2: float, n: int = 50
) -> list[list[float]]:
    """Generate intermediate great-circle points."""
    lat1_r, lng1_r = math.radians(lat1), math.radians(lng1)
    lat2_r, lng2_r = math.radians(lat2), math.radians(lng2)

    d = 2 * math.asin(
        math.sqrt(
            math.sin((lat1_r - lat2_r) / 2) ** 2
            + math.cos(lat1_r)
            * math.cos(lat2_r)
            * math.sin((lng1_r - lng2_r) / 2) ** 2
        )
    )

    if d == 0:
        return [[lat1, lng1]]

    points = []
    for i in range(n + 1):
        f = i / n
        A = math.sin((1 - f) * d) / math.sin(d)
        B = math.sin(f * d) / math.sin(d)
        x = A * math.cos(lat1_r) * math.cos(lng1_r) + B * math.cos(lat2_r) * math.cos(lng2_r)
        y = A * math.cos(lat1_r) * math.sin(lng1_r) + B * math.cos(lat2_r) * math.sin(lng2_r)
        z = A * math.sin(lat1_r) + B * math.sin(lat2_r)
        lat = math.degrees(math.atan2(z, math.sqrt(x * x + y * y)))
        lng = math.degrees(math.atan2(y, x))
        points.append([lat, lng])
    return points


SPEED_KMH = {"Air": 800, "Sea": 30, "Road": 60, "Rail": 80}


def get_route(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    transport_mode: str = "Sea",
) -> Dict[str, Any]:
    """Calculate route info using great-circle math."""
    distance = haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
    speed = SPEED_KMH.get(transport_mode, 50)
    duration_hours = distance / speed
    geometry = great_circle_points(origin_lat, origin_lng, dest_lat, dest_lng)

    return {
        "distance_km": round(distance),
        "duration_hours": round(duration_hours, 1),
        "geometry": geometry,
    }


async def get_route_ors(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    profile: str = "driving-car",
) -> Optional[Dict[str, Any]]:
    """Get route from OpenRouteService (requires free API key)."""
    if not ORS_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{ORS_URL}/{profile}",
                params={
                    "api_key": ORS_API_KEY,
                    "start": f"{origin_lng},{origin_lat}",
                    "end": f"{dest_lng},{dest_lat}",
                },
            )
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return None
