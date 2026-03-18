import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Search, ListFilter as Filter, ArrowRight } from 'lucide-react';
import { useShipmentContext } from '../contexts/ShipmentContext';
import { RiskTier } from '../components/Risk/RiskTier';
import { formatDate } from '../utils/formatters';

export const Shipments: React.FC = () => {
  const { shipments, loading } = useShipmentContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredShipments = shipments.filter((s: any) => {
    const matchesSearch = s.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || s.shipment_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-96 bg-white/5 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">All Shipments</h2>
        <p className="text-light">Monitor and track all active shipments</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
            placeholder="Search by ID, origin, or destination..."
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-light" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredShipments.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="w-12 h-12 text-light mx-auto mb-4" />
            <p className="text-light">No shipments found</p>
          </div>
        ) : (
          filteredShipments.map((shipment: any, index: number) => (
            <motion.div
              key={shipment.shipment_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:border-accent cursor-pointer"
              onClick={() => navigate(`/shipments/${shipment.shipment_id}`)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white">{shipment.shipment_id}</h3>
                    <RiskTier tier={shipment.delay_probability >= 0.9 ? 'CRITICAL' : shipment.delay_probability >= 0.6 ? 'HIGH' : shipment.delay_probability >= 0.3 ? 'MEDIUM' : 'LOW'} probability={shipment.delay_probability} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-light">Route</span>
                      <p className="text-white font-medium">{shipment.origin} → {shipment.destination}</p>
                    </div>
                    <div>
                      <span className="text-light">Carrier</span>
                      <p className="text-white font-medium">{shipment.carrier}</p>
                    </div>
                    <div>
                      <span className="text-light">Status</span>
                      <p className="text-white font-medium">{shipment.shipment_status}</p>
                    </div>
                    <div>
                      <span className="text-light">ETA</span>
                      <p className="text-white font-medium">{formatDate(shipment.planned_eta)}</p>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-accent hidden lg:block" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
