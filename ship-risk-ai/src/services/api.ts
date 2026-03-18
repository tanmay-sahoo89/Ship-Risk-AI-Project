import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import type { Shipment } from '../types/shipment';
import type { ShipmentAlert } from '../types/alert';
import type { Recommendation, RiskMetrics } from '../types/risk';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  // ── Shipments ───────────────────────────────────────────────────────────
  async getShipments(): Promise<Shipment[]> {
    if (!db) return this.getMockShipments();
    try {
      const snapshot = await getDocs(collection(db, 'shipments'));
      const shipments: Shipment[] = [];
      snapshot.forEach((docSnap) => {
        shipments.push(docSnap.data() as Shipment);
      });
      return shipments.length > 0 ? shipments : this.getMockShipments();
    } catch (error) {
      console.error('Error fetching shipments from Firestore:', error);
      return this.getMockShipments();
    }
  }

  async getShipmentById(id: string): Promise<Shipment | null> {
    if (!db) return null;
    try {
      const docSnap = await getDoc(doc(db, 'shipments', id));
      if (docSnap.exists()) {
        return docSnap.data() as Shipment;
      }
      return null;
    } catch (error) {
      console.error('Error fetching shipment from Firestore:', error);
      return null;
    }
  }

  // ── Add Shipment ─────────────────────────────────────────────────────────
  async addShipment(
    shipmentData: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> {
    // 1. Write to backend CSV (primary data source)
    const resp = await fetch(`${API_BASE}/api/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shipmentData),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: resp.statusText }));
      throw new Error(err.detail || `Server error: ${resp.status}`);
    }

    const result = await resp.json();

    // 2. Also write to Firestore if available (keeps both in sync)
    if (db) {
      try {
        await setDoc(
          doc(db, 'shipments', shipmentData.shipment_id as string),
          shipmentData
        );
      } catch (fbErr) {
        console.warn('Firestore write failed (non-critical):', fbErr);
      }
    }

    return { success: true, message: result.message };
  }

  // ── Alerts ──────────────────────────────────────────────────────────────
  async getAlerts(): Promise<ShipmentAlert[]> {
    if (!db) return this.getMockAlerts();
    try {
      const snapshot = await getDocs(collection(db, 'alerts'));
      const alerts: ShipmentAlert[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        alerts.push({
          ...data,
          top_risk_factors: Array.isArray(data.top_risk_factors)
            ? data.top_risk_factors
            : [],
        } as ShipmentAlert);
      });
      return alerts.length > 0 ? alerts : this.getMockAlerts();
    } catch (error) {
      console.error('Error fetching alerts from Firestore:', error);
      return this.getMockAlerts();
    }
  }

  // ── Recommendations ─────────────────────────────────────────────────────
  async getRecommendations(shipmentId: string): Promise<Recommendation[]> {
    if (!db) return [];
    try {
      const docSnap = await getDoc(doc(db, 'recommendations', shipmentId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return [
          {
            ...data,
            reasoning: Array.isArray(data.reasoning) ? data.reasoning : [],
          } as Recommendation,
        ];
      }
      return [];
    } catch (error) {
      console.error('Error fetching recommendations from Firestore:', error);
      return [];
    }
  }

  async getAllRecommendations(): Promise<Recommendation[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, 'recommendations'));
      const recs: Recommendation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        recs.push({
          ...data,
          reasoning: Array.isArray(data.reasoning) ? data.reasoning : [],
        } as Recommendation);
      });
      return recs;
    } catch (error) {
      console.error('Error fetching recommendations from Firestore:', error);
      return [];
    }
  }

  // ── Metrics ─────────────────────────────────────────────────────────────
  async getRiskMetrics(): Promise<RiskMetrics> {
    if (!db) return this.getMockMetrics();
    try {
      const docSnap = await getDoc(doc(db, 'metrics', 'summary'));
      if (docSnap.exists()) {
        return docSnap.data() as RiskMetrics;
      }
      return this.getMockMetrics();
    } catch (error) {
      console.error('Error fetching metrics from Firestore:', error);
      return this.getMockMetrics();
    }
  }

  // ── Interventions (write-back) ──────────────────────────────────────────
  async executeIntervention(
    shipmentId: string,
    action: string
  ): Promise<{ success: boolean; message: string }> {
    // For now, just acknowledge — could write to a Firestore 'interventions' collection
    return {
      success: true,
      message: `Intervention '${action}' scheduled for ${shipmentId}`,
    };
  }

  // ── Mock fallbacks ──────────────────────────────────────────────────────
  private getMockShipments(): Shipment[] {
    return [];
  }

  private getMockAlerts(): ShipmentAlert[] {
    return [
      {
        shipment_id: 'SHP100123',
        risk_tier: 'CRITICAL',
        delay_probability: 0.92,
        eta: '2026-03-15',
        hours_to_sla: 18,
        origin: 'Shanghai',
        destination: 'New York',
        carrier: 'Maersk',
        transport_mode: 'Sea',
        top_risk_factors: [
          'Disruption: Port Strike [score: 9.0]',
          'Weather severity (Storm) [score: 8.5]',
          'Port congestion [score: 9.0]',
        ],
        action_required:
          'Escalate to operations manager; activate emergency reroute.',
        alert_generated_at: '2026-03-11 19:00 UTC',
        alert_type: 'IMMEDIATE',
      },
      {
        shipment_id: 'SHP100456',
        risk_tier: 'HIGH',
        delay_probability: 0.78,
        eta: '2026-03-16',
        hours_to_sla: 42,
        origin: 'Hamburg',
        destination: 'London',
        carrier: 'DHL',
        transport_mode: 'Road',
        top_risk_factors: [
          'Traffic congestion level (Road) [score: 7.0]',
          'Weather severity (Heavy Rain) [score: 5.5]',
          'High route risk [score: 4.2]',
        ],
        action_required: 'Trigger intervention protocol immediately.',
        alert_generated_at: '2026-03-11 19:00 UTC',
        alert_type: '48H_WARNING',
      },
    ];
  }

  private getMockMetrics(): RiskMetrics {
    return {
      total_shipments: 500,
      critical_alerts: 12,
      high_alerts: 45,
      medium_alerts: 128,
      low_alerts: 315,
      average_risk_score: 0.34,
      shipments_at_risk: 185,
    };
  }
}

export const apiService = new ApiService();
