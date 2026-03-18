import React from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Package, Calendar, Truck, CircleAlert as AlertCircle } from 'lucide-react';
import type { Shipment } from '../../types/shipment';
import { RiskTier } from '../Risk/RiskTier';
import { RiskFactorsList } from '../Risk/RiskFactorsList';
import { formatDate, formatNumber } from '../../utils/formatters';

interface ShipmentDetailProps {
  shipment: Shipment;
  onClose: () => void;
}

export const ShipmentDetail: React.FC<ShipmentDetailProps> = ({ shipment, onClose }) => {
  const riskTier =
    shipment.delay_probability >= 0.9 ? 'CRITICAL' :
    shipment.delay_probability >= 0.6 ? 'HIGH' :
    shipment.delay_probability >= 0.3 ? 'MEDIUM' : 'LOW';

  const riskFactors = [
    `Weather: ${shipment.weather_condition} (severity: ${shipment.weather_severity_score})`,
    `Traffic congestion: Level ${shipment.traffic_congestion_level}/10`,
    `Port congestion: ${shipment.port_congestion_score}/10`,
    `Carrier reliability: ${(shipment.carrier_reliability_score * 100).toFixed(0)}%`,
    `Historical delay rate: ${(shipment.historical_delay_rate * 100).toFixed(1)}%`,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{shipment.shipment_id}</h2>
            <RiskTier tier={riskTier} probability={shipment.delay_probability} />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-light" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-white">Route</h3>
              </div>
              <p className="text-light">
                {shipment.origin} → {shipment.destination}
              </p>
              <p className="text-sm text-light mt-1">
                Transport: {shipment.transport_mode}
              </p>
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Truck className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-white">Carrier</h3>
              </div>
              <p className="text-light">{shipment.carrier}</p>
              <p className="text-sm text-light mt-1">
                Reliability: {(shipment.carrier_reliability_score * 100).toFixed(0)}%
              </p>
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-white">Timeline</h3>
              </div>
              <p className="text-sm text-light">Shipped: {formatDate(shipment.shipment_date)}</p>
              <p className="text-sm text-light">ETA: {formatDate(shipment.planned_eta)}</p>
              <p className="text-sm text-light">
                Days in transit: {shipment.days_in_transit}/{shipment.planned_transit_days}
              </p>
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-white">Package Info</h3>
              </div>
              <p className="text-sm text-light">Weight: {formatNumber(shipment.package_weight_kg)} kg</p>
              <p className="text-sm text-light">Stops: {shipment.num_stops}</p>
              <p className="text-sm text-light">
                Customs: {shipment.customs_clearance_flag ? 'Required' : 'Not Required'}
              </p>
            </div>
          </div>

          <div className="glass-light p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-white">Risk Factors</h3>
            </div>
            <RiskFactorsList factors={riskFactors} />
          </div>

          {shipment.disruption_type !== 'None' && (
            <div className="glass-light p-4 rounded-lg border-l-4 border-risk-high">
              <h3 className="font-semibold text-white mb-2">Active Disruption</h3>
              <p className="text-light">{shipment.disruption_type}</p>
              <p className="text-sm text-light mt-1">
                Impact Score: {shipment.disruption_impact_score}/10
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button className="btn-primary flex-1">View Recommendations</button>
            <button className="btn-secondary flex-1">Track Shipment</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
