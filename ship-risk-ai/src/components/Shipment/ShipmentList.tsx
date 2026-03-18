import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Shipment } from '../../types/shipment';
import { ShipmentCard } from './ShipmentCard';
import { ShipmentDetail } from './ShipmentDetail';

interface ShipmentListProps {
  shipments: Shipment[];
  loading?: boolean;
}

export const ShipmentList: React.FC<ShipmentListProps> = ({ shipments, loading = false }) => {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-48 bg-white/5 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-light text-lg">No shipments found</p>
        <p className="text-sm text-light mt-2">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {shipments.map((shipment, index) => (
            <motion.div
              key={shipment.shipment_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <ShipmentCard
                shipment={shipment}
                onClick={() => setSelectedShipment(shipment)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedShipment && (
          <ShipmentDetail
            shipment={selectedShipment}
            onClose={() => setSelectedShipment(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
