// The journal: every page on this phone, opened into memory once at start (a journal is small), newest first.
// Writes go to SQLite straight away, so a page survives the app being killed. The private part of each page is
// sealed with the device key (see crypto.ts); dates, the couplet and the time of day stay readable for sorting.

import * as SQLite from 'expo-sqlite';
import { useSyncExternalStore } from 'react';

import { fromUtf8, utf8 } from './bytes';
import { open, seal } from './crypto';
import type { Day } from './dates';
import { asPeriod } from './daily';
import { chapterOf } from './pack';
import { uuid } from './random';
import { baseline, clearSyncState, prune, recordDeletion, setTombstones, tombstones } from './syncState';
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

type Body = Pick<Entry, 'text' | 'mood' | 'tags' | 'starred' | 'place' | 'weather' | 'photos' | 'audio' | 'videos' | 'q'>;

function bodyOf(e: Entry): Body {
  return { text: e.text, mood: e.mood, tags: e.tags, starred: e.starred, place: e.place, weather: e.weather, photos: e.photos, audio: e.audio, videos: e.videos, q: e.q };
}

/** Fill the private fields from a sealed body (older pages have only text and mood). */
function withBody(head: Omit<Entry, keyof Body>, b: Record<string, unknown>): Entry {
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const p = b.place as { name?: string; lat?: number | null; lon?: number | null } | null | undefined;
  const w = b.weather as { kind?: string; temp?: number | null } | null | undefined;
  const place: Place | null = p && typeof p === 'object' ? { name: p.name ?? '', lat: p.lat ?? null, lon: p.lon ?? null } : null;
  const weather: Weather | null = w && typeof w === 'object' && w.kind ? { kind: w.kind as Weather['kind'], temp: w.temp ?? null } : null;
  const mood = typeof b.mood === 'string' && b.mood ? b.mood : null;
  const q = b.q as { en?: unknown; ta?: unknown } | null | undefined;
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
    ...(q && typeof q.en === 'string' && typeof q.ta === 'string' ? { q: { en: q.en, ta: q.ta } } : {}),
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
/** Pages that are in the database but couldn't be opened here (a key or data problem), and whether opening failed. */
let failed = 0;
let broken = false;
const listeners = new Set<() => void>();
let snapshot = { entries, loaded, failed, broken };

function publish() {
  entries = [...entries].sort((a, b) => (a.date === b.date ? b.created - a.created : a.date < b.date ? 1 : -1));
  snapshot = { entries, loaded, failed, broken };
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

/**
 * Open every page. Returns how many rows couldn't be opened; throws if the journal itself couldn't be. Either way the
 * screens are told, so a problem shows as a problem rather than as an empty journal.
 */
export async function loadJournal(): Promise<{ failed: number }> {
  type Row = { id: string; date: string; created: number; updated: number; kural: number; lens: number; period: string; body: Uint8Array };
  let rows: Row[];
  try {
    const d = await database();
    rows = await d.getAllAsync<Row>('SELECT id, date, created, updated, kural, lens, period, body FROM entries');
  } catch (e) {
    broken = true;
    publish();
    throw e;
  }
  const out: Entry[] = [];
  let bad = 0;
  for (const r of rows) {
    try {
      const body = JSON.parse(fromUtf8(await open(new Uint8Array(r.body)))) as Record<string, unknown>;
      out.push(withBody({ id: r.id, date: r.date, created: r.created, updated: r.updated, kural: r.kural, lens: r.lens, period: r.period }, body));
    } catch {
      bad++;
    }
  }
  entries = out;
  loaded = true;
  failed = bad;
  broken = false;
  publish();
  return { failed: bad };
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

/** Delete a page. One that had already been backed up or synced leaves a tombstone, so a sync doesn't bring it back. */
export async function deleteEntry(id: string): Promise<Entry | undefined> {
  const e = entries.find((x) => x.id === id);
  if (!e) return undefined;
  await (await database()).runAsync('DELETE FROM entries WHERE id = ?', [id]);
  recordDeletion(id);
  entries = entries.filter((x) => x.id !== id);
  publish();
  return e;
}

export async function deleteAllEntries() {
  await (await database()).runAsync('DELETE FROM entries');
  clearSyncState();
  entries = [];
  publish();
}

/**
 * How pages from elsewhere come in. `sync` (Drive sync, nightly): deletions travel both ways. `restore` (a picked
 * backup file, or a new phone opening its Drive copy): deletions are ignored, and a page brought back stays back.
 */
export type MergeMode = 'sync' | 'restore';
export type MergeResult = { added: number; keptBoth: number; removed: number; updated: number };
export type Verdict = 'add' | 'take' | 'keep' | 'both' | 'skip' | 'remove';

/**
 * What to do with an incoming page [e] beside this phone's page with the same id [mine], given the `updated` stamp of
 * the version last sent out ([exported]) and when the page was deleted ([deleted], used only in `sync`). With no [e],
 * whether this phone's page should go because the other phone deleted it.
 *
 * - Deleted at or after the incoming version (sync): it isn't brought back, and this phone's copy goes too, unless
 *   it was edited after the deletion.
 * - Not here: add it. The very same version: keep mine.
 * 1. The incoming one is what was sent out: mine is a later edit. Keep mine.
 * 3. The text is the same: the newer wins.
 * 4. The incoming one is older than what was sent out (an old backup file): keep mine.
 * 2. Mine is what was sent out and the incoming one is later: the other phone edited it. Take it.
 * 5. Otherwise both changed: keep both.
 * (4 comes before 2, so an old backup file or a stale Drive copy never takes back an edit made here.)
 */
export function decide(mine: Entry | undefined, e: Entry | undefined, exported: number | undefined, deleted: number | undefined, mode: MergeMode): Verdict {
  const gone = mode === 'sync' ? deleted : undefined;
  if (!e) return mine && gone != null && gone >= mine.updated ? 'remove' : 'keep';
  if (gone != null && gone >= e.updated) return !mine ? 'skip' : mine.updated > gone ? 'keep' : 'remove';
  if (!mine) return 'add';
  if (mine.updated === e.updated) return 'keep';
  if (exported != null && e.updated === exported) return 'keep';
  if (mine.text === e.text) return e.updated > mine.updated ? 'take' : 'keep';
  if (exported != null && e.updated < exported) return 'keep';
  if (exported != null && mine.updated === exported) return 'take';
  return 'both';
}

/**
 * Merge pages from a backup or the Drive copy, with its tombstones. Returns what changed here, and [held]: the
 * incoming versions this phone now has exactly, which the copy they came from is known to hold too.
 */
export async function mergeEntries(
  incoming: Entry[],
  incomingDeleted: Record<string, number>,
  mode: MergeMode,
  where: 'drive' | 'any',
): Promise<{ result: MergeResult; held: Record<string, number> }> {
  const tombs = { ...tombstones() };
  // Sync: both phones' deletions, the later time winning.
  if (mode === 'sync') for (const [id, at] of Object.entries(prune(incomingDeleted))) if (!(tombs[id] >= at)) tombs[id] = at;
  const d = await database();
  const result: MergeResult = { added: 0, keptBoth: 0, removed: 0, updated: 0 };
  const held: Record<string, number> = {};
  const seen = new Set<string>();
  for (const e of incoming) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    const mine = entries.find((x) => x.id === e.id);
    const v = decide(mine, e, baseline(e.id, where), tombs[e.id], mode);
    if (v === 'add') {
      // Restoring a page deleted here: it becomes an edit made now, so the deletion can't win it back on a later sync.
      if (mode === 'restore' && tombs[e.id] != null) await write({ ...e, updated: Date.now() });
      else {
        await write(e);
        held[e.id] = e.updated;
      }
      result.added++;
    } else if (v === 'take') {
      await write(e);
      held[e.id] = e.updated;
      result.updated++;
    } else if (v === 'both') {
      // A copy kept on an earlier, unfinished sync isn't kept a second time.
      if (!entries.some((x) => x.created === e.created && x.updated === e.updated && x.text === e.text)) {
        await write({ ...e, id: uuid() });
        result.keptBoth++;
      }
    } else if (v === 'remove') {
      await d.runAsync('DELETE FROM entries WHERE id = ?', [e.id]);
      result.removed++;
    } else if (v === 'keep' && mine?.updated === e.updated) held[e.id] = e.updated;
    if (mode === 'restore') delete tombs[e.id];
  }
  // Pages here that the other phone deleted, and that weren't in its copy at all.
  if (mode === 'sync')
    for (const mine of entries)
      if (!seen.has(mine.id) && decide(mine, undefined, undefined, tombs[mine.id], mode) === 'remove') {
        await d.runAsync('DELETE FROM entries WHERE id = ?', [mine.id]);
        result.removed++;
      }
  await loadJournal();
  // A page still here was edited after its deletion; that tombstone is spent.
  for (const e of entries) if (tombs[e.id] != null && e.updated > tombs[e.id]) delete tombs[e.id];
  setTombstones(tombs);
  return { result, held };
}

/** Search a page's words, its couplet's number and chapter, its feeling, tags (in part) and place. */
export function searchEntries(list: Entry[], q: string, moods: readonly { id: string; en: string; ta: string }[] = []): Entry[] {
  const s = q.trim().toLowerCase();
  if (!s) return list;
  const tag = s.replace(/^#/, '');
  const feelings = new Set(moods.filter((m) => m.en.toLowerCase().includes(s) || m.ta.includes(s)).map((m) => m.id));
  return list.filter((e) => {
    if (e.text.toLowerCase().includes(s) || String(e.kural) === s) return true;
    if (tag && e.tags.some((t) => t.toLowerCase().includes(tag))) return true;
    if (e.place?.name.toLowerCase().includes(s)) return true;
    if (e.mood && feelings.has(e.mood)) return true;
    const ch = e.kural >= 1 && e.kural <= 1330 ? chapterOf(e.kural) : null;
    return !!ch && (ch.en.toLowerCase().includes(s) || ch.ta.includes(s));
  });
}

export function allTags(list: Entry[]): string[] {
  const n = new Map<string, number>();
  for (const e of list) for (const t of e.tags) n.set(t, (n.get(t) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

export function writtenDays(list: Entry[]): Set<Day> {
  return new Set(list.map((e) => e.date));
}
