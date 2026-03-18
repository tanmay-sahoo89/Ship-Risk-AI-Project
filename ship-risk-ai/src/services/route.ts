import type { RouteInfo } from '../types/tracking';

// ── Simple great-circle route generation ────────────────────────────────────
// We generate a curved route between two points without needing an API key.
// This works for visualization - for real ETA, integrate OpenRouteService.

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Generate great-circle intermediate points between two coordinates.
 * Returns [lat, lng][] array suitable for Leaflet polylines.
 */
export function generateGreatCircleRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  numPoints: number = 50
): [number, number][] {
  const points: [number, number][] = [];

  const lat1 = toRad(originLat);
  const lng1 = toRad(originLng);
  const lat2 = toRad(destLat);
  const lng2 = toRad(destLng);

  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)
    )
  );

  if (d === 0) return [[originLat, originLng]];

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lng = toDeg(Math.atan2(y, x));
    points.push([lat, lng]);
  }

  return points;
}

/**
 * Estimate distance (km) using Haversine formula.
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate transit duration based on transport mode and distance.
 */
function estimateDuration(distanceKm: number, mode: string): number {
  const speeds: Record<string, number> = {
    Air: 800,
    Sea: 30,
    Road: 60,
    Rail: 80,
  };
  const speedKmh = speeds[mode] ?? 50;
  return distanceKm / speedKmh;
}

/**
 * Build a RouteInfo object for two points.
 */
export function buildRouteInfo(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  transportMode: string = 'Sea'
): RouteInfo {
  const geometry = generateGreatCircleRoute(originLat, originLng, destLat, destLng);
  const distance = haversineDistance(originLat, originLng, destLat, destLng);
  const duration = estimateDuration(distance, transportMode);

  return {
    distance_km: Math.round(distance),
    duration_hours: Math.round(duration * 10) / 10,
    geometry,
  };
}
