import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TriangleAlert as AlertTriangle, MapPin, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useShipmentContext } from '../../contexts/ShipmentContext';
import { RiskTier } from '../Risk/RiskTier';
import { RiskFactorsList } from '../Risk/RiskFactorsList';
import { formatHours } from '../../utils/formatters';
import type { RiskTier as RiskTierType } from '../../types/alert';

const PAGE_SIZE = 10;

export const ShipmentAlerts: React.FC = () => {
  const { alerts, loading } = useShipmentContext();
  const navigate = useNavigate();
  const [filterTier, setFilterTier] = useState<RiskTierType | 'ALL'>('ALL');
  const [page, setPage] = useState(0);

  const filteredAlerts = useMemo(() => {
    return filterTier === 'ALL'
      ? alerts
      : alerts.filter((a) => a.risk_tier === filterTier);
  }, [alerts, filterTier]);

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));
  const paginatedAlerts = filteredAlerts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const tierCounts = useMemo(() => ({
    CRITICAL: alerts.filter((a) => a.risk_tier === 'CRITICAL').length,
    HIGH: alerts.filter((a) => a.risk_tier === 'HIGH').length,
    MEDIUM: alerts.filter((a) => a.risk_tier === 'MEDIUM').length,
    LOW: alerts.filter((a) => a.risk_tier === 'LOW').length,
  }), [alerts]);

  // Reset page when filter changes
  const handleFilterChange = (tier: RiskTierType | 'ALL') => {
    setFilterTier(tier);
    setPage(0);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange('ALL')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filterTier === 'ALL'
              ? 'bg-primary text-white'
              : 'glass-light text-light hover:text-accent'
          }`}
        >
          All ({alerts.length})
        </button>
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as RiskTierType[]).map((tier) => (
          <button
            key={tier}
            onClick={() => handleFilterChange(tier)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterTier === tier
                ? 'bg-primary text-white'
                : 'glass-light text-light hover:text-accent'
            }`}
          >
            {tier} ({tierCounts[tier]})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {filteredAlerts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card text-center py-12"
            >
              <AlertTriangle className="w-12 h-12 text-light mx-auto mb-4" />
              <p className="text-light">No alerts found for the selected filter</p>
            </motion.div>
          ) : (
            <motion.div
              key={`${filterTier}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {paginatedAlerts.map((alert, index) => (
                <motion.div
                  key={alert.shipment_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="card hover:border-accent"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {alert.shipment_id}
                          </h3>
                          <RiskTier tier={alert.risk_tier} probability={alert.delay_probability} />
                        </div>
                        <div className="glass-light px-3 py-1 rounded-lg">
                          <span className="text-xs font-semibold text-accent">
                            {(alert.alert_type || 'ALERT').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="w-4 h-4 text-accent" />
                          <span className="text-light">
                            {alert.origin || 'Unknown'} → {alert.destination || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="w-4 h-4 text-accent" />
                          <span className="text-light">
                            {formatHours(alert.hours_to_sla ?? 0)} to SLA
                          </span>
                        </div>
                      </div>

                      {alert.top_risk_factors && alert.top_risk_factors.length > 0 && (
                        <RiskFactorsList factors={alert.top_risk_factors} />
                      )}

                      {alert.action_required && (
                        <div className="glass-light p-3 rounded-lg">
                          <p className="text-sm text-white">
                            <span className="font-semibold text-accent">Action Required:</span>{' '}
                            {alert.action_required}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/shipments/${alert.shipment_id}`)}
                      className="btn-primary flex items-center space-x-2 whitespace-nowrap"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-light">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredAlerts.length)} of {filteredAlerts.length} alerts
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 glass-light rounded-lg hover:text-accent disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-light px-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 glass-light rounded-lg hover:text-accent disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
