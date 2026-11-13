import type { Day } from './dates';

export type Place = { name: string; lat: number | null; lon: number | null };

/** [kind] is one of sun, partly, cloud, rain, storm, fog, snow, wind. */
export type WeatherKind = 'sun' | 'partly' | 'cloud' | 'rain' | 'storm' | 'fog' | 'snow' | 'wind';
export type Weather = { kind: WeatherKind; temp: number | null };

/** One journal page. The private part (text, mood, tags, place, weather, photos) is sealed on disk. */
export type Entry = {
  id: string;
  date: Day;
  created: number;
  updated: number;
  kural: number;
  lens: number;
  period: string;
  mood: string | null;
  text: string;
  tags: string[];
  starred: boolean;
  place: Place | null;
  weather: Weather | null;
  /** Ids of photos kept, sealed, in the photos folder. */
  photos: string[];
  /** Voice notes and videos, sealed the same way. */
  audio: string[];
  videos: string[];
  /** The question as it was asked, in both languages (pages written before 1.0.7 have none). */
  q?: { en: string; ta: string };
};

export const isTamil = (text: string) => /[஀-௿]/.test(text);
export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
