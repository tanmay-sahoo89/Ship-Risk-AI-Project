import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { useShipmentContext } from '../../contexts/ShipmentContext';

export const DelayProbabilityChart: React.FC = () => {
  const { shipments, loading } = useShipmentContext();

  if (loading || !shipments || shipments.length === 0) {
    return (
      <div className="card animate-pulse">
        <div className="h-80 bg-white/5 rounded"></div>
      </div>
    );
  }

  const probabilityBuckets = [
    { range: '0-20%', min: 0, max: 0.2, count: 0 },
    { range: '20-40%', min: 0.2, max: 0.4, count: 0 },
    { range: '40-60%', min: 0.4, max: 0.6, count: 0 },
    { range: '60-80%', min: 0.6, max: 0.8, count: 0 },
    { range: '80-100%', min: 0.8, max: 1.0, count: 0 },
  ];

  shipments.forEach((shipment) => {
    const prob = shipment.delay_probability;
    const bucket = probabilityBuckets.find(
      (b) => prob >= b.min && prob < b.max
    );
    if (bucket) bucket.count++;
  });

  const data = probabilityBuckets.map((bucket) => ({
    name: bucket.range,
    shipments: bucket.count,
  }));

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="card"
    >
      <h3 className="text-xl font-bold text-white mb-6">Delay Probability Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#BEA8A7" />
          <YAxis stroke="#BEA8A7" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 15, 15, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend wrapperStyle={{ color: '#BEA8A7' }} />
          <Bar
            dataKey="shipments"
            fill="#C09891"
            radius={[8, 8, 0, 0]}
            name="Shipments"
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
