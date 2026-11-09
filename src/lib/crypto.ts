// Two kinds of encryption, both AES-256-GCM:
//  - On the phone, journal text and photos are sealed with a random device key kept in Android's secure storage
//    (expo-secure-store, itself sealed by the Android Keystore), so the database file is unreadable on its own.
//  - Backups are sealed with a key derived from the person's passphrase (PBKDF2-HMAC-SHA256, 210,000 rounds), so a
//    backup can be opened on a new phone and by no one else. The file format (KHB1) is the one the Kotlin app wrote.

import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import KuralCrypto from '../../modules/kural-crypto';

import { concat, hex, utf8 } from './bytes';

const DEVICE_KEY = 'kuralheart.device_key';
const PASS_KEY = 'kuralheart.backup_pass';

let deviceKey: Promise<AESEncryptionKey> | null = null;

function key(): Promise<AESEncryptionKey> {
  if (!deviceKey) {
    deviceKey = (async () => {
      let h = await SecureStore.getItemAsync(DEVICE_KEY);
      if (!h) {
        h = hex(getRandomBytes(32));
        await SecureStore.setItemAsync(DEVICE_KEY, h);
      }
      return AESEncryptionKey.import(h, 'hex');
    })();
    deviceKey.catch(() => (deviceKey = null));
  }
  return deviceKey;
}

/** Seal with the device key. Output: 12-byte IV, then ciphertext and tag. */
export async function seal(plain: Uint8Array): Promise<Uint8Array> {
  const s = await aesEncryptAsync(plain, await key());
  return s.combined();
}

export async function open(sealed: Uint8Array): Promise<Uint8Array> {
  return aesDecryptAsync(AESSealedData.fromCombined(sealed), await key());
}

export async function deleteDeviceKey() {
  deviceKey = null;
  await SecureStore.deleteItemAsync(DEVICE_KEY);
  await SecureStore.deleteItemAsync(PASS_KEY);
}

// --- the passphrase, kept so nightly backups and Drive sync can run without asking ---

export async function setPassphrase(pass: string) {
  await SecureStore.setItemAsync(PASS_KEY, pass);
}

export async function storedPassphrase(): Promise<string> {
  const p = await SecureStore.getItemAsync(PASS_KEY);
  if (!p) throw new Error('Set a passphrase first.');
  return p;
}

export async function forgetPassphrase() {
  await SecureStore.deleteItemAsync(PASS_KEY);
}

// --- passphrase backups (KHB1) ---

const MAGIC = utf8('KHB1');
export const ROUNDS = 210_000;

export class BackupError extends Error {}

/** Takes a few seconds on purpose: that is what makes guessing a passphrase slow. */
export async function deriveKey(pass: string, salt: Uint8Array, rounds = ROUNDS): Promise<Uint8Array> {
  // Android's own PBKDF2 (UTF-8 password, as the Kotlin app used); the JavaScript one is the slow fallback.
  if (KuralCrypto) return new Uint8Array(await KuralCrypto.pbkdf2Sha256(pass, salt, rounds, 32));
  return pbkdf2Async(sha256, utf8(pass), salt, { c: rounds, dkLen: 32, asyncTick: 20 });
}

/** File layout: "KHB1", rounds (big-endian int), 16-byte salt, 12-byte IV, ciphertext and tag. AAD is "KHB1". */
export async function sealBackup(plain: Uint8Array, pass: string): Promise<Uint8Array> {
  const salt = getRandomBytes(16);
  const raw = await deriveKey(pass, salt);
  const k = await AESEncryptionKey.import(raw);
  raw.fill(0);
  const sealed = await aesEncryptAsync(plain, k, { additionalData: MAGIC });
  const rounds = new Uint8Array(4);
  new DataView(rounds.buffer).setInt32(0, ROUNDS, false);
  return concat(MAGIC, rounds, salt, await sealed.combined());
}

export function isBackup(file: Uint8Array): boolean {
  return file.length > 36 && MAGIC.every((b, i) => file[i] === b);
}

/** Throws a BackupError if this isn't a backup, or the passphrase is wrong, or the file was changed. */
export async function openBackup(file: Uint8Array, pass: string): Promise<Uint8Array> {
  if (!isBackup(file)) throw new BackupError("This isn't a Kural Heart backup.");
  const rounds = new DataView(file.buffer, file.byteOffset + 4, 4).getInt32(0, false);
  const salt = file.slice(8, 24);
  const raw = await deriveKey(pass, salt, rounds);
  const k = await AESEncryptionKey.import(raw);
  raw.fill(0);
  try {
    return await aesDecryptAsync(AESSealedData.fromCombined(file.slice(24)), k, { additionalData: MAGIC });
  } catch {
    throw new BackupError("That passphrase doesn't open this backup.");
  }
}
