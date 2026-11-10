// Reads a couplet aloud with the phone's own voices: the Tamil first, then (if wanted) the English. The phone's Tamil
// voices (Google's on most phones) read more naturally than the open recorded voice 1.0.2 shipped, so that was dropped.

import * as IntentLauncher from 'expo-intent-launcher';
import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';

import type { Kural } from './pack';
import { settings } from './settings';

let speaking = 0;
let missingTamil = false;
/** Bumped on every new reading, so callbacks from an older one are ignored. */
let generation = 0;
const listeners = new Set<() => void>();
let snap = { speaking, missingTamil };

function publish() {
  snap = { speaking, missingTamil };
  listeners.forEach((l) => l());
}

export function useSpeaker() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snap,
    () => snap,
  );
}

export type Voice = { id: string; name: string; language: string; quality: string };

let voiceCache: Voice[] | null = null;

export async function voices(fresh = false): Promise<Voice[]> {
  if (voiceCache && !fresh) return voiceCache;
  try {
    const all = await Speech.getAvailableVoicesAsync();
    voiceCache = all.map((v) => ({ id: v.identifier, name: v.name, language: v.language, quality: String(v.quality) }));
  } catch {
    voiceCache = [];
  }
  return voiceCache;
}

/**
 * The phone's voices for a language, best first. Android's Google engine lists each voice twice, an on-phone copy
 * ("-local") and an online one ("-network"), plus a "-language" alias of its default; only one of each voice is kept,
 * the on-phone copy when there is one.
 */
export async function voicesFor(lang: 'ta' | 'en', fresh = false): Promise<Voice[]> {
  const all = (await voices(fresh)).filter((v) => v.language.toLowerCase().startsWith(lang));
  const named = all.filter((v) => !/-language$/i.test(v.id));
  const pool = named.length ? named : all;
  const base = (v: Voice) => v.id.toLowerCase().replace(/-(local|network)$/, '');
  const byBase = new Map<string, Voice>();
  for (const v of pool) {
    const had = byBase.get(base(v));
    if (!had || (/-network$/i.test(had.id) && /-local$/i.test(v.id))) byBase.set(base(v), v);
  }
  const score = (v: Voice) =>
    (v.quality === 'Enhanced' ? 4 : 0) +
    (/-local$/i.test(v.id) ? 2 : 0) +
    (lang === 'en' && /(en-in|en_in)/i.test(v.language) ? 3 : 0) +
    (lang === 'en' && /(en-gb|en_gb)/i.test(v.language) ? 1 : 0);
  return [...byBase.values()].sort((a, b) => score(b) - score(a));
}

/** Whether a phone voice needs the internet to speak. */
export const isOnline = (v: Voice) => /-network$/i.test(v.id);

async function pick(lang: 'ta' | 'en'): Promise<Voice | null> {
  const chosen = lang === 'ta' ? settings().voiceTa : settings().voiceEn;
  const list = await voicesFor(lang);
  return list.find((v) => v.id === chosen) ?? list[0] ?? null;
}

function options(v: Voice | null, fallbackLang: string, rate: number) {
  return v ? { voice: v.id, language: v.language, rate } : { language: fallbackLang, rate };
}

/** Toggle: reading couplet [k] stops it if it is already being read. Anything else being read stops first. */
export async function readAloud(k: Kural, englishText: string) {
  if (speaking === k.n) {
    stopReading();
    return;
  }
  const mine = ++generation;
  // Show "Stop" (and Valluvar reciting) at once; looking up voices below can take a moment.
  speaking = k.n;
  missingTamil = false;
  publish();
  await Speech.stop();
  if (mine !== generation) return;
  const s = settings();
  const ta = await pick('ta');
  const en = s.readEnglish ? await pick('en') : null;
  if (mine !== generation) return;
  missingTamil = !ta;
  publish();
  const done = () => {
    if (mine === generation && speaking === k.n) {
      speaking = 0;
      publish();
    }
  };
  const readEnglish = () =>
    Speech.speak(englishText.split('\n').join(' '), { ...options(en, 'en-IN', s.speechRate), onDone: done, onStopped: done, onError: done });
  const last = s.readEnglish || !ta ? 'en' : 'ta';
  if (ta) Speech.speak(`${k.a}. ${k.b}.`, { ...options(ta, 'ta-IN', s.speechRate), ...(last === 'ta' ? { onDone: done, onStopped: done, onError: done } : {}) });
  if (last === 'en') readEnglish();
}

export function stopReading() {
  generation++;
  Speech.stop();
  if (speaking) {
    speaking = 0;
    publish();
  }
}

/** Play a short sample in one phone voice, for choosing in Settings. */
export async function tryVoice(v: Voice, sample: string, rate: number) {
  generation++;
  await Speech.stop();
  Speech.speak(sample, { voice: v.id, language: v.language, rate });
}

export function voiceSettings() {
  IntentLauncher.startActivityAsync('com.android.settings.TTS_SETTINGS').catch(() =>
    IntentLauncher.startActivityAsync('android.speech.tts.engine.INSTALL_TTS_DATA').catch(() => {}),
  );
}
