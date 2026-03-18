import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import type { Shipment } from '../types/shipment';

export const useShipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getShipments();
      setShipments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  return {
    shipments,
    loading,
    error,
    refetch: fetchShipments,
  };
};
