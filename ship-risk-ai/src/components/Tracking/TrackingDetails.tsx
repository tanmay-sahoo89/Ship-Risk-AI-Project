import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  AlertTriangle,
  Truck,
  Thermometer,
  Wind,
  Cloud,
  Navigation,
} from 'lucide-react';
import type { TrackedShipment, WeatherData } from '../../types/tracking';
import { RISK_TIER_COLORS } from '../../utils/constants';
import { haversineDistance } from '../../services/route';
import { getWeather } from '../../services/weather';

interface TrackingDetailsProps {
  shipment: TrackedShipment;
  onClose: () => void;
}

const TrackingDetails: React.FC<TrackingDetailsProps> = ({ shipment, onClose }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWeather(shipment.current_lat, shipment.current_lng)
      .then((w) => { if (!cancelled) setWeather(w); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [shipment.current_lat, shipment.current_lng]);

  const riskColor = RISK_TIER_COLORS[shipment.risk_tier as keyof typeof RISK_TIER_COLORS];
  const totalDist = haversineDistance(
    shipment.origin_lat, shipment.origin_lng,
    shipment.dest_lat, shipment.dest_lng
  );
  const progress = shipment.planned_transit_days > 0
    ? Math.min(shipment.days_in_transit / shipment.planned_transit_days, 1)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-heading)]">{shipment.shipment_id}</h3>
          <p className="text-xs text-[var(--text-muted)]">{shipment.carrier} · {shipment.transport_mode}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-light)] transition-colors"
        >
          <X className="w-5 h-5 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Risk Badge */}
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1 rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: riskColor }}
          >
            {shipment.risk_tier}
          </span>
          <span className="text-sm text-[var(--text-muted)]">
            {(shipment.delay_probability * 100).toFixed(0)}% delay probability
          </span>
        </div>

        {/* Route */}
        <div className="glass rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-green-500" />
            <span className="text-[var(--text-heading)] font-medium">{shipment.origin}</span>
          </div>
          <div className="ml-2 border-l-2 border-dashed border-[var(--border-light)] h-4" />
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-[var(--accent-color)]" />
            <span className="text-[var(--text-heading)] font-medium">{shipment.destination}</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {Math.round(totalDist).toLocaleString()} km · {shipment.transport_mode}
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>Transit Progress</span>
            <span>{shipment.days_in_transit} / {shipment.planned_transit_days} days</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--bg-glass-light)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: riskColor,
              }}
            />
          </div>
        </div>

        {/* Status & ETA */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
              <Truck className="w-3 h-3" /> Status
            </div>
            <div className="text-sm font-semibold text-[var(--text-heading)]">{shipment.shipment_status}</div>
          </div>
          <div className="glass rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
              <Clock className="w-3 h-3" /> ETA
            </div>
            <div className="text-sm font-semibold text-[var(--text-heading)]">{shipment.planned_eta}</div>
          </div>
        </div>

        {/* Weather at current location */}
        {weather && (
          <div className="glass rounded-lg p-3">
            <div className="text-xs text-[var(--text-muted)] mb-2">Weather at Location</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{weather.icon}</span>
              <div>
                <div className="text-sm font-semibold text-[var(--text-heading)]">{weather.description}</div>
                <div className="flex gap-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3" /> {weather.temperature}°C
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3" /> {weather.wind_speed} km/h
                  </span>
                  <span className="flex items-center gap-1">
                    <Cloud className="w-3 h-3" /> {weather.cloud_cover}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {shipment.top_risk_factors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <AlertTriangle className="w-3 h-3" /> Top Risk Factors
            </div>
            <div className="space-y-1.5">
              {shipment.top_risk_factors.map((factor, i) => (
                <div
                  key={i}
                  className="glass rounded-lg px-3 py-2 text-xs text-[var(--text-body)]"
                >
                  {factor}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disruption */}
        {shipment.disruption_type && shipment.disruption_type !== 'None' && (
          <div className="glass rounded-lg p-3 border-l-4" style={{ borderLeftColor: riskColor }}>
            <div className="text-xs text-[var(--text-muted)] mb-1">Active Disruption</div>
            <div className="text-sm font-semibold text-[var(--text-heading)]">{shipment.disruption_type}</div>
            <div className="text-xs text-[var(--text-muted)]">
              Impact Score: {shipment.disruption_impact_score.toFixed(1)} / 10
            </div>
          </div>
        )}

        {/* Coordinates */}
        <div className="text-xs text-[var(--text-muted)] space-y-0.5">
          <div>Current: {shipment.current_lat.toFixed(4)}, {shipment.current_lng.toFixed(4)}</div>
          <div>Last update: {new Date(shipment.last_update).toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrackingDetails);
