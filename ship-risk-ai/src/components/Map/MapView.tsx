import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { TrackedShipment, LayerVisibility } from '../../types/tracking';
import { RISK_TIER_COLORS } from '../../utils/constants';
import { generateGreatCircleRoute } from '../../services/route';

// Fix Leaflet default marker icon path issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── Transport mode icons ────────────────────────────────────────────────────
const TRANSPORT_ICONS: Record<string, string> = {
  Air: '✈️',
  Sea: '🚢',
  Road: '🚚',
  Rail: '🚂',
};

function createShipmentIcon(riskTier: string, transportMode: string): L.DivIcon {
  const color = RISK_TIER_COLORS[riskTier as keyof typeof RISK_TIER_COLORS] || '#6b7280';
  const emoji = TRANSPORT_ICONS[transportMode] || '📦';

  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        font-size: 18px;
        cursor: pointer;
        ${riskTier === 'CRITICAL' ? 'animation: pulse-critical 2s infinite;' : ''}
      ">${emoji}</div>
    `,
    className: 'shipment-marker-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function createWeatherIcon(icon: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="font-size: 24px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">${icon}</div>`,
    className: 'weather-marker-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface MapViewProps {
  shipments: TrackedShipment[];
  layers: LayerVisibility;
  selectedId: string | null;
  onSelectShipment: (shipment: TrackedShipment | null) => void;
  searchCenter?: [number, number] | null;
}

const MapView: React.FC<MapViewProps> = ({ shipments, layers, selectedId, onSelectShipment, searchCenter }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const routesRef = useRef<L.LayerGroup>(L.layerGroup());
  const weatherRef = useRef<L.LayerGroup>(L.layerGroup());

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      worldCopyJump: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersRef.current.addTo(map);
    routesRef.current.addTo(map);
    weatherRef.current.addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when shipments or layers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.clearLayers();
    routesRef.current.clearLayers();
    weatherRef.current.clearLayers();

    if (!layers.shipments) return;

    shipments.forEach((s) => {
      // Current position marker
      const icon = createShipmentIcon(s.risk_tier, s.transport_mode);
      const marker = L.marker([s.current_lat, s.current_lng], { icon });

      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${s.shipment_id}</div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">
            ${s.origin} → ${s.destination}
          </div>
          <div style="display: flex; gap: 8px; font-size: 12px; margin-bottom: 4px;">
            <span style="
              background: ${RISK_TIER_COLORS[s.risk_tier as keyof typeof RISK_TIER_COLORS]};
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-weight: 600;
            ">${s.risk_tier}</span>
            <span>${s.transport_mode}</span>
            <span>${s.carrier}</span>
          </div>
          <div style="font-size: 12px; color: #9ca3af;">
            Delay: ${(s.delay_probability * 100).toFixed(0)}% · ETA: ${s.planned_eta}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => onSelectShipment(s));

      // Highlight selected marker
      if (selectedId === s.shipment_id) {
        marker.setZIndexOffset(1000);
      }

      markersRef.current.addLayer(marker);

      // Draw route
      if (layers.routes) {
        const routePoints = generateGreatCircleRoute(
          s.origin_lat, s.origin_lng,
          s.dest_lat, s.dest_lng,
          30
        );

        const routeColor = RISK_TIER_COLORS[s.risk_tier as keyof typeof RISK_TIER_COLORS] || '#6b7280';
        const polyline = L.polyline(routePoints as L.LatLngExpression[], {
          color: routeColor,
          weight: 2,
          opacity: 0.5,
          dashArray: '8 4',
        });

        routesRef.current.addLayer(polyline);

        // Origin marker (small circle)
        const originCircle = L.circleMarker([s.origin_lat, s.origin_lng], {
          radius: 4,
          color: '#ffffff',
          fillColor: routeColor,
          fillOpacity: 0.8,
          weight: 1,
        });
        originCircle.bindTooltip(s.origin, { direction: 'top', offset: [0, -5] });
        routesRef.current.addLayer(originCircle);

        // Destination marker (small circle)
        const destCircle = L.circleMarker([s.dest_lat, s.dest_lng], {
          radius: 4,
          color: '#ffffff',
          fillColor: routeColor,
          fillOpacity: 0.8,
          weight: 1,
        });
        destCircle.bindTooltip(s.destination, { direction: 'top', offset: [0, -5] });
        routesRef.current.addLayer(destCircle);
      }

      // Weather icons at origin/destination
      if (layers.weather && s.weather_condition && s.weather_condition !== 'Clear') {
        const weatherEmoji =
          s.weather_condition === 'Storm' ? '⛈️' :
          s.weather_condition === 'Heavy Rain' ? '🌧️' :
          s.weather_condition === 'Rain' ? '🌦️' :
          s.weather_condition === 'Fog' ? '🌫️' :
          s.weather_condition === 'Snow' ? '🌨️' :
          s.weather_condition === 'Blizzard' ? '❄️' : '';

        if (weatherEmoji) {
          const wIcon = createWeatherIcon(weatherEmoji);
          const wMarker = L.marker(
            [s.current_lat + 0.5, s.current_lng + 0.5],
            { icon: wIcon, interactive: false }
          );
          weatherRef.current.addLayer(wMarker);
        }
      }
    });
  }, [shipments, layers, selectedId, onSelectShipment]);

  // Pan to search result
  useEffect(() => {
    if (searchCenter && mapRef.current) {
      mapRef.current.flyTo(searchCenter, 8, { duration: 1.2 });
    }
  }, [searchCenter]);

  // Pan to selected shipment
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const s = shipments.find((sh) => sh.shipment_id === selectedId);
    if (s) {
      mapRef.current.flyTo([s.current_lat, s.current_lng], 6, { duration: 0.8 });
    }
  }, [selectedId, shipments]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
};

export default React.memo(MapView);
