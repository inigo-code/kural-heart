import { useSyncExternalStore } from 'react';

import type { Day } from './dates';
import { storage } from './storage';

// Settings and small state. Nothing here is journal text; that lives sealed in the journal database.
// Kept in one JSON value, read synchronously at start, so every screen and the widget see the same thing.

export type ThemeMode = 'auto' | 'ivory' | 'midnight';
export type Accent = 'clay' | 'indigo' | 'green' | 'rose';
export type Translation = 'aiyar' | 'pope' | 'popeprose';

export type Settings = {
  onboarded: boolean;
  tamil: boolean;
  theme: ThemeMode;
  reduceMotion: boolean;
  reminderOn: boolean;
  /** Minutes after midnight. */
  reminderMinutes: number;
  lockOn: boolean;
  /** The folder picked for backups (a content:// tree), or ''. */
  backupFolder: string;
  backupNightly: boolean;
  /** Back up every night, to Drive and the folder alike (the switch on the Backup page). */
  autoBackup: boolean;
  lastBackup: number;
  startedOn: Day | '';
  lastLens: number;
  // Profile and customisation
  name: string;
  /** A photo id (sealed like page photos), or ''. */
  avatar: string;
  journalTitle: string;
  /** Text size as a percentage: 90, 100, 115 or 130. */
  textScale: number;
  accent: Accent;
  /** How the day's couplet is chosen: the welcome week then a shuffled pool, or random. */
  promptMode: 'daily' | 'random';
  translation: Translation;
  /** A line under each couplet spelling it out for readers who don't read Tamil. */
  pronounce: boolean;
  /** How it is spelled: simple English sounds, or scholarly ISO 15919 (letter for letter, with diacritics). */
  pronounceStyle: 'simple' | 'scholarly';
  /** The share card's look, remembered between shares. */
  shareTheme: string;
  /** Read-aloud voices (Android voice ids, '' for the best one found) and speed. */
  voiceTa: string;
  voiceEn: string;
  speechRate: number;
  /** Read the English after the Tamil. */
  readEnglish: boolean;
  autoDetails: boolean;
  // Online features, each off until turned on
  driveOn: boolean;
  driveEmail: string;
  lastDriveSync: number;
  updateCheck: boolean;
  whatsNewSeen: number;
  saved: number[];
  read: number[];
  /** A per-install number that shuffles the daily couplets, so two phones don't read in step. */
  seed: number;
  /** Which couplet each day got. Days the app wasn't opened have none. */
  dayLog: Record<Day, number>;
  /** Seals earned, by id, with the day earned. */
  seals: Record<string, Day>;
  hasPassphrase: boolean;
};

export const DEFAULTS: Settings = {
  onboarded: false,
  tamil: false,
  theme: 'auto',
  reduceMotion: false,
  reminderOn: true,
  reminderMinutes: 7 * 60,
  lockOn: false,
  backupFolder: '',
  backupNightly: false,
  autoBackup: true,
  lastBackup: 0,
  startedOn: '',
  lastLens: 0,
  name: '',
  avatar: '',
  journalTitle: '',
  textScale: 100,
  accent: 'clay',
  promptMode: 'daily',
  translation: 'aiyar',
  pronounce: true,
  pronounceStyle: 'simple',
  shareTheme: 'dawn',
  voiceTa: '',
  voiceEn: '',
  speechRate: 0.85,
  readEnglish: true,
  autoDetails: false,
  driveOn: false,
  driveEmail: '',
  lastDriveSync: 0,
  updateCheck: true,
  whatsNewSeen: 0,
  saved: [],
  read: [],
  seed: 0,
  dayLog: {},
  seals: {},
  hasPassphrase: false,
};

const KEY = 'kuralheart/settings';
const listeners = new Set<() => void>();

function load(): Settings {
  let saved: Partial<Settings> = {};
  try {
    const raw = storage.getItemSync(KEY);
    if (raw) saved = JSON.parse(raw) as Partial<Settings>;
  } catch {}
  const s = { ...DEFAULTS, ...saved };
  if (!s.seed) {
    s.seed = Math.floor(Math.random() * 2 ** 31) + 1;
    storage.setItemSync(KEY, JSON.stringify(s));
  }
  return s;
}

let current: Settings | null = null;

export function settings(): Settings {
  if (!current) current = load();
  return current;
}

/** Re-read from storage (another JS context, such as the widget, may have written). */
export function reloadSettings() {
  current = load();
  listeners.forEach((l) => l());
}

export function setSettings(patch: Partial<Settings> | ((s: Settings) => Partial<Settings>)) {
  const s = settings();
  const p = typeof patch === 'function' ? patch(s) : patch;
  current = { ...s, ...p };
  storage.setItemSync(KEY, JSON.stringify(current));
  listeners.forEach((l) => l());
}

