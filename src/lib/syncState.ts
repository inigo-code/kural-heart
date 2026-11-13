// What this phone has sent out and what it has deleted, so a sync can tell "I edited my page" from "both phones
// edited it", and a page deleted here from one the other phone hasn't seen yet. Its own kv-store value, apart from
// settings: none of it is a choice the person makes, and none of it travels with the prefs.
//
// [exported] is what Google Drive holds: each page's `updated` stamp as last uploaded (or as last downloaded, when
// this phone keeps that same version). [filed] is the same for the folder backup. They are kept apart because the
// folder is written at other times than Drive, and a page in the folder file may not have reached Drive yet.
// [deleted] holds tombstones: when a page that had left the phone was deleted here, in milliseconds.

import { storage } from './storage';

export type SyncState = {
  exported: Record<string, number>;
  filed: Record<string, number>;
  deleted: Record<string, number>;
  /** A fingerprint of the last journal uploaded to Drive, so an unchanged journal isn't sent again. */
  uploaded: string;
};

const KEY = 'kuralheart/sync';
/** Tombstones older than this are dropped: by then every phone that syncs has long since seen them. */
const KEEP_DELETIONS = 400 * 24 * 60 * 60 * 1000;

const EMPTY: SyncState = { exported: {}, filed: {}, deleted: {}, uploaded: '' };

let current: SyncState | null = null;

function load(): SyncState {
  try {
    const raw = storage.getItemSync(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<SyncState>) };
  } catch {}
  return { ...EMPTY };
}

export function syncState(): SyncState {
  if (!current) current = load();
  return current;
}

function save(patch: Partial<SyncState>) {
  current = { ...syncState(), ...patch };
  storage.setItemSync(KEY, JSON.stringify(current));
}

/** Tombstones still worth keeping. */
export function prune(deleted: Record<string, number>, now = Date.now()): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, at] of Object.entries(deleted)) if (typeof at === 'number' && now - at < KEEP_DELETIONS) out[id] = at;
  return out;
}

/** This phone's tombstones, without the expired ones. */
export function tombstones(): Record<string, number> {
  return prune(syncState().deleted);
}

export function setTombstones(deleted: Record<string, number>) {
  save({ deleted: prune(deleted) });
}

/** A page was deleted here. Only a page that ever left the phone needs a tombstone; a draft never does. */
export function recordDeletion(id: string, at = Date.now()) {
  const s = syncState();
  if (s.exported[id] == null && s.filed[id] == null) return;
  save({ deleted: { ...s.deleted, [id]: at } });
}

/** A deleted page came back (Undo, or a restore). Returns when it had been deleted, if it had a tombstone. */
export function clearDeletion(id: string): number | undefined {
  const s = syncState();
  const at = s.deleted[id];
  if (at == null) return undefined;
  const deleted = { ...s.deleted };
  delete deleted[id];
  save({ deleted });
  return at;
}

/**
 * Record what a destination now holds. A whole journal written out ([replace]) is all it holds; versions learned from
 * a download are added to what was known.
 */
export function markExported(where: 'drive' | 'folder', stamps: Record<string, number>, replace = true) {
  const key = where === 'drive' ? 'exported' : 'filed';
  save({ [key]: replace ? { ...stamps } : { ...syncState()[key], ...stamps } });
}

/** The version of a page last known to be in the copy being merged: Drive's for a sync, the latest of both otherwise. */
export function baseline(id: string, where: 'drive' | 'any'): number | undefined {
  const s = syncState();
  if (where === 'drive') return s.exported[id];
  const a = s.exported[id];
  const b = s.filed[id];
  return a == null ? b : b == null ? a : Math.max(a, b);
}

export function setUploaded(fingerprint: string) {
  save({ uploaded: fingerprint });
}

/** Drive's copy changed hands (another account, a new passphrase, the copy deleted): the next sync uploads in full. */
export function forgetUpload() {
  save({ uploaded: '' });
}

/** Everything deleted: nothing here has been sent anywhere any more. */
export function clearSyncState() {
  current = { ...EMPTY };
  storage.setItemSync(KEY, JSON.stringify(current));
}
