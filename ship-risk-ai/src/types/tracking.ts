import type { RiskTier } from './alert';
import type { TransportMode } from './shipment';

// ── Map & Geo ───────────────────────────────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  northEast: LatLng;
  southWest: LatLng;
}

// ── Weather ─────────────────────────────────────────────────────────────────
export interface WeatherData {
  latitude: number;
  longitude: number;
  temperature: number;
  wind_speed: number;
  weather_code: number;
  cloud_cover: number;
  description: string;
  icon: string;
}

export interface WeatherForecast {
  current: WeatherData;
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    cloud_cover: number[];
  };
}

// ── Aircraft Tracking ───────────────────────────────────────────────────────
export interface AircraftPosition {
  icao24: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  on_ground: boolean;
  last_update: number;
}

// ── Vessel Tracking ─────────────────────────────────────────────────────────
export interface VesselPosition {
  mmsi: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  destination: string;
  ship_type: string;
  last_update: string;
}

// ── Route ───────────────────────────────────────────────────────────────────
export interface RouteInfo {
  distance_km: number;
  duration_hours: number;
  geometry: [number, number][]; // [lat, lng] pairs
}

// ── Shipment Tracking (extended for map) ────────────────────────────────────
export interface TrackedShipment {
  shipment_id: string;
  origin: string;
  destination: string;
  carrier: string;
  transport_mode: TransportMode;
  shipment_status: string;
  delay_probability: number;
  risk_tier: RiskTier;
  planned_eta: string;
  days_in_transit: number;
  planned_transit_days: number;
  // Geo positions (computed from city names)
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  current_lat: number;
  current_lng: number;
  // Risk details
  weather_condition: string;
  weather_severity_score: number;
  disruption_type: string;
  disruption_impact_score: number;
  top_risk_factors: string[];
  // Tracking meta
  last_update: string;
}

// ── Event Feed ──────────────────────────────────────────────────────────────
export type TrackingEventType = 'position_update' | 'alert' | 'weather' | 'intervention' | 'status_change';

