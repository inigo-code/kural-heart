// The app lock: locked at start and whenever the app goes to the background, unless it left only to pick a file,
// a photo or a Google account (those open other apps on top of this one).

import * as LocalAuthentication from 'expo-local-authentication';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { settings } from './settings';

let locked = true;
let away = 0;
const listeners = new Set<() => void>();

function set(v: boolean) {
  locked = v;
  listeners.forEach((l) => l());
}

export function useLocked() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => locked && settings().lockOn,
    () => false,
  );
}

/** Wrap anything that opens another app on top (pickers, camera, sign-in), so returning doesn't lock. */
export async function awayFor<T>(work: () => Promise<T>): Promise<T> {
  away++;
  try {
    return await work();
  } finally {
    setTimeout(() => (away = Math.max(0, away - 1)), 800);
  }
}

AppState.addEventListener('change', (s) => {
  if (s === 'background' && away === 0 && settings().lockOn) set(true);
});

export function unlockNow() {
  set(false);
}

export async function canLock(): Promise<boolean> {
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  return level !== LocalAuthentication.SecurityLevel.NONE;
}

export async function authenticate(title: string): Promise<boolean> {
  const r = await awayFor(() => LocalAuthentication.authenticateAsync({ promptMessage: title, disableDeviceFallback: false }));
  return r.success;
}
