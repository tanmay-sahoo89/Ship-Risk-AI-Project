import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { useTracking } from '../hooks/useTracking';
import MapView from '../components/Map/MapView';
import LayerControls from '../components/Map/LayerControls';
import LiveStats from '../components/Tracking/LiveStats';
import SearchBar from '../components/Tracking/SearchBar';
import TrackingDetails from '../components/Tracking/TrackingDetails';
import EventFeed from '../components/Tracking/EventFeed';
import type { TrackedShipment, LayerVisibility } from '../types/tracking';
import 'leaflet/dist/leaflet.css';
import '../styles/tracking.css';

export const LiveTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const shipmentIdParam = searchParams.get('shipmentId');
  const { trackedShipments, stats, events, loading, error, refreshTracking } = useTracking();

  const [selectedShipment, setSelectedShipment] = useState<TrackedShipment | null>(null);
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);

  // Auto-select shipment from URL param
  useEffect(() => {
    if (shipmentIdParam && trackedShipments.length > 0 && !selectedShipment) {
      const found = trackedShipments.find((s) => s.shipment_id === shipmentIdParam);
      if (found) {
        setSelectedShipment(found);
        setSearchCenter([found.current_lat, found.current_lng]);
      }
    }
  }, [shipmentIdParam, trackedShipments, selectedShipment]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layers, setLayers] = useState<LayerVisibility>({
    shipments: true,
    weather: true,
    routes: true,
    aircraft: false,
    vessels: false,
  });

  const handleToggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleSelectShipment = useCallback((shipment: TrackedShipment | null) => {
    setSelectedShipment(shipment);
    if (shipment) {
      setSearchCenter([shipment.current_lat, shipment.current_lng]);
    }
  }, []);

  const handleSearchSelect = useCallback((shipment: TrackedShipment) => {
    setSelectedShipment(shipment);
    setSearchCenter([shipment.current_lat, shipment.current_lng]);
  }, []);

  const handleEventClick = useCallback(
    (shipmentId: string) => {
      const s = trackedShipments.find((sh) => sh.shipment_id === shipmentId);
      if (s) handleSelectShipment(s);
    },
    [trackedShipments, handleSelectShipment]
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-risk-high font-semibold">Failed to load tracking data</p>
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <button onClick={refreshTracking} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[var(--bg-primary)]' : ''}`}
    >
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--border-color)] px-4 py-3 space-y-3">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--text-heading)]">Live Tracking</h1>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshTracking}
              className="p-2 rounded-lg hover:bg-[var(--bg-glass-light)] transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg hover:bg-[var(--bg-glass-light)] transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <Maximize2 className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <LiveStats stats={stats} loading={loading} />

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-full sm:w-72">
            <SearchBar shipments={trackedShipments} onSelectShipment={handleSearchSelect} />
          </div>
          <LayerControls layers={layers} onToggle={handleToggleLayer} />
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map */}
        <div className="flex-1 relative">
          {loading && trackedShipments.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent-color)]"></div>
                <p className="text-sm text-[var(--text-muted)]">Loading shipment data...</p>
              </div>
            </div>
          ) : (
            <MapView
              shipments={trackedShipments}
              layers={layers}
              selectedId={selectedShipment?.shipment_id ?? null}
              onSelectShipment={handleSelectShipment}
              searchCenter={searchCenter}
            />
          )}
        </div>

        {/* Sidebar - details panel */}
        <AnimatePresence>
          {selectedShipment && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-96 max-w-full border-l border-[var(--border-color)] bg-[var(--bg-primary)] overflow-hidden
                         hidden md:flex flex-col"
            >
              <TrackingDetails
                shipment={selectedShipment}
                onClose={() => setSelectedShipment(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile bottom sheet for details */}
        <AnimatePresence>
          {selectedShipment && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-[var(--bg-primary)] border-t border-[var(--border-color)] rounded-t-2xl shadow-2xl"
              style={{ maxHeight: '70vh' }}
            >
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 rounded-full bg-[var(--border-light)]" />
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 16px)' }}>
                <TrackingDetails
                  shipment={selectedShipment}
                  onClose={() => setSelectedShipment(null)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Event Feed ───────────────────────────────────────────── */}
      <div className="border-t border-[var(--border-color)] max-h-32 overflow-hidden">
        <EventFeed events={events} onEventClick={handleEventClick} />
      </div>
    </motion.div>
  );
};