export function wipeSettings() {
  current = { ...DEFAULTS, seed: Math.floor(Math.random() * 2 ** 31) + 1 };
  storage.setItemSync(KEY, JSON.stringify(current));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, settings, settings);
}

export function logDay(date: Day, kural: number) {
  setSettings((s) => ({ dayLog: { ...s.dayLog, [date]: kural } }));
}

export function earnSeal(id: string, date: Day) {
  setSettings((s) => (s.seals[id] ? {} : { seals: { ...s.seals, [id]: date } }));
}

export function toggleSaved(n: number) {
  setSettings((s) => ({ saved: s.saved.includes(n) ? s.saved.filter((x) => x !== n) : [...s.saved, n].sort((a, b) => a - b) }));
}

export function markRead(n: number) {
  setSettings((s) => (s.read.includes(n) ? {} : { read: [...s.read, n] }));
}

// --- backups: the same keys and shapes the Kotlin app wrote, so files move between the two ---

export function exportPrefs(): Record<string, unknown> {
  const s = settings();
  return {
    onboarded: s.onboarded,
    tamil: s.tamil,
    theme: s.theme === 'auto' ? 'Auto' : s.theme === 'ivory' ? 'Ivory' : 'Midnight',
    reduce_motion: s.reduceMotion,
    reminder_on: s.reminderOn,
    reminder_minutes: s.reminderMinutes,
    started_on: s.startedOn,
    name: s.name,
    journal_title: s.journalTitle,
    // The profile photo's id; its picture travels in the backup's photos with the pages' own.
    avatar: s.avatar,
    pronounce_style: s.pronounceStyle,
    text_scale: s.textScale,
    accent: s.accent,
    prompt_mode: s.promptMode,
    translation: s.translation,
    seed: s.seed,
    day_log: JSON.stringify(s.dayLog),
    seals: JSON.stringify(s.seals),
    saved_kurals: s.saved.join(','),
    read_kurals: s.read.join(','),
  };
}

function nums(v: unknown): number[] {
  return typeof v === 'string' ? v.split(',').map(Number).filter((n) => n > 0) : [];
}

function obj(v: unknown): Record<string, unknown> {
  if (typeof v !== 'string') return {};
  try {
    return JSON.parse(v) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Carry over the history that belongs to the journal (seals, the day log, the start date); keep this phone's choices. */
/**
 * Bring a backup's history into this phone: days, seals, saved and read couplets, the start date, and the profile
 * (name, journal title, photo) where this phone has none yet. On a [fresh] phone (no pages yet: a new install being
 * restored) the look and reading choices come back too, so the app is as it was.
 */
export function mergeHistory(incoming: Record<string, unknown>, fresh = false) {
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  setSettings((s) => {
    const profile = {
      name: s.name || str(incoming.name),
      journalTitle: s.journalTitle || str(incoming.journal_title),
      avatar: s.avatar || str(incoming.avatar),
    };
    const theme = ({ Auto: 'auto', Ivory: 'ivory', Midnight: 'midnight' } as const)[str(incoming.theme) as 'Auto'];
    // Values are as this app wrote them; a Kotlin-era backup simply lacks the newer keys.
    const look: Partial<Settings> = fresh
      ? ({
          ...(typeof incoming.tamil === 'boolean' ? { tamil: incoming.tamil } : {}),
          ...(str(incoming.accent) ? { accent: str(incoming.accent) } : {}),
          ...(typeof incoming.text_scale === 'number' ? { textScale: incoming.text_scale } : {}),
          ...(str(incoming.translation) ? { translation: str(incoming.translation) } : {}),
          ...(str(incoming.prompt_mode) ? { promptMode: str(incoming.prompt_mode) } : {}),
          ...(str(incoming.pronounce_style) ? { pronounceStyle: str(incoming.pronounce_style) } : {}),
          ...(theme ? { theme } : {}),
          ...(typeof incoming.reminder_on === 'boolean' ? { reminderOn: incoming.reminder_on } : {}),
          ...(typeof incoming.reminder_minutes === 'number' ? { reminderMinutes: incoming.reminder_minutes } : {}),
        } as Partial<Settings>)
      : {};
    const dayLog = { ...s.dayLog };
    for (const [k, v] of Object.entries(obj(incoming.day_log))) if (dayLog[k] == null && typeof v === 'number') dayLog[k] = v;
    const seals = { ...s.seals };
    for (const [k, v] of Object.entries(obj(incoming.seals))) if (!seals[k] && typeof v === 'string') seals[k] = v;
    const saved = [...new Set([...s.saved, ...nums(incoming.saved_kurals)])].sort((a, b) => a - b);
    const read = [...new Set([...s.read, ...nums(incoming.read_kurals)])];
    const started = typeof incoming.started_on === 'string' ? incoming.started_on : '';
    const startedOn = started && (!s.startedOn || started < s.startedOn) ? started : s.startedOn;
    return { ...look, ...profile, dayLog, seals, saved, read, startedOn };
  });
}
