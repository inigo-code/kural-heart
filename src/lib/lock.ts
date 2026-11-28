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

// Prompts asked for and not yet answered. Android can lose a prompt asked for while the app is going to or coming from
// the background: it never shows it and never answers, yet refuses every later one at once ('app_cancel') until it is
// cleared, so Unlock seemed to do nothing. A prompt that is showing covers the screen, so a new request while one is
// open means the open one was lost: clear it first.
let open = 0;

async function ask(title: string) {
  if (open > 0) await LocalAuthentication.cancelAuthenticate().catch(() => {});
  open++;
  try {
    const opts = { promptMessage: title, disableDeviceFallback: false };
    let r = await LocalAuthentication.authenticateAsync(opts);
    if (!r.success && r.error === 'app_cancel' && AppState.currentState === 'active') {
      await LocalAuthentication.cancelAuthenticate().catch(() => {});
      r = await LocalAuthentication.authenticateAsync(opts);
    }
    return r;
  } finally {
    open--;
  }
}

export async function authenticate(title: string): Promise<boolean> {
  const r = await awayFor(() => ask(title));
  return r.success;
}

/**
 * Runs [work] whenever the app is on screen: now if it already is, and on every return. A prompt asked for while the
 * app is still in the background gets lost, and one cut short by leaving needs asking again when you come back. A
 * return from the prompt itself (the PIN screen is another app) doesn't count, or cancelling would ask again at once.
 */
export function onEachReturn(work: () => void): () => void {
  if (AppState.currentState === 'active') work();
  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active' && away === 0) work();
  });
  return () => sub.remove();
}
