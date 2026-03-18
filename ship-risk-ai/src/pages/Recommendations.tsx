import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useShipmentContext } from '../contexts/ShipmentContext';
import { useNotification } from '../contexts/NotificationContext';
import { apiService } from '../services/api';

export const Recommendations: React.FC = () => {
  const [searchParams] = useSearchParams();
  const filterShipmentId = searchParams.get('shipmentId');
  const { recommendations, alerts } = useShipmentContext();
  const { addNotification } = useNotification();
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executedIds, setExecutedIds] = useState<Set<string>>(new Set());

  // Use real recommendations from Firestore if available,
  // otherwise fall back to deriving from alerts
  const displayRecs =
    recommendations.length > 0
      ? recommendations.map((rec) => ({
          shipment_id: rec.shipment_id,
          risk_tier: rec.risk_tier,
          delay_probability: rec.delay_probability,
          action: rec.primary_action,
          description: rec.primary_description,
          fallback: rec.fallback_action,
          cost_impact: rec.cost_impact,
          time_saving: rec.estimated_time_saving,
          sla_impact: rec.sla_impact,
          confidence: rec.confidence,
          reasoning: rec.reasoning || [],
        }))
      : alerts
          .filter((a) => a.risk_tier === 'CRITICAL' || a.risk_tier === 'HIGH')
          .map((alert) => ({
            shipment_id: alert.shipment_id,
            risk_tier: alert.risk_tier,
            delay_probability: alert.delay_probability,
            action:
              alert.risk_tier === 'CRITICAL'
                ? 'Upgrade to Air Freight'
                : 'Reroute Shipment',
            description:
              alert.risk_tier === 'CRITICAL'
                ? 'Upgrade to air freight to recover time against SLA'
                : 'Divert shipment to alternative transit path',
            fallback: null,
            cost_impact: alert.risk_tier === 'CRITICAL' ? 'High' : 'Medium',
            time_saving:
              alert.risk_tier === 'CRITICAL' ? '24-96 hours' : '12-48 hours',
            sla_impact: 'High',
            confidence: alert.delay_probability >= 0.8 ? 'High' : 'Medium',
            reasoning: [],
          }));

  // Filter by shipmentId query param if provided
  const filteredRecs = filterShipmentId
    ? displayRecs.filter((r) => r.shipment_id === filterShipmentId)
    : displayRecs;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Smart Recommendations</h2>
        <p className="text-light">
          AI-powered intervention suggestions
          {filterShipmentId && (
            <span className="ml-2 glass-light px-2 py-0.5 rounded text-accent text-sm">
              Filtered: {filterShipmentId}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRecs.length === 0 ? (
          <div className="card text-center py-12">
            <Lightbulb className="w-12 h-12 text-light mx-auto mb-4" />
            <p className="text-light">No recommendations at this time</p>
            <p className="text-sm text-light mt-2">All shipments are on track</p>
          </div>
        ) : (
          filteredRecs.map((rec, index) => (
            <motion.div
              key={rec.shipment_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:border-accent"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-accent to-secondary">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{rec.shipment_id}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                          rec.risk_tier === 'CRITICAL' ? 'bg-risk-critical' : 'bg-risk-high'
                        }`}
                      >
                        {rec.risk_tier} RISK
                      </span>
                      {rec.delay_probability != null && (
                        <span className="ml-2 text-sm text-light">
                          {(rec.delay_probability * 100).toFixed(1)}% delay probability
                        </span>
                      )}
                    </div>
                    <span className="text-sm glass-light px-3 py-1 rounded-lg text-accent font-semibold">
                      {rec.confidence} Confidence
                    </span>
                  </div>

                  <div className="glass-light p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-white mb-2">
                      Recommended Action: {rec.action}
                    </h4>
                    <p className="text-sm text-light">{rec.description}</p>
                    {rec.fallback && (
                      <p className="text-xs text-light mt-2">
                        Fallback: {rec.fallback}
                      </p>
                    )}
                  </div>

                  {rec.reasoning.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-light mb-1">Reasoning:</p>
                      <ul className="list-disc list-inside text-sm text-light space-y-1">
                        {rec.reasoning.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      <div>
                        <p className="text-xs text-light">Cost Impact</p>
                        <p className="text-sm font-semibold text-white">{rec.cost_impact}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-accent" />
                      <div>
                        <p className="text-xs text-light">Time Saving</p>
                        <p className="text-sm font-semibold text-white">{rec.time_saving}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      <div>
                        <p className="text-xs text-light">SLA Impact</p>
                        <p className="text-sm font-semibold text-white">{rec.sla_impact}</p>
                      </div>
                    </div>
                  </div>

                  {executedIds.has(rec.shipment_id) ? (
                    <button disabled className="btn-secondary w-full flex items-center justify-center space-x-2 opacity-70 cursor-default">
                      <CheckCircle className="w-5 h-5" />
                      <span>Intervention Scheduled</span>
                    </button>
                  ) : (
                    <button
                      disabled={executingId === rec.shipment_id}
                      onClick={async () => {
                        setExecutingId(rec.shipment_id);
                        try {
                          const result = await apiService.executeIntervention(rec.shipment_id, rec.action);
                          if (result.success) {
                            addNotification('success', `Intervention "${rec.action}" scheduled for ${rec.shipment_id}`);
                            setExecutedIds((prev) => new Set(prev).add(rec.shipment_id));
                          } else {
                            addNotification('error', result.message);
                          }
                        } catch {
                          addNotification('error', `Failed to execute intervention for ${rec.shipment_id}`);
                        } finally {
                          setExecutingId(null);
                        }
                      }}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      {executingId === rec.shipment_id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : null}
                      <span>{executingId === rec.shipment_id ? 'Executing...' : 'Execute Intervention'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
