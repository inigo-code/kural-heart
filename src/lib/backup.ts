// Backups: one file, sealed with the person's passphrase, written to a folder they pick or synced to their Google
// Drive. Either way the file can only be opened with the passphrase; Google and the folder's app see a locked file.
// The format is the Kotlin app's (KHB1, payload format 2), so a backup from version 0.10 restores here.

import { Directory, File } from 'expo-file-system';

import { fromBase64, fromUtf8, toBase64, utf8 } from './bytes';
import { openBackup, sealBackup, storedPassphrase } from './crypto';
import { longDate } from './dates';
import { allEntries, entryFromJson, entryToJson, mergeEntries } from './journal';
import type { MergeMode, MergeResult } from './journal';
import { kural, questionOfPage } from './pack';
import { hasStored, mediaBytes, photoJpeg, putJpeg, putMediaBytes } from './photos';
import { exportPrefs, mergeHistory, setSettings, settings } from './settings';
import { markExported, tombstones } from './syncState';
import type { Entry } from './types';

export const FILE_NAME = 'Kural Heart backup.khb';

// Syncs, backups and restores run one after another: the nightly run at start and a tap on "Sync now" would otherwise
// both read, merge and upload at once.
let queue: Promise<unknown> = Promise.resolve();

export function oneAtATime<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work);
  queue = run.catch(() => {});
  return run;
}

/** A short fingerprint of what a backup carries (pages and their stamps, deletions, prefs), not of its photos' bytes. */
function fingerprintOf(list: Entry[], deleted: Record<string, number>, prefs: Record<string, unknown>): string {
  const text = JSON.stringify([list.map((e) => `${e.id}:${e.updated}`).sort(), Object.entries(deleted).sort(), prefs]);
  // Two 32-bit string hashes with different seeds, so a match by chance is out of reach.
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  return `${list.length}.${(h1 >>> 0).toString(36)}.${(h2 >>> 0).toString(36)}`;
}

/** The fingerprint of the journal as it is now. */
export function currentFingerprint(): string {
  return fingerprintOf(allEntries(), tombstones(), exportPrefs());
}

export type Snapshot = { bytes: Uint8Array; stamps: Record<string, number>; fingerprint: string };

/**
 * The whole journal, photos included, sealed with the passphrase, with each page's `updated` stamp as written. The
 * stamps are recorded as sent only once the bytes have safely arrived; a page edited meanwhile isn't counted as sent.
 */
export async function exportSnapshot(): Promise<Snapshot> {
  // The list as it is now: an edit saved while photos are read must not slip into the stamps.
  const list = [...allEntries()];
  const deleted = tombstones();
  const prefs = exportPrefs();
  // Format 3 adds voice notes and videos ("media"); the Kotlin app's format 2 readers simply skip them.
  const photos: Record<string, string> = {};
  const media: Record<string, string> = {};
  for (const e of list) {
    for (const id of e.photos) {
      const j = await photoJpeg(id);
      if (j) photos[id] = toBase64(j);
    }
    for (const id of [...e.audio, ...e.videos]) {
      const b = await mediaBytes(id);
      if (b) media[id] = toBase64(b);
    }
  }
  // The profile photo, so a restored phone shows it again.
  const avatar = settings().avatar;
  if (avatar && !photos[avatar]) {
    const j = await photoJpeg(avatar);
    if (j) photos[avatar] = toBase64(j);
  }
  // [deleted] (the tombstones) is new in 1.0.7; older readers ignore it, so the format stays 3.
  const payload = { format: 3, created: Date.now(), prefs, entries: list.map(entryToJson), photos, media, deleted };
  const bytes = await sealBackup(utf8(JSON.stringify(payload)), await storedPassphrase());
  return { bytes, stamps: Object.fromEntries(list.map((e) => [e.id, e.updated])), fingerprint: fingerprintOf(list, deleted, prefs) };
}

/**
 * Open a sealed backup and merge it in. Uses [pass] if given, otherwise the stored passphrase. [where] says which
 * record of what was sent out applies: Drive's for a sync, any for a file. Returns the merge and [held] (see
 * mergeEntries).
 */