export interface TrackingEvent {
  id: string;
  type: TrackingEventType;
  shipment_id: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

// ── Live Stats ──────────────────────────────────────────────────────────────
export interface TrackingStats {
  total_active: number;
  by_risk_tier: Record<RiskTier, number>;
  by_transport_mode: Record<string, number>;
  alerts_today: number;
  avg_delay_probability: number;
}

// ── Layer Visibility ────────────────────────────────────────────────────────
export interface LayerVisibility {
  shipments: boolean;
  weather: boolean;
  routes: boolean;
  aircraft: boolean;
  vessels: boolean;
}

// ── Weather code descriptions ───────────────────────────────────────────────
export const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Fog', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌦️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  71: { description: 'Slight snow', icon: '🌨️' },
  73: { description: 'Moderate snow', icon: '🌨️' },
  75: { description: 'Heavy snow', icon: '❄️' },
  77: { description: 'Snow grains', icon: '❄️' },
  80: { description: 'Slight rain showers', icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌧️' },
  82: { description: 'Violent rain showers', icon: '⛈️' },
  85: { description: 'Slight snow showers', icon: '🌨️' },
  86: { description: 'Heavy snow showers', icon: '❄️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

// ── City coordinates lookup ─────────────────────────────────────────────────
export const CITY_COORDS: Record<string, LatLng> = {
  'Shanghai': { lat: 31.2304, lng: 121.4737 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Hamburg': { lat: 53.5511, lng: 9.9937 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Rotterdam': { lat: 51.9244, lng: 4.4777 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Los Angeles': { lat: 33.9425, lng: -118.4081 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'Busan': { lat: 35.1796, lng: 129.0756 },
  'Hong Kong': { lat: 22.3193, lng: 114.1694 },
  'Antwerp': { lat: 51.2194, lng: 4.4025 },
  'Jeddah': { lat: 21.4858, lng: 39.1925 },
  'Santos': { lat: -23.9608, lng: -46.3336 },
  'Colombo': { lat: 6.9271, lng: 79.8612 },
  'Felixstowe': { lat: 51.9536, lng: 1.3511 },
  'Cape Town': { lat: -33.9249, lng: 18.4241 },
  'Vancouver': { lat: 49.2827, lng: -123.1207 },
  'Melbourne': { lat: -37.8136, lng: 144.9631 },
  'Shenzhen': { lat: 22.5431, lng: 114.0579 },
  'Ningbo': { lat: 29.8683, lng: 121.5440 },
  'Guangzhou': { lat: 23.1291, lng: 113.2644 },
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Ho Chi Minh City': { lat: 10.8231, lng: 106.6297 },
  'Jakarta': { lat: -6.2088, lng: 106.8456 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Karachi': { lat: 24.8607, lng: 67.0011 },
  'Laem Chabang': { lat: 13.0830, lng: 100.8835 },
  'Port Klang': { lat: 3.0006, lng: 101.3929 },
  'Tanjung Pelepas': { lat: 1.3625, lng: 103.5486 },
  'Piraeus': { lat: 37.9475, lng: 23.6372 },
  'Valencia': { lat: 39.4699, lng: -0.3763 },
  'Barcelona': { lat: 41.3851, lng: 2.1734 },
  'Genoa': { lat: 44.4056, lng: 8.9463 },
  'Le Havre': { lat: 49.4944, lng: 0.1079 },
  'Bremerhaven': { lat: 53.5396, lng: 8.5809 },
  'Gdansk': { lat: 54.3520, lng: 18.6466 },
  'Algeciras': { lat: 36.1408, lng: -5.4536 },
  'Durban': { lat: -29.8587, lng: 31.0218 },
  'Mombasa': { lat: -4.0435, lng: 39.6682 },
  'Dar es Salaam': { lat: -6.7924, lng: 39.2083 },
  'Lagos': { lat: 6.5244, lng: 3.3792 },
  'Abidjan': { lat: 5.3600, lng: -4.0083 },
  'Casablanca': { lat: 33.5731, lng: -7.5898 },
  'Alexandria': { lat: 31.2001, lng: 29.9187 },
  'Haifa': { lat: 32.7940, lng: 34.9896 },
  'Istanbul': { lat: 41.0082, lng: 28.9784 },
  'Novorossiysk': { lat: 44.7234, lng: 37.7686 },
  'Callao': { lat: -12.0568, lng: -77.1185 },
  'Cartagena': { lat: 10.3910, lng: -75.5144 },
  'Manzanillo': { lat: 19.0543, lng: -104.3157 },
  'Houston': { lat: 29.7604, lng: -95.3698 },
  'Savannah': { lat: 32.0809, lng: -81.0912 },
  'Charleston': { lat: 32.7765, lng: -79.9311 },
  'Norfolk': { lat: 36.8508, lng: -76.2859 },
  'Newark': { lat: 40.7357, lng: -74.1724 },
  'Montreal': { lat: 45.5017, lng: -73.5673 },
  'Seattle': { lat: 47.6062, lng: -122.3321 },
  'Oakland': { lat: 37.8044, lng: -122.2712 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'Dallas': { lat: 32.7767, lng: -96.7970 },
  'Miami': { lat: 25.7617, lng: -80.1918 },
  'Atlanta': { lat: 33.7490, lng: -84.3880 },
  'Denver': { lat: 39.7392, lng: -104.9903 },
  'Phoenix': { lat: 33.4484, lng: -112.0740 },
  'Detroit': { lat: 42.3314, lng: -83.0458 },
  'Minneapolis': { lat: 44.9778, lng: -93.2650 },
  'Boston': { lat: 42.3601, lng: -71.0589 },
  'Philadelphia': { lat: 39.9526, lng: -75.1652 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Berlin': { lat: 52.5200, lng: 13.4050 },
  'Madrid': { lat: 40.4168, lng: -3.7038 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  'Brussels': { lat: 50.8503, lng: 4.3517 },
  'Zurich': { lat: 47.3769, lng: 8.5417 },
  'Vienna': { lat: 48.2082, lng: 16.3738 },
  'Warsaw': { lat: 52.2297, lng: 21.0122 },
  'Prague': { lat: 50.0755, lng: 14.4378 },
  'Stockholm': { lat: 59.3293, lng: 18.0686 },
  'Oslo': { lat: 59.9139, lng: 10.7522 },
  'Copenhagen': { lat: 55.6761, lng: 12.5683 },
  'Helsinki': { lat: 60.1699, lng: 24.9384 },
  'Moscow': { lat: 55.7558, lng: 37.6173 },
  'Beijing': { lat: 39.9042, lng: 116.4074 },
  'Seoul': { lat: 37.5665, lng: 126.9780 },
  'Taipei': { lat: 25.0330, lng: 121.5654 },
  'Manila': { lat: 14.5995, lng: 120.9842 },
  'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Dhaka': { lat: 23.8103, lng: 90.4125 },
  'Auckland': { lat: -36.8485, lng: 174.7633 },
  'Suez': { lat: 29.9668, lng: 32.5498 },
  'Panama City': { lat: 8.9824, lng: -79.5199 },
  'Lima': { lat: -12.0464, lng: -77.0428 },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
  'Johannesburg': { lat: -26.2041, lng: 28.0473 },
  'Nairobi': { lat: -1.2921, lng: 36.8219 },
  'Cairo': { lat: 30.0444, lng: 31.2357 },
};
