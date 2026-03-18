import React from 'react';
import { motion } from 'framer-motion';
import { ShipmentAlerts } from '../components/Dashboard/ShipmentAlerts';

export const Alerts: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Active Alerts</h2>
        <p className="text-light">Monitor high-risk shipments requiring attention</p>
      </div>

      <ShipmentAlerts />
    </motion.div>
  );
};
