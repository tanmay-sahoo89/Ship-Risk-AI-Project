"""Tracking service for shipment, aircraft, and vessel positions."""

import httpx
from typing import Dict, Any, Optional

# OpenSky Network — free, no auth needed, 400 req/hour
OPENSKY_URL = "https://opensky-network.org/api"


async def get_aircraft_position(icao24: str) -> Optional[Dict[str, Any]]:
    """Get aircraft position from OpenSky Network."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{OPENSKY_URL}/states/all",
                params={"icao24": icao24.lower()},
            )
            resp.raise_for_status()
            data = resp.json()

        states = data.get("states", [])
        if not states:
            return None

        state = states[0]
        return {
            "icao24": state[0],
            "callsign": (state[1] or "").strip(),
            "latitude": state[6],
            "longitude": state[5],
            "altitude": state[7],
            "speed": state[9],
            "heading": state[10],
            "on_ground": state[8],
            "last_update": state[4],
        }
    except Exception:
        return None


async def get_all_aircraft_in_bounds(
    lat_min: float, lat_max: float, lng_min: float, lng_max: float
) -> list[Dict[str, Any]]:
    """Get all aircraft in a geographic bounding box."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{OPENSKY_URL}/states/all",
                params={
                    "lamin": lat_min,
                    "lamax": lat_max,
                    "lomin": lng_min,
                    "lomax": lng_max,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        aircraft = []
        for state in data.get("states", []):
            if state[5] is not None and state[6] is not None:
                aircraft.append({
                    "icao24": state[0],
                    "callsign": (state[1] or "").strip(),
                    "latitude": state[6],
                    "longitude": state[5],
                    "altitude": state[7],
                    "speed": state[9],
                    "heading": state[10],
                    "on_ground": state[8],
                })
        return aircraft
    except Exception:
        return []
