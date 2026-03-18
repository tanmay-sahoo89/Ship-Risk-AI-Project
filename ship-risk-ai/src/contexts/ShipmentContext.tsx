import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Shipment } from '../types/shipment';
import type { ShipmentAlert } from '../types/alert';
import type { Recommendation, RiskMetrics } from '../types/risk';
import { apiService } from '../services/api';

export interface NewShipmentEvent {
  shipment_id: string;
  origin: string;
  destination: string;
  timestamp: number;
}

interface ShipmentContextType {
  shipments: Shipment[];
  alerts: ShipmentAlert[];
  recommendations: Recommendation[];
  metrics: RiskMetrics | null;
  newShipmentEvents: NewShipmentEvent[];
  clearNewShipmentEvents: () => void;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const ShipmentContext = createContext<ShipmentContextType | undefined>(undefined);

export const useShipmentContext = () => {
  const context = useContext(ShipmentContext);
  if (!context) {
    throw new Error('useShipmentContext must be used within ShipmentProvider');
  }
  return context;
};

interface ShipmentProviderProps {
  children: ReactNode;
}

export const ShipmentProvider: React.FC<ShipmentProviderProps> = ({ children }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [alerts, setAlerts] = useState<ShipmentAlert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [newShipmentEvents, setNewShipmentEvents] = useState<NewShipmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  // Compute metrics from shipments and alerts
  const computeMetrics = useCallback((shipmentList: Shipment[], alertList: ShipmentAlert[]): RiskMetrics => {
    const criticalAlerts = alertList.filter(a => a.risk_tier === 'CRITICAL').length;
    const highAlerts = alertList.filter(a => a.risk_tier === 'HIGH').length;
    const mediumAlerts = alertList.filter(a => a.risk_tier === 'MEDIUM').length;
    const lowAlerts = alertList.filter(a => a.risk_tier === 'LOW').length;
    const avgRisk = shipmentList.length > 0
      ? shipmentList.reduce((sum, s) => sum + (s.delay_probability || 0), 0) / shipmentList.length
      : 0;
    const atRisk = shipmentList.filter(s => (s.delay_probability || 0) >= 0.5).length;

    return {
      total_shipments: shipmentList.length,
      critical_alerts: criticalAlerts,
      high_alerts: highAlerts,
      medium_alerts: mediumAlerts,
      low_alerts: lowAlerts,
      average_risk_score: avgRisk,
      shipments_at_risk: atRisk,
    };
  }, []);

  // Recompute metrics whenever shipments or alerts change (avoids cross-setter race condition)
  useEffect(() => {
    if (shipments.length > 0 || alerts.length > 0) {
      setMetrics(computeMetrics(shipments, alerts));
    }
  }, [shipments, alerts, computeMetrics]);

  // Set up real-time Firestore listeners
  useEffect(() => {
    if (!db) {
      // No Firestore - fall back to API
      refreshData();
      return;
    }

    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    // Real-time shipments listener
    const unsubShipments = onSnapshot(
      collection(db, 'shipments'),
      (snapshot) => {
        const shipmentData = snapshot.docs.map(doc => doc.data() as Shipment);
        setShipments(shipmentData);

        // Detect newly added shipments (skip initial load)
        if (!isInitialLoad.current) {
          const addedDocs = snapshot.docChanges().filter(change => change.type === 'added');
          if (addedDocs.length > 0) {
            const events: NewShipmentEvent[] = addedDocs.map(change => {
              const data = change.doc.data() as Shipment;
              return {
                shipment_id: data.shipment_id,
                origin: data.origin || 'Unknown',
                destination: data.destination || 'Unknown',
                timestamp: Date.now(),
              };
            });
            setNewShipmentEvents(prev => [...events, ...prev].slice(0, 20));
          }
        }

        isInitialLoad.current = false;
        setLoading(false);
      },
      (err) => {
        console.warn('Shipments listener error:', err);
        // Fall back to API
        refreshData();
      }
    );
    unsubscribers.push(unsubShipments);

    // Real-time alerts listener
    const unsubAlerts = onSnapshot(
      collection(db, 'alerts'),
      (snapshot) => {
        const alertData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            top_risk_factors: Array.isArray(data.top_risk_factors) ? data.top_risk_factors : [],
          } as ShipmentAlert;
        });
        setAlerts(alertData);
      },
      (err) => {
        console.warn('Alerts listener error:', err);
      }
    );
    unsubscribers.push(unsubAlerts);

    // Real-time recommendations listener
    const unsubRecs = onSnapshot(
      collection(db, 'recommendations'),
      (snapshot) => {
        const recData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            reasoning: Array.isArray(data.reasoning) ? data.reasoning : [],
          } as Recommendation;
        });
        setRecommendations(recData);
      },
      (err) => {
        console.warn('Recommendations listener error:', err);
      }
    );
    unsubscribers.push(unsubRecs);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Fallback: fetch data via API (used when Firestore not available)
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shipmentsData, alertsData, metricsData, recsData] = await Promise.all([
        apiService.getShipments(),
        apiService.getAlerts(),
        apiService.getRiskMetrics(),
        apiService.getAllRecommendations(),
      ]);

      setShipments(shipmentsData);
      setAlerts(alertsData);
      setMetrics(metricsData);
      setRecommendations(recsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const clearNewShipmentEvents = useCallback(() => {
    setNewShipmentEvents([]);
  }, []);

  const value: ShipmentContextType = {
    shipments,
    alerts,
    recommendations,
    metrics,
    newShipmentEvents,
    clearNewShipmentEvents,
    loading,
    error,
    refreshData,
  };

  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>;
};
