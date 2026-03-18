import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, MapPin, Calendar, Truck, CircleAlert as AlertCircle, TrendingUp, Clock, Thermometer, Wind } from 'lucide-react';
import { apiService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useShipmentContext } from '../contexts/ShipmentContext';
import { RiskTier } from '../components/Risk/RiskTier';
import { RiskIndicator } from '../components/Risk/RiskIndicator';
import { RiskFactorsList } from '../components/Risk/RiskFactorsList';
import { generateShipmentReportPDF } from '../services/exportService';
import { AiAdvisor } from '../components/AiAdvisor';
import { formatDate, formatNumber } from '../utils/formatters';
import type { Shipment } from '../types/shipment';

export const ShipmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { alerts, recommendations } = useShipmentContext();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipment = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await apiService.getShipmentById(id);
        if (data) {
          setShipment(data);
        } else {
          addNotification('error', 'Shipment not found');
          navigate('/shipments');
        }
      } catch (error) {
        addNotification('error', 'Failed to load shipment details');
      } finally {
        setLoading(false);
      }
    };

    fetchShipment();
  }, [id, navigate, addNotification]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!shipment) {
    return null;
  }

  const riskTier =
    shipment.delay_probability >= 0.9
      ? 'CRITICAL'
      : shipment.delay_probability >= 0.6
      ? 'HIGH'
      : shipment.delay_probability >= 0.3
      ? 'MEDIUM'
      : 'LOW';

  const riskFactors = [
    `Weather: ${shipment.weather_condition} (severity: ${shipment.weather_severity_score}/10)`,
    `Traffic congestion: Level ${shipment.traffic_congestion_level}/10`,
    `Port congestion: ${shipment.port_congestion_score}/10`,
    `Carrier reliability: ${(shipment.carrier_reliability_score * 100).toFixed(0)}%`,
    `Historical delay rate: ${(shipment.historical_delay_rate * 100).toFixed(1)}%`,
    `Route risk score: ${(shipment.route_risk_score * 100).toFixed(0)}%`,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/shipments')}
          className="flex items-center space-x-2 text-light hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Shipments</span>
        </button>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{shipment.shipment_id}</h1>
            <RiskTier tier={riskTier} probability={shipment.delay_probability} />
          </div>
          <div className="glass-light px-4 py-2 rounded-lg">
            <span className="text-sm font-semibold text-accent">{shipment.shipment_status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-light p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-white">Route</h3>
                </div>
                <p className="text-light mb-1">
                  <span className="font-semibold text-white">From:</span> {shipment.origin}
                </p>
                <p className="text-light mb-1">
                  <span className="font-semibold text-white">To:</span> {shipment.destination}
                </p>
                <p className="text-light">
                  <span className="font-semibold text-white">Mode:</span> {shipment.transport_mode}
                </p>
              </div>

              <div className="glass-light p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Truck className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-white">Carrier</h3>
                </div>
                <p className="text-light mb-1">
                  <span className="font-semibold text-white">Name:</span> {shipment.carrier}
                </p>
                <p className="text-light mb-1">
                  <span className="font-semibold text-white">Reliability:</span>{' '}
                  {(shipment.carrier_reliability_score * 100).toFixed(0)}%
                </p>
                <p className="text-light">
                  <span className="font-semibold text-white">Delay History:</span>{' '}
                  {(shipment.historical_delay_rate * 100).toFixed(1)}%
                </p>
              </div>

              <div className="glass-light p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-white">Timeline</h3>
                </div>
                <p className="text-light mb-1">
                  <span className="font-semibold text-white">Shipped:</span>{' '}
                  {formatDate(shipment.shipment_date)}
                </p>
                <p className="text-light mb-1">
                  <span className="font-semibold text-white">ETA:</span>{' '}
                  {formatDate(shipment.planned_eta)}
                </p>
                <p className="text-light">
                  <span className="font-semibold text-white">Transit:</span>{' '}
                  {shipment.days_in_transit}/{shipment.planned_transit_days} days
                </p>
              </div>

              <div className="glass-light p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Package className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-white">Package Info</h3>
                </div>
                <p className="text-light mb-1">
                  <span className="font-semibold text-white">Weight:</span>{' '}
                  {formatNumber(shipment.package_weight_kg)} kg
                </p>
                <p className="text-light mb-1">
                  <span className="font-semibold text-white">Stops:</span> {shipment.num_stops}
                </p>
                <p className="text-light">
                  <span className="font-semibold text-white">Customs:</span>{' '}
                  {shipment.customs_clearance_flag ? 'Required' : 'Not Required'}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-light p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Thermometer className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-white">Weather Conditions</h3>
                </div>
                <p className="text-light mb-1">
                  <span className="font-semibold text-white">Condition:</span>{' '}
                  {shipment.weather_condition}
                </p>
                <p className="text-light">
                  <span className="font-semibold text-white">Severity:</span>{' '}
                  {shipment.weather_severity_score}/10
                </p>
              </div>

              <div className="glass-light p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Wind className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-white">Disruptions</h3>
                </div>
                <p className="text-light mb-1">
                  <span className="font-semibold text-white">Type:</span>{' '}
                  {shipment.disruption_type}
                </p>
                {shipment.disruption_type !== 'None' && (
                  <p className="text-light">
                    <span className="font-semibold text-white">Impact:</span>{' '}
                    {shipment.disruption_impact_score}/10
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-gradient-to-br from-primary/20 to-secondary/20">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">
                Delay Risk Score
              </h3>
              <div className="flex justify-center">
                <RiskIndicator current={shipment.delay_probability} size="lg" showTrend={false} />
              </div>
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-white">Estimated Impact</h3>
              </div>
              {shipment.is_delayed ? (
                <p className="text-red-400 font-semibold">
                  Delayed by {shipment.actual_delay_hours.toFixed(1)} hours
                </p>
              ) : shipment.delay_probability >= 0.5 ? (
                <p className="text-orange-400 font-semibold">High risk of delay</p>
              ) : (
                <p className="text-green-400 font-semibold">On track for on-time delivery</p>
              )}
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-white">Progress</h3>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (shipment.days_in_transit / shipment.planned_transit_days) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-light">
                {((shipment.days_in_transit / shipment.planned_transit_days) * 100).toFixed(0)}%
                complete
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(`/recommendations?shipmentId=${shipment.shipment_id}`)}
            className="btn-primary flex-1"
          >
            View Recommendations
          </button>
          <button
            onClick={() => navigate(`/live-tracking?shipmentId=${shipment.shipment_id}`)}
            className="btn-secondary flex-1"
          >
            Track Shipment
          </button>
          <button
            onClick={() => {
              const shipmentAlerts = alerts.filter(a => a.shipment_id === shipment.shipment_id);
              const shipmentRecs = recommendations.filter(r => r.shipment_id === shipment.shipment_id);
              generateShipmentReportPDF(shipment, shipmentAlerts, shipmentRecs);
              addNotification('success', `Exporting report for ${shipment.shipment_id}...`);
            }}
            className="glass-light px-6 py-2 rounded-lg hover:bg-white/10 transition-colors text-light hover:text-white"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* AI Advisor */}
      <AiAdvisor shipmentId={shipment.shipment_id} />
    </motion.div>
  );
};
