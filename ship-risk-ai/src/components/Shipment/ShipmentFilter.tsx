import React from 'react';
import { motion } from 'framer-motion';
import { ListFilter as Filter, X } from 'lucide-react';
import type { RiskTier } from '../../types/alert';

interface ShipmentFilterProps {
  filters: {
    riskTier: RiskTier | 'ALL';
    status: string;
    carrier: string;
    transportMode: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export const ShipmentFilter: React.FC<ShipmentFilterProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters =
    filters.riskTier !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.carrier !== 'ALL' ||
    filters.transportMode !== 'ALL';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-sm text-accent hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-light mb-2">Risk Tier</label>
          <select
            value={filters.riskTier}
            onChange={(e) => onFilterChange('riskTier', e.target.value)}
            className="input-field"
          >
            <option value="ALL">All Tiers</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-light mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="input-field"
          >
            <option value="ALL">All Status</option>
            <option value="In Transit">In Transit</option>
            <option value="Customs Hold">Customs Hold</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delayed">Delayed</option>
            <option value="At Port">At Port</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-light mb-2">Carrier</label>
          <select
            value={filters.carrier}
            onChange={(e) => onFilterChange('carrier', e.target.value)}
            className="input-field"
          >
            <option value="ALL">All Carriers</option>
            <option value="FedEx">FedEx</option>
            <option value="DHL">DHL</option>
            <option value="UPS">UPS</option>
            <option value="Maersk">Maersk</option>
            <option value="DB Schenker">DB Schenker</option>
            <option value="XPO Logistics">XPO Logistics</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-light mb-2">Transport Mode</label>
          <select
            value={filters.transportMode}
            onChange={(e) => onFilterChange('transportMode', e.target.value)}
            className="input-field"
          >
            <option value="ALL">All Modes</option>
            <option value="Air">Air</option>
            <option value="Sea">Sea</option>
            <option value="Road">Road</option>
            <option value="Rail">Rail</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};
