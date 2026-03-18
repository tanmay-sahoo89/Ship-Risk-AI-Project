import type { Shipment } from '../types/shipment';
import type { TrackedShipment, TrackingStats, TrackingEvent } from '../types/tracking';
import type { RiskTier } from '../types/alert';
import { CITY_COORDS } from '../types/tracking';

// ── Geo helpers ─────────────────────────────────────────────────────────────

function getCityCoords(city: string): { lat: number; lng: number } {
  // Exact match
  if (CITY_COORDS[city]) return CITY_COORDS[city];

  // Partial match (e.g. "New York, USA" → "New York")
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    if (city.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(city.toLowerCase())) {
      return coords;
    }
  }

  // Fallback: random offset from center to avoid stacking markers
  return {
    lat: 20 + (Math.random() - 0.5) * 60,
    lng: 0 + (Math.random() - 0.5) * 180,
  };
}

function interpolatePosition(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  progress: number // 0..1
): { lat: number; lng: number } {
  return {
    lat: origin.lat + (dest.lat - origin.lat) * progress,
    lng: origin.lng + (dest.lng - origin.lng) * progress,
  };
}

function getRiskTier(delayProb: number): RiskTier {
  if (delayProb >= 0.9) return 'CRITICAL';
  if (delayProb >= 0.6) return 'HIGH';
  if (delayProb >= 0.3) return 'MEDIUM';
  return 'LOW';
}

// ── Convert Shipment → TrackedShipment ──────────────────────────────────────

export function shipmentToTracked(shipment: Shipment, alerts: { shipment_id: string; top_risk_factors: string[]; risk_tier: RiskTier }[]): TrackedShipment {
  const origin = getCityCoords(shipment.origin);
  const dest = getCityCoords(shipment.destination);

  const progress = shipment.planned_transit_days > 0
    ? Math.min(shipment.days_in_transit / shipment.planned_transit_days, 0.95)
    : 0.5;

  const current = interpolatePosition(origin, dest, progress);
  const alert = alerts.find((a) => a.shipment_id === shipment.shipment_id);

  return {
    shipment_id: shipment.shipment_id,
    origin: shipment.origin,
    destination: shipment.destination,
    carrier: shipment.carrier,
    transport_mode: shipment.transport_mode,
    shipment_status: shipment.shipment_status,
    delay_probability: shipment.delay_probability,
    risk_tier: alert?.risk_tier ?? getRiskTier(shipment.delay_probability),
    planned_eta: shipment.planned_eta,
    days_in_transit: shipment.days_in_transit,
    planned_transit_days: shipment.planned_transit_days,
    origin_lat: origin.lat,
    origin_lng: origin.lng,
    dest_lat: dest.lat,
    dest_lng: dest.lng,
    current_lat: current.lat,
    current_lng: current.lng,
    weather_condition: shipment.weather_condition,
    weather_severity_score: shipment.weather_severity_score,
    disruption_type: shipment.disruption_type,
    disruption_impact_score: shipment.disruption_impact_score,
    top_risk_factors: alert?.top_risk_factors ?? [],
    last_update: new Date().toISOString(),
  };
}

// ── Compute stats ───────────────────────────────────────────────────────────

export function computeTrackingStats(tracked: TrackedShipment[]): TrackingStats {
  const byRisk: Record<RiskTier, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const byMode: Record<string, number> = {};
  let totalDelay = 0;
  let alertCount = 0;

  for (const s of tracked) {
    byRisk[s.risk_tier] = (byRisk[s.risk_tier] || 0) + 1;
    byMode[s.transport_mode] = (byMode[s.transport_mode] || 0) + 1;
    totalDelay += s.delay_probability;
    if (s.risk_tier === 'HIGH' || s.risk_tier === 'CRITICAL') alertCount++;
  }

  return {
    total_active: tracked.length,
    by_risk_tier: byRisk,
    by_transport_mode: byMode,
    alerts_today: alertCount,
    avg_delay_probability: tracked.length > 0 ? totalDelay / tracked.length : 0,
  };
}

// ── Generate event feed from tracked shipments ──────────────────────────────

export function generateEvents(tracked: TrackedShipment[]): TrackingEvent[] {
  const events: TrackingEvent[] = [];
  const now = new Date();

  for (const s of tracked) {
    // Critical/High risk alerts
    if (s.risk_tier === 'CRITICAL' || s.risk_tier === 'HIGH') {
      events.push({
        id: `alert-${s.shipment_id}`,
        type: 'alert',
        shipment_id: s.shipment_id,
        message: `${s.shipment_id} (${s.origin} → ${s.destination}) — ${s.risk_tier} risk, ${(s.delay_probability * 100).toFixed(0)}% delay probability`,
        timestamp: new Date(now.getTime() - Math.random() * 3600000).toISOString(),
        severity: s.risk_tier === 'CRITICAL' ? 'critical' : 'warning',
      });
    }

    // Weather events
    if (s.weather_severity_score > 5) {
      events.push({
        id: `weather-${s.shipment_id}`,
        type: 'weather',
        shipment_id: s.shipment_id,
        message: `Weather alert: ${s.weather_condition} affecting ${s.shipment_id} (severity ${s.weather_severity_score.toFixed(1)})`,
        timestamp: new Date(now.getTime() - Math.random() * 7200000).toISOString(),
        severity: s.weather_severity_score > 7 ? 'critical' : 'warning',
      });
    }

    // Disruption events
    if (s.disruption_type && s.disruption_type !== 'None') {
      events.push({
        id: `disruption-${s.shipment_id}`,
        type: 'status_change',
        shipment_id: s.shipment_id,
        message: `Disruption: ${s.disruption_type} impacting ${s.shipment_id} (impact ${s.disruption_impact_score.toFixed(1)})`,
        timestamp: new Date(now.getTime() - Math.random() * 5400000).toISOString(),
        severity: s.disruption_impact_score > 7 ? 'critical' : 'warning',
      });
    }
  }

  // Sort by timestamp descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events.slice(0, 50);
}
