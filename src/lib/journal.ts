// The journal: every page on this phone, opened into memory once at start (a journal is small), newest first.
// Writes go to SQLite straight away, so a page survives the app being killed. The private part of each page is
// sealed with the device key (see crypto.ts); dates, the couplet and the time of day stay readable for sorting.

import * as SQLite from 'expo-sqlite';
import { useSyncExternalStore } from 'react';

import { fromUtf8, utf8 } from './bytes';
import { open, seal } from './crypto';
import type { Day } from './dates';
import { asPeriod } from './daily';
import { uuid } from './random';
import type { Entry, Place, Weather } from './types';

let db: SQLite.SQLiteDatabase | null = null;

async function database() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('journal.db');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY, date TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL, ' +
        'kural INTEGER NOT NULL, lens INTEGER NOT NULL, period TEXT NOT NULL, body BLOB NOT NULL);' +
        'CREATE INDEX IF NOT EXISTS entries_date ON entries(date);',
    );
  }
  return db;
}

type Body = Pick<Entry, 'text' | 'mood' | 'tags' | 'starred' | 'place' | 'weather' | 'photos' | 'audio' | 'videos'>;

function bodyOf(e: Entry): Body {
  return { text: e.text, mood: e.mood, tags: e.tags, starred: e.starred, place: e.place, weather: e.weather, photos: e.photos, audio: e.audio, videos: e.videos };
}

/** Fill the private fields from a sealed body (older pages have only text and mood). */
function withBody(head: Omit<Entry, keyof Body>, b: Record<string, unknown>): Entry {
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const p = b.place as { name?: string; lat?: number | null; lon?: number | null } | null | undefined;
  const w = b.weather as { kind?: string; temp?: number | null } | null | undefined;
  const place: Place | null = p && typeof p === 'object' ? { name: p.name ?? '', lat: p.lat ?? null, lon: p.lon ?? null } : null;
  const weather: Weather | null = w && typeof w === 'object' && w.kind ? { kind: w.kind as Weather['kind'], temp: w.temp ?? null } : null;
  const mood = typeof b.mood === 'string' && b.mood ? b.mood : null;
  return {
    ...head,
    period: asPeriod(head.period),
    text: typeof b.text === 'string' ? b.text : '',
    mood,
    tags: arr(b.tags),
    starred: b.starred === true,
    place,
    weather,
    photos: arr(b.photos),
    audio: arr(b.audio),
    videos: arr(b.videos),
  };
}

/** A page as the backup file carries it (the same JSON the Kotlin app wrote). */
export function entryToJson(e: Entry) {
  return { ...bodyOf(e), id: e.id, date: e.date, created: e.created, updated: e.updated, kural: e.kural, lens: e.lens, period: e.period };
}

export function entryFromJson(o: Record<string, unknown>): Entry {
  return withBody(
    {
      id: String(o.id),
      date: String(o.date) as Day,
      created: Number(o.created),
      updated: Number(o.updated),
      kural: Number(o.kural),
      lens: Number(o.lens ?? 0),
      period: String(o.period ?? ''),
    },
    o,
  );
}

// --- the in-memory list, shared with screens ---

let entries: Entry[] = [];
let loaded = false;
const listeners = new Set<() => void>();
let snapshot = { entries, loaded };

function publish() {
  entries = [...entries].sort((a, b) => (a.date === b.date ? b.created - a.created : a.date < b.date ? 1 : -1));
  snapshot = { entries, loaded };
  listeners.forEach((l) => l());
}

export function useJournal() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
    () => snapshot,
  );
}

export const allEntries = () => entries;
export const isLoaded = () => loaded;
export const entryById = (id: string) => entries.find((e) => e.id === id);

export async function loadJournal() {
  const d = await database();
  const rows = await d.getAllAsync<{ id: string; date: string; created: number; updated: number; kural: number; lens: number; period: string; body: Uint8Array }>(
    'SELECT id, date, created, updated, kural, lens, period, body FROM entries',
  );
  const out: Entry[] = [];
  for (const r of rows) {
    try {
      const body = JSON.parse(fromUtf8(await open(new Uint8Array(r.body)))) as Record<string, unknown>;
      out.push(withBody({ id: r.id, date: r.date, created: r.created, updated: r.updated, kural: r.kural, lens: r.lens, period: r.period }, body));
    } catch {}
  }
  entries = out;
  loaded = true;
  publish();
}

async function write(e: Entry) {
  const d = await database();
  const body = await seal(utf8(JSON.stringify(bodyOf(e))));
  await d.runAsync(
    'INSERT OR REPLACE INTO entries (id, date, created, updated, kural, lens, period, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [e.id, e.date, e.created, e.updated, e.kural, e.lens, e.period, body],
  );
}

export async function saveEntry(e: Entry) {
  await write(e);
  const i = entries.findIndex((x) => x.id === e.id);
  if (i >= 0) entries[i] = e;
  else entries.push(e);
  publish();
}

/** Star or unstar a page. */
export function toggleStar(e: Entry) {
  return saveEntry({ ...e, starred: !e.starred, updated: Date.now() });
}

export async function deleteEntry(id: string): Promise<Entry | undefined> {
  const e = entries.find((x) => x.id === id);
  if (!e) return undefined;
  await (await database()).runAsync('DELETE FROM entries WHERE id = ?', [id]);
  entries = entries.filter((x) => x.id !== id);
  publish();
  return e;
}

export async function deleteAllEntries() {
  await (await database()).runAsync('DELETE FROM entries');
  entries = [];
  publish();
}

export type MergeResult = { added: number; keptBoth: number };

/** Merge pages from a backup. Same id: the newer edit wins, unless both changed, then both are kept. */
export async function mergeEntries(incoming: Entry[]): Promise<MergeResult> {
  let added = 0;
  let keptBoth = 0;
  for (const e of incoming) {
    const mine = entries.find((x) => x.id === e.id);
    if (!mine) {
      await write(e);
      added++;
    } else if (mine.updated === e.updated || mine.text === e.text) {
      if (e.updated > mine.updated) await write(e);
    } else {
      await write({ ...e, id: uuid() });
      keptBoth++;
    }
  }
  await loadJournal();
  return { added, keptBoth };
}

export function searchEntries(list: Entry[], q: string): Entry[] {
  const s = q.trim().toLowerCase();
  if (!s) return list;
  const tag = s.replace(/^#/, '');
  return list.filter(
    (e) =>
      e.text.toLowerCase().includes(s) ||
      String(e.kural) === s ||
      e.tags.some((t) => t.toLowerCase() === tag) ||
      (e.place?.name.toLowerCase().includes(s) ?? false),
  );
}

export function allTags(list: Entry[]): string[] {
  const n = new Map<string, number>();
  for (const e of list) for (const t of e.tags) n.set(t, (n.get(t) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

export function writtenDays(list: Entry[]): Set<Day> {
  return new Set(list.map((e) => e.date));
}