export async function importBytes(bytes: Uint8Array, opts: { pass?: string; mode: MergeMode; where: 'drive' | 'any' }) {
  const plain = await openBackup(bytes, opts.pass ?? (await storedPassphrase()));
  const o = JSON.parse(fromUtf8(plain)) as {
    entries?: Record<string, unknown>[];
    prefs?: Record<string, unknown>;
    photos?: Record<string, string>;
    media?: Record<string, string>;
    deleted?: Record<string, unknown>;
  };
  // Files already here are the same files (ids are never reused), so only new ones are decoded and sealed.
  for (const [id, b64] of Object.entries(o.photos ?? {})) if (!hasStored(id)) await putJpeg(id, fromBase64(b64));
  for (const [id, b64] of Object.entries(o.media ?? {})) if (!hasStored(id)) await putMediaBytes(id, fromBase64(b64));
  if (o.prefs) mergeHistory(o.prefs, allEntries().length === 0);
  const deleted: Record<string, number> = {};
  for (const [id, at] of Object.entries(o.deleted ?? {})) if (typeof at === 'number') deleted[id] = at;
  return mergeEntries((o.entries ?? []).map(entryFromJson), deleted, opts.mode, opts.where);
}

/** Write the backup into the chosen folder. Returns the file's size in bytes. */
export function backupNow(): Promise<number> {
  return oneAtATime(async () => {
    const folder = settings().backupFolder;
    if (!folder) throw new Error('Choose a folder first.');
    const snap = await exportSnapshot();
    const dir = new Directory(folder);
    let file = dir.list().find((f): f is File => f instanceof File && f.name === FILE_NAME);
    if (!file) file = dir.createFile(FILE_NAME, 'application/octet-stream');
    file.write(snap.bytes);
    markExported('folder', snap.stamps);
    setSettings({ lastBackup: Date.now() });
    return snap.bytes.length;
  });
}

/** Delete the backup file from the chosen folder (other files there are untouched). Returns whether it was there. */
export function deleteFolderBackup(): boolean {
  const folder = settings().backupFolder;
  if (!folder) return false;
  const file = new Directory(folder).list().find((f): f is File => f instanceof File && f.name === FILE_NAME);
  if (!file) return false;
  file.delete();
  setSettings({ lastBackup: 0 });
  return true;
}

/** Stop backing up to the folder; the file already there stays. */
export function forgetBackupFolder() {
  setSettings({ backupFolder: '', backupNightly: false, lastBackup: 0 });
}

export async function pickBackupFolder(): Promise<string | null> {
  try {
    const d = await Directory.pickDirectoryAsync();
    setSettings({ backupFolder: d.uri });
    return d.uri;
  } catch {
    return null;
  }
}

/** Restore a picked backup file: its pages come back, even ones deleted here since. */
export function restoreFrom(file: File, pass: string): Promise<MergeResult> {
  return oneAtATime(async () => (await importBytes(await file.bytes(), { pass, mode: 'restore', where: 'any' })).result);
}

export async function pickBackupFile(): Promise<File | null> {
  const r = await File.pickFileAsync({ mimeTypes: '*/*' });
  return r.canceled ? null : r.result;
}

/**
 * Every page as plain text, newest first: the date and time, the couplet, the question it answered, the feeling and
 * the details, then the words. Not encrypted: the screen says so. [feeling] names a feeling by its id.
 */
export function journalAsText(feeling: (id: string) => string | null = () => null): string {
  const lines: string[] = [`Kural Heart · ${allEntries().length} pages`, ''];
  for (const e of allEntries()) {
    const k = kural(e.kural);
    const at = new Date(e.created);
    const h = at.getHours();
    const time = `${h % 12 === 0 ? 12 : h % 12}:${String(at.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
    lines.push(`${longDate(e.date, false, true)}, ${time}`);
    lines.push(`Kural ${k.n}: ${k.a} / ${k.b}`);
    lines.push(questionOfPage(e).en);
    const meta = [
      e.mood ? (feeling(e.mood) ?? e.mood) : null,
      e.place?.name,
      e.weather ? (e.weather.temp != null ? `${e.weather.kind}, ${Math.round(e.weather.temp)}°C` : e.weather.kind) : null,
      e.tags.length ? e.tags.map((t) => `#${t}`).join(' ') : null,
    ].filter(Boolean);
    if (meta.length) lines.push(meta.join(' · '));
    lines.push('', e.text, '', '———', '');
  }
  return lines.join('\n');
}

export async function exportTextTo(folderUri: string, feeling?: (id: string) => string | null) {
  const dir = new Directory(folderUri);
  const f = dir.createFile('Kural Heart pages.txt', 'text/plain');
  f.write(journalAsText(feeling));
}
