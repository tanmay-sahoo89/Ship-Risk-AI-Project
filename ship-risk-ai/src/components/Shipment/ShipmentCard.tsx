import React from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, Clock, TrendingUp } from 'lucide-react';
import type { Shipment } from '../../types/shipment';
import { RiskTier } from '../Risk/RiskTier';
import { formatDate } from '../../utils/formatters';

interface ShipmentCardProps {
  shipment: Shipment;
  onClick?: () => void;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, onClick }) => {
  const riskTier =
    shipment.delay_probability >= 0.9 ? 'CRITICAL' :
    shipment.delay_probability >= 0.6 ? 'HIGH' :
    shipment.delay_probability >= 0.3 ? 'MEDIUM' : 'LOW';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="card cursor-pointer hover:border-accent"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{shipment.shipment_id}</h3>
            <p className="text-sm text-light">{shipment.carrier}</p>
          </div>
        </div>
        <RiskTier tier={riskTier} probability={shipment.delay_probability} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-accent" />
          <div>
            <p className="text-xs text-light">Route</p>
            <p className="text-sm text-white font-medium">
              {shipment.origin} → {shipment.destination}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-accent" />
          <div>
            <p className="text-xs text-light">ETA</p>
            <p className="text-sm text-white font-medium">{formatDate(shipment.planned_eta)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between glass-light p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span className="text-sm text-light">Status:</span>
        </div>
        <span className="text-sm font-semibold text-white">{shipment.shipment_status}</span>
      </div>
    </motion.div>
  );
};
