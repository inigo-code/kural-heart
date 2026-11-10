// Backups: one file, sealed with the person's passphrase, written to a folder they pick or synced to their Google
// Drive. Either way the file can only be opened with the passphrase; Google and the folder's app see a locked file.
// The format is the Kotlin app's (KHB1, payload format 2), so a backup from version 0.10 restores here.

import { Directory, File } from 'expo-file-system';

import { fromBase64, fromUtf8, toBase64, utf8 } from './bytes';
import { openBackup, sealBackup, storedPassphrase } from './crypto';
import { longDate } from './dates';
import { allEntries, entryFromJson, entryToJson, mergeEntries } from './journal';
import type { MergeResult } from './journal';
import { kural } from './pack';
import { mediaBytes, photoJpeg, putJpeg, putMediaBytes } from './photos';
import { exportPrefs, mergeHistory, setSettings, settings } from './settings';

export const FILE_NAME = 'Kural Heart backup.khb';

/** The whole journal, photos included, sealed with the passphrase. */
export async function exportBytes(): Promise<Uint8Array> {
  // Format 3 adds voice notes and videos ("media"); the Kotlin app's format 2 readers simply skip them.
  const photos: Record<string, string> = {};
  const media: Record<string, string> = {};
  for (const e of allEntries()) {
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
  const payload = { format: 3, created: Date.now(), prefs: exportPrefs(), entries: allEntries().map(entryToJson), photos, media };
  return sealBackup(utf8(JSON.stringify(payload)), await storedPassphrase());
}

/** Open a sealed backup and merge it in. Uses [pass] if given, otherwise the stored passphrase. */
export async function importBytes(bytes: Uint8Array, pass?: string): Promise<MergeResult> {
  const plain = await openBackup(bytes, pass ?? (await storedPassphrase()));
  const o = JSON.parse(fromUtf8(plain)) as {
    entries?: Record<string, unknown>[];
    prefs?: Record<string, unknown>;
    photos?: Record<string, string>;
    media?: Record<string, string>;
  };
  for (const [id, b64] of Object.entries(o.photos ?? {})) await putJpeg(id, fromBase64(b64));
  for (const [id, b64] of Object.entries(o.media ?? {})) await putMediaBytes(id, fromBase64(b64));
  if (o.prefs) mergeHistory(o.prefs, allEntries().length === 0);
  return mergeEntries((o.entries ?? []).map(entryFromJson));
}

/** Write the backup into the chosen folder. Returns the file's size in bytes. */
export async function backupNow(): Promise<number> {
  const folder = settings().backupFolder;
  if (!folder) throw new Error('Choose a folder first.');
  const sealed = await exportBytes();
  const dir = new Directory(folder);
  let file = dir.list().find((f): f is File => f instanceof File && f.name === FILE_NAME);
  if (!file) file = dir.createFile(FILE_NAME, 'application/octet-stream');
  file.write(sealed);
  setSettings({ lastBackup: Date.now() });
  return sealed.length;
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

export async function restoreFrom(file: File, pass: string): Promise<MergeResult> {
  return importBytes(await file.bytes(), pass);
}

export async function pickBackupFile(): Promise<File | null> {
  const r = await File.pickFileAsync({ mimeTypes: '*/*' });
  return r.canceled ? null : r.result;
}

/** Every page as plain text, newest first. Not encrypted: the screen says so. */
export function journalAsText(): string {
  const lines: string[] = [`Kural Heart · ${allEntries().length} pages`, ''];
  for (const e of allEntries()) {
    const k = kural(e.kural);
    lines.push(longDate(e.date, false, true));
    lines.push(`Kural ${k.n}: ${k.a} / ${k.b}`);
    const meta = [
      e.place?.name,
      e.weather ? (e.weather.temp != null ? `${e.weather.kind}, ${Math.round(e.weather.temp)}°C` : e.weather.kind) : null,
      e.tags.length ? e.tags.map((t) => `#${t}`).join(' ') : null,
    ].filter(Boolean);
    if (meta.length) lines.push(meta.join(' · '));
    lines.push('', e.text, '', '———', '');
  }
  return lines.join('\n');
}

export async function exportTextTo(folderUri: string) {
  const dir = new Directory(folderUri);
  const f = dir.createFile('Kural Heart pages.txt', 'text/plain');
  f.write(journalAsText());
}
