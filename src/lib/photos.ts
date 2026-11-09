// Photos attached to pages. Each is shrunk to at most 2048 pixels on its long side, saved as JPEG, and sealed with
// the device key like the journal text, so a photo can't be opened from the app's files on its own. To show one, it
// is opened into memory as a data URI (and kept in a small cache).

import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { fromBase64, toBase64 } from './bytes';
import { open, seal } from './crypto';
import { uuid } from './random';

const dir = () => {
  const d = new Directory(Paths.document, 'photos');
  if (!d.exists) d.create({ intermediates: true });
  return d;
};

const fileOf = (id: string) => new File(dir(), `${id}.bin`);

const cache = new Map<string, string>();

/** Shrink, seal and keep the picture at [uri]. Returns its id. */
export async function addPhoto(uri: string, width: number, height: number): Promise<string> {
  const side = Math.max(width, height);
  const ctx = ImageManipulator.manipulate(uri);
  if (side > 2048) ctx.resize(width >= height ? { width: 2048 } : { height: 2048 });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true });
  const jpeg = fromBase64(out.base64 ?? '');
  const id = uuid();
  fileOf(id).write(await seal(jpeg));
  try {
    new File(out.uri).delete();
  } catch {}
  cache.set(id, `data:image/jpeg;base64,${out.base64}`);
  return id;
}

/** The photo as a data URI, or null if it is missing. */
export async function photoUri(id: string): Promise<string | null> {
  const hit = cache.get(id);
  if (hit) return hit;
  const f = fileOf(id);
  if (!f.exists) return null;
  try {
    const jpeg = await open(await f.bytes());
    const uri = `data:image/jpeg;base64,${toBase64(jpeg)}`;
    if (cache.size > 30) cache.clear();
    cache.set(id, uri);
    return uri;
  } catch {
    return null;
  }
}

/** The plain JPEG, for backups (which are sealed again with the passphrase). */
export async function photoJpeg(id: string): Promise<Uint8Array | null> {
  const f = fileOf(id);
  if (!f.exists) return null;
  try {
    return await open(await f.bytes());
  } catch {
    return null;
  }
}

export async function putJpeg(id: string, jpeg: Uint8Array) {
  const f = fileOf(id);
  if (!f.exists) f.write(await seal(jpeg));
}

// --- voice notes and videos: sealed the same way, opened into a temporary file only while being played ---

const tempDir = () => {
  const d = new Directory(Paths.cache, 'open-media');
  if (!d.exists) d.create({ intermediates: true });
  return d;
};

/** Seal and keep a recorded or picked file. Returns its id. The original file is left alone. */
export async function addMediaFile(uri: string): Promise<string> {
  const bytes = await new File(uri).bytes();
  const id = uuid();
  fileOf(id).write(await seal(bytes));
  return id;
}

/** The plain bytes of a kept voice note or video (for backups, which seal them again with the passphrase). */
export const mediaBytes = photoJpeg;
export const putMediaBytes = putJpeg;

/** Open a sealed voice note or video into a temporary file, for a player. Returns its uri, or null. */
export async function openMedia(id: string, ext: 'm4a' | 'mp4'): Promise<string | null> {
  const out = new File(tempDir(), `${id}.${ext}`);
  if (out.exists) return out.uri;
  const plain = await photoJpeg(id);
  if (!plain) return null;
  out.write(plain);
  return out.uri;
}

/**
 * Remove the temporary plain copies: all of them (on start, and after a page with media is closed), or only one
 * (`id.ext`), so closing a video leaves a voice note on the same page playable.
 */
export function closeMedia(only?: string) {
  try {
    for (const f of tempDir().list()) if (!only || f.name === only) f.delete();
  } catch {}
}

/** Remove photos, voice notes and videos no page uses any more. */
export function purgeMedia(keep: Set<string>) {
  for (const f of dir().list()) {
    if (f instanceof File && !keep.has(f.name.replace(/\.bin$/, ''))) f.delete();
  }
  closeMedia();
}

export function deleteAllPhotos() {
  for (const f of dir().list()) f.delete();
  cache.clear();
  closeMedia();
}
