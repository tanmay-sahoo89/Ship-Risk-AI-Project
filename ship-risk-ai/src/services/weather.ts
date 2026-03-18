import type { WeatherData, WeatherForecast } from '../types/tracking';
import { WEATHER_CODES } from '../types/tracking';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

function decodeWeatherCode(code: number): { description: string; icon: string } {
  return WEATHER_CODES[code] ?? { description: 'Unknown', icon: '❓' };
}

export async function getWeather(lat: number, lng: number): Promise<WeatherData> {
  const resp = await fetch(
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,cloud_cover` +
    `&timezone=auto`
  );
  if (!resp.ok) throw new Error(`Weather API error: ${resp.status}`);
  const data = await resp.json();

  const current = data.current;
  const decoded = decodeWeatherCode(current.weather_code);

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    temperature: current.temperature_2m,
    wind_speed: current.wind_speed_10m,
    weather_code: current.weather_code,
    cloud_cover: current.cloud_cover,
    description: decoded.description,
    icon: decoded.icon,
  };
}

export async function getWeatherForecast(lat: number, lng: number): Promise<WeatherForecast> {
  const resp = await fetch(
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,cloud_cover` +
    `&hourly=temperature_2m,precipitation,cloud_cover` +
    `&forecast_days=2&timezone=auto`
  );
  if (!resp.ok) throw new Error(`Weather API error: ${resp.status}`);
  const data = await resp.json();

  const current = data.current;
  const decoded = decodeWeatherCode(current.weather_code);

  return {
    current: {
      latitude: data.latitude,
      longitude: data.longitude,
      temperature: current.temperature_2m,
      wind_speed: current.wind_speed_10m,
      weather_code: current.weather_code,
      cloud_cover: current.cloud_cover,
      description: decoded.description,
      icon: decoded.icon,
    },
    hourly: data.hourly,
  };
}

// Batch weather for multiple locations (sequential to respect rate limits)
export async function getWeatherBatch(
  locations: { lat: number; lng: number; id: string }[]
): Promise<Map<string, WeatherData>> {
  const results = new Map<string, WeatherData>();

  // Fetch in small batches of 5
  for (let i = 0; i < locations.length; i += 5) {
    const batch = locations.slice(i, i + 5);
    const promises = batch.map(async (loc) => {
      try {
        const weather = await getWeather(loc.lat, loc.lng);
        results.set(loc.id, weather);
      } catch {
        // Skip failed locations
      }
    });
    await Promise.all(promises);
  }

  return results;
}
