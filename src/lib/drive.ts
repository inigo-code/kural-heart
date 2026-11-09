// Google Drive sync. The app asks only for Drive's app-data scope: a hidden folder that belongs to Kural Heart,
// invisible in the Drive app and closed to other apps. The one file there is the passphrase-sealed backup.
//
// Sync: download the Drive copy (if any), merge it into this phone, then upload the merged journal. Two phones that
// sync take turns this way and end up with every page; a page edited on both is kept twice.
//
// Needs the owner's Google Cloud setup (docs/GOOGLE_DRIVE_SETUP.md): the Drive API, the consent screen, and an
// Android OAuth client for com.inigocode.kuralheart with each signing key's SHA-1.

import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';

import { exportBytes, importBytes } from './backup';
import { BackupError } from './crypto';
import type { MergeResult } from './journal';
import { setSettings, settings } from './settings';

const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const NAME = 'kural-heart.khb';

let configured = false;
function configure() {
  if (configured) return;
  GoogleSignin.configure({ scopes: [SCOPE], offlineAccess: false });
  configured = true;
}

export class DriveError extends Error {}

/** Sign in (showing Google's own screen) and grant the app-data scope. Returns the account's email. */
export async function connectDrive(): Promise<string> {
  configure();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const r = await GoogleSignin.signIn();
    if (r.type !== 'success') throw new DriveError('cancelled');
    if (!r.data.scopes.includes(SCOPE)) {
      const added = await GoogleSignin.addScopes({ scopes: [SCOPE] });
      if (!added) throw new DriveError('cancelled');
    }
    setSettings({ driveOn: true, driveEmail: r.data.user.email });
    return r.data.user.email;
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) throw new DriveError('cancelled');
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new DriveError('Google Play services are needed for Drive.');
      if (e.code === 'DEVELOPER_ERROR' || String(e.code) === '10') throw new DriveError('Drive isn’t set up for this copy of the app yet.');
    }
    throw e;
  }
}

export async function disconnectDrive() {
  configure();
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch {}
  setSettings({ driveOn: false, driveEmail: '' });
}

async function token(): Promise<string> {
  configure();
  if (!GoogleSignin.hasPreviousSignIn()) throw new DriveError('Connect Google Drive first.');
  await GoogleSignin.signInSilently();
  const t = await GoogleSignin.getTokens();
  return t.accessToken;
}

/** Google's errors, said plainly. */
function explain(status: number, body: string): string {
  const ta = settings().tamil;
  if (status === 403 && /has not been used|is disabled|accessNotConfigured|SERVICE_DISABLED/i.test(body))
    return ta
      ? 'இந்தச் செயலியின் Google Cloud திட்டத்தில் Google Drive API இன்னும் இயக்கப்படவில்லை. அதை இயக்கி, சில நிமிடங்கள் கழித்து மீண்டும் ஒத்திசைக்கவும்.'
      : 'Google Drive isn’t switched on for this app’s Google Cloud project yet. Enable the Drive API there, wait a few minutes, then sync again.';
  if (status === 401 || /invalid_grant|unauthorized/i.test(body))
    return ta ? 'Google உள்நுழைவு காலாவதியானது. Drive ஒத்திசைவை அணைத்து மீண்டும் இயக்கவும்.' : 'The Google sign-in has expired. Turn Drive sync off and on again.';
  if (status === 403 && /storageQuota|quotaExceeded/i.test(body))
    return ta ? 'உங்கள் Google சேமிப்பகம் நிரம்பியுள்ளது.' : 'Your Google storage is full.';
  if (status >= 500) return ta ? 'Google Drive இப்போது பதிலளிக்கவில்லை. சற்று கழித்து முயலுங்கள்.' : 'Google Drive isn’t answering just now. Try again in a little while.';
  return ta ? `Google Drive கோரிக்கையை மறுத்தது (${status}).` : `Google Drive refused the request (${status}).`;
}

async function call(url: string, init: RequestInit & { headers: Record<string, string> }): Promise<Response> {
  const r = await fetch(url, init);
  if (!r.ok) throw new DriveError(explain(r.status, await r.text().catch(() => '')));
  return r;
}

async function findFile(auth: Record<string, string>): Promise<string | null> {
  const q = encodeURIComponent(`name = '${NAME}'`);
  const list = (await (await call(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)`, { headers: auth })).json()) as {
    files: { id: string }[];
  };
  return list.files[0]?.id ?? null;
}

/**
 * Upload with Google's resumable protocol: one request opens a session, a second sends the bytes. Simple and
 * multipart uploads stop at 5 MB, which a journal with photos, voice notes or a video soon passes.
 */
async function upload(auth: Record<string, string>, id: string | null, bytes: Uint8Array) {
  const meta = id ? {} : { name: NAME, parents: ['appDataFolder'] };
  const start = await call(
    id ? `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=resumable` : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: id ? 'PATCH' : 'POST',
      headers: { ...auth, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'application/octet-stream', 'X-Upload-Content-Length': String(bytes.length) },
      body: JSON.stringify(meta),
    },
  );
  const session = start.headers.get('Location') ?? start.headers.get('location');
  if (!session) throw new DriveError(settings().tamil ? 'Google Drive பதிவேற்றத்தைத் தொடங்கவில்லை.' : 'Google Drive didn’t start the upload.');
  await call(session, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer });
}

/**
 * Sync now. Returns what came in from Drive. The Drive copy is opened with this phone's passphrase, or with
 * [drivePass] when it was locked with another (a fresh install that chose a new one); either way the merged journal
 * goes back up locked with this phone's passphrase. Nothing is uploaded unless the Drive copy opened, so a wrong
 * passphrase can't replace it.
 */
export async function syncDrive(drivePass?: string): Promise<MergeResult> {
  const auth = { Authorization: `Bearer ${await token()}` };
  const id = await findFile(auth);
  let result: MergeResult = { added: 0, keptBoth: 0 };
  if (id) {
    const remote = new Uint8Array(await (await call(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, { headers: auth })).arrayBuffer());
    try {
      result = await importBytes(remote, drivePass);
    } catch (e) {
      if (e instanceof BackupError && /passphrase/i.test(e.message)) throw new DriveError('passphrase');
      throw e;
    }
  }
  await upload(auth, id, await exportBytes());
  setSettings({ lastDriveSync: Date.now() });
  return result;
}

/** Delete the copy in Drive (this phone's journal is untouched). Returns whether there was one. */
export async function deleteDriveCopy(): Promise<boolean> {
  const auth = { Authorization: `Bearer ${await token()}` };
  const id = await findFile(auth);
  if (!id) return false;
  await call(`https://www.googleapis.com/drive/v3/files/${id}`, { method: 'DELETE', headers: auth });
  setSettings({ lastDriveSync: 0 });
  return true;
}

/** Sign out of the current account and pick another (Google's account chooser). Returns the new email. */
export async function switchDriveAccount(): Promise<string> {
  configure();
  try {
    await GoogleSignin.signOut();
  } catch {}
  setSettings({ driveOn: false, driveEmail: '', lastDriveSync: 0 });
  return connectDrive();
}

/** For background runs: sync only if access was granted before and needs no screen. */
export async function syncQuietly(): Promise<boolean> {
  const s = settings();
  if (!s.driveOn || !s.hasPassphrase) return false;
  try {
    await syncDrive();
    return true;
  } catch {
    return false;
  }
}
