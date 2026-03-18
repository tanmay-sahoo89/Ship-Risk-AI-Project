import type { Shipment } from '../types/shipment';

export const calculateCompositeRiskScore = (shipment: Shipment): number => {
  const weights = {
    weather: 0.20,
    traffic: 0.15,
    disruption: 0.25,
    portCongestion: 0.10,
    carrierReliability: 0.15,
    historicalDelay: 0.10,
    routeRisk: 0.05,
  };

  const score =
    shipment.weather_severity_score * weights.weather +
    shipment.traffic_congestion_level * weights.traffic +
    shipment.disruption_impact_score * weights.disruption +
    shipment.port_congestion_score * weights.portCongestion +
    (1 - shipment.carrier_reliability_score) * 10 * weights.carrierReliability +
    shipment.historical_delay_rate * 10 * weights.historicalDelay +
    shipment.route_risk_score * 10 * weights.routeRisk;

  return Math.min(Math.max(score, 0), 10);
};

export const calculateTransitProgress = (shipment: Shipment): number => {
  if (shipment.planned_transit_days === 0) return 0;
  return (shipment.days_in_transit / shipment.planned_transit_days) * 100;
};

export const estimateDelayHours = (probability: number): number => {
  if (probability < 0.3) return 0;
  if (probability < 0.6) return 12 + Math.random() * 12;
  if (probability < 0.9) return 24 + Math.random() * 48;
  return 48 + Math.random() * 96;
};

export const calculateSLABuffer = (shipment: Shipment): number => {
  const eta = new Date(shipment.planned_eta);
  const now = new Date();
  const msRemaining = eta.getTime() - now.getTime();
  return msRemaining / (1000 * 60 * 60);
};

export const isHighPriority = (shipment: Shipment): boolean => {
  return (
    shipment.delay_probability >= 0.6 ||
    calculateSLABuffer(shipment) <= 48 ||
    shipment.disruption_type !== 'None'
  );
};

export const getRiskLevel = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  if (score >= 9) return 'CRITICAL';
  if (score >= 6) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
};

export const calculateCarrierPerformanceScore = (
  reliability: number,
  historicalDelay: number
): number => {
  return (reliability * 0.7 + (1 - historicalDelay) * 0.3) * 100;
};

export const predictArrivalWindow = (
  shipment: Shipment
): { earliest: string; latest: string } => {
  const eta = new Date(shipment.planned_eta);
  const delayHours = estimateDelayHours(shipment.delay_probability);

  const earliest = new Date(eta.getTime());
  const latest = new Date(eta.getTime() + delayHours * 60 * 60 * 1000);

  return {
    earliest: earliest.toISOString(),
    latest: latest.toISOString(),
  };
};
