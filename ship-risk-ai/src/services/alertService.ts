import type { ShipmentAlert } from '../types/alert';
import type { Shipment } from '../types/shipment';

export class AlertService {
  private static instance: AlertService;

  private constructor() {}

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  calculateRiskTier(probability: number): ShipmentAlert['risk_tier'] {
    if (probability >= 0.9) return 'CRITICAL';
    if (probability >= 0.6) return 'HIGH';
    if (probability >= 0.3) return 'MEDIUM';
    return 'LOW';
  }

  calculateHoursToSLA(eta: string): number {
    const etaDate = new Date(eta);
    const now = new Date();
    const diffMs = etaDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours);
  }

  getAlertType(hoursToSLA: number): ShipmentAlert['alert_type'] {
    if (hoursToSLA <= 24) return 'IMMEDIATE';
    if (hoursToSLA <= 48) return '48H_WARNING';
    return '72H_WARNING';
  }

  generateTopRiskFactors(shipment: Shipment): string[] {
    const factors: { factor: string; score: number }[] = [];

    if (shipment.weather_severity_score > 5) {
      factors.push({
        factor: `Weather severity (${shipment.weather_condition}) [score: ${shipment.weather_severity_score}]`,
        score: shipment.weather_severity_score,
      });
    }

    if (shipment.traffic_congestion_level > 5) {
      factors.push({
        factor: `Traffic congestion level (${shipment.transport_mode}) [score: ${shipment.traffic_congestion_level}]`,
        score: shipment.traffic_congestion_level,
      });
    }

    if (shipment.disruption_type !== 'None') {
      factors.push({
        factor: `Disruption: ${shipment.disruption_type} [score: ${shipment.disruption_impact_score}]`,
        score: shipment.disruption_impact_score,
      });
    }

    if (shipment.port_congestion_score > 5) {
      factors.push({
        factor: `Port congestion [score: ${shipment.port_congestion_score}]`,
        score: shipment.port_congestion_score,
      });
    }

    if (shipment.carrier_reliability_score < 0.85) {
      factors.push({
        factor: `Low carrier reliability [score: ${(1 - shipment.carrier_reliability_score) * 10}]`,
        score: (1 - shipment.carrier_reliability_score) * 10,
      });
    }

    if (shipment.historical_delay_rate > 0.3) {
      factors.push({
        factor: `High historical delay rate [score: ${shipment.historical_delay_rate * 10}]`,
        score: shipment.historical_delay_rate * 10,
      });
    }

    return factors
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((f) => f.factor);
  }

  getActionRequired(tier: ShipmentAlert['risk_tier']): string {
    const actions = {
      CRITICAL: 'Escalate to operations manager; activate emergency reroute.',
      HIGH: 'Trigger intervention protocol immediately.',
      MEDIUM: 'Review carrier updates; prepare contingency options.',
      LOW: 'Monitor – no immediate action required.',
    };
    return actions[tier];
  }

  shouldTriggerAlert(probability: number, threshold: number = 0.3): boolean {
    return probability >= threshold;
  }

  prioritizeAlerts(alerts: ShipmentAlert[]): ShipmentAlert[] {
    const tierOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return [...alerts].sort((a, b) => {
      const tierDiff = tierOrder[b.risk_tier] - tierOrder[a.risk_tier];
      if (tierDiff !== 0) return tierDiff;
      return a.hours_to_sla - b.hours_to_sla;
    });
  }
}

export const alertService = AlertService.getInstance();
