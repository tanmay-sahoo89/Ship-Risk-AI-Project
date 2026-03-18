import { useState, useEffect, useCallback, useRef } from "react";
import { useShipmentContext } from "../contexts/ShipmentContext";
import {
  shipmentToTracked,
  computeTrackingStats,
  generateEvents,
} from "../services/tracking";
import { getWeather } from "../services/weather";
import type {
  TrackedShipment,
  TrackingStats,
  TrackingEvent,
  WeatherData,
} from "../types/tracking";

interface UseTrackingReturn {
  trackedShipments: TrackedShipment[];
  stats: TrackingStats;
  events: TrackingEvent[];
  weatherCache: Map<string, WeatherData>;
  loading: boolean;
  error: string | null;
  refreshTracking: () => void;
  fetchWeatherFor: (
    lat: number,
    lng: number,
    id: string,
  ) => Promise<WeatherData | null>;
}

export function useTracking(): UseTrackingReturn {
  const { shipments, alerts, loading: ctxLoading } = useShipmentContext();
  const [trackedShipments, setTrackedShipments] = useState<TrackedShipment[]>(
    [],
  );
  const [stats, setStats] = useState<TrackingStats>({
    total_active: 0,
    by_risk_tier: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    by_transport_mode: {},
    alerts_today: 0,
    avg_delay_probability: 0,
  });
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const weatherCacheRef = useRef<Map<string, WeatherData>>(new Map());

  const buildTracking = useCallback(() => {
    try {
      setLoading(true);
      const alertsForMapping = alerts.map((a) => ({
        shipment_id: a.shipment_id,
        top_risk_factors: a.top_risk_factors,
        risk_tier: a.risk_tier,
      }));

      const tracked = shipments.map((s) =>
        shipmentToTracked(s, alertsForMapping),
      );
      setTrackedShipments(tracked);
      setStats(computeTrackingStats(tracked));
      setEvents(generateEvents(tracked));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to build tracking data",
      );
    } finally {
      setLoading(false);
    }
  }, [shipments, alerts]);

  useEffect(() => {
    if (!ctxLoading && shipments.length > 0) {
      buildTracking();
    } else if (!ctxLoading) {
      setLoading(false);
    }
  }, [ctxLoading, shipments, alerts, buildTracking]);

  // Periodic refresh every 30s
  useEffect(() => {
    if (shipments.length === 0) return;
    const interval = setInterval(buildTracking, 30000);
    return () => clearInterval(interval);
  }, [buildTracking, shipments.length]);

  const fetchWeatherFor = useCallback(
    async (
      lat: number,
      lng: number,
      id: string,
    ): Promise<WeatherData | null> => {
      const cached = weatherCacheRef.current.get(id);
      if (cached) return cached;

      try {
        const weather = await getWeather(lat, lng);
        weatherCacheRef.current.set(id, weather);
        return weather;
      } catch {
        return null;
      }
    },
    [],
  );

  return {
    trackedShipments,
    stats,
    events,
    weatherCache: weatherCacheRef.current,
    loading: loading || ctxLoading,
    error,
    refreshTracking: buildTracking,
    fetchWeatherFor,
  };
}
