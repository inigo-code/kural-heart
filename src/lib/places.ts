// Where and in what weather a page was written, on request. The position comes from the phone (coarse, about a
// neighbourhood). The place name comes from Android's geocoder. The weather comes from Open-Meteo, which needs no
// account and gets only the rounded position.

import * as Location from 'expo-location';

import type { Place, Weather, WeatherKind } from './types';

export async function askLocation(): Promise<boolean> {
  const p = await Location.requestForegroundPermissionsAsync();
  return p.granted;
}

export async function here(): Promise<{ lat: number; lon: number } | null> {
  const p = await Location.getForegroundPermissionsAsync();
  if (!p.granted && !(await askLocation())) return null;
  try {
    const fresh = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
      new Promise<null>((r) => setTimeout(() => r(null), 12000)),
    ]);
    const pos = fresh ?? (await Location.getLastKnownPositionAsync());
    return pos ? { lat: pos.coords.latitude, lon: pos.coords.longitude } : null;
  } catch {
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    return last ? { lat: last.coords.latitude, lon: last.coords.longitude } : null;
  }
}

export async function placeName(lat: number, lon: number): Promise<string | null> {
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (!a) return null;
    const parts = [a.district ?? a.street, a.city ?? a.subregion].filter((x): x is string => !!x);
    const unique = [...new Set(parts)];
    return unique.length ? unique.join(', ') : (a.region ?? null);
  } catch {
    return null;
  }
}

/** Current weather from Open-Meteo, mapped from WMO codes to the app's eight kinds. */
export async function weatherAt(lat: number, lon: number): Promise<Weather | null> {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&current=temperature_2m,weather_code,wind_speed_10m`,
    );
    if (!r.ok) return null;
    const o = (await r.json()) as { current: { temperature_2m: number; weather_code: number; wind_speed_10m?: number } };
    const code = o.current.weather_code;
    const wind = o.current.wind_speed_10m ?? 0;
    let kind: WeatherKind = 'cloud';
    if (code === 0) kind = wind > 35 ? 'wind' : 'sun';
    else if (code === 1 || code === 2) kind = 'partly';
    else if (code === 3) kind = 'cloud';
    else if (code === 45 || code === 48) kind = 'fog';
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) kind = 'rain';
    else if ((code >= 71 && code <= 77) || code === 85 || code === 86) kind = 'snow';
    else if (code >= 95 && code <= 99) kind = 'storm';
    return { kind, temp: o.current.temperature_2m };
  } catch {
    return null;
  }
}

/** Place and weather together, for a page. */
export async function placeAndWeather(): Promise<{ place: Place | null; weather: Weather | null }> {
  const pos = await here();
  if (!pos) return { place: null, weather: null };
  const [name, weather] = await Promise.all([placeName(pos.lat, pos.lon), weatherAt(pos.lat, pos.lon)]);
  return { place: name ? { name, lat: Math.round(pos.lat * 100) / 100, lon: Math.round(pos.lon * 100) / 100 } : null, weather };
}

export const WEATHER_KINDS: WeatherKind[] = ['sun', 'partly', 'cloud', 'rain', 'storm', 'fog', 'snow', 'wind'];
