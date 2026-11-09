// Reads a couplet aloud: the Tamil first, then (if wanted) the English. The Tamil comes from the app's own recording
// of every couplet (an open, natural Tamil voice, so it sounds the same on every phone and works offline) unless a
// phone voice is chosen in Settings. The English, and any phone voice, use the phone's text-to-speech.

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';

import type { Kural } from './pack';
import { settings } from './settings';
import { VOICE_FILES } from './voiceFiles';

/** The Tamil voice setting's value for the app's own recordings (also what an empty setting means). */
export const BUILT_IN = 'kural-heart';

export const usesBuiltIn = () => {
  const v = settings().voiceTa;
  return v === '' || v === BUILT_IN;
};

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

let player: AudioPlayer | null = null;

function stopRecording() {
  if (player) {
    try {
      player.remove();
    } catch {}
    player = null;
  }
}

/** Play couplet [n]'s recording. Resolves true when it plays to the end, false when stopped, replaced or missing. */
function playRecording(n: number, rate: number, current: () => boolean): Promise<boolean> {
  const src = VOICE_FILES[n];
  if (!src) return Promise.resolve(false);
  return new Promise((resolve) => {
    stopRecording();
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const p = createAudioPlayer(src);
    player = p;
    // The recordings are made at a gentle reciting pace; the speed setting (0.85 is "gentle") scales around it.
    p.setPlaybackRate(Math.max(0.7, Math.min(1.3, rate / 0.85)));
    let settled = false;
    let sub: { remove: () => void } | null = null;
    let watch: ReturnType<typeof setInterval> | null = null;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      sub?.remove();
      if (watch) clearInterval(watch);
      if (player === p) stopRecording();
      resolve(ok);
    };
    sub = p.addListener('playbackStatusUpdate', (st) => {
      if (st.didJustFinish) finish(current());
    });
    // A newer reading, or Stop, ends this one even if the player sends nothing more.
    watch = setInterval(() => {
      if (!current() || player !== p) finish(false);
    }, 200);
    p.play();
  });
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
  stopRecording();
  await Speech.stop();
  if (mine !== generation) return;
  const s = settings();
  const builtIn = usesBuiltIn() && !!VOICE_FILES[k.n];
  const ta = builtIn ? null : await pick('ta');
  const en = s.readEnglish ? await pick('en') : null;
  if (mine !== generation) return;
  missingTamil = !builtIn && !ta;
  publish();
  const done = () => {
    if (mine === generation && speaking === k.n) {
      speaking = 0;
      publish();
    }
  };
  const readEnglish = () =>
    Speech.speak(englishText.split('\n').join(' '), { ...options(en, 'en-IN', s.speechRate), onDone: done, onStopped: done, onError: done });
  if (builtIn) {
    const finished = await playRecording(k.n, s.speechRate, () => mine === generation);
    if (mine !== generation) return;
    if (finished && s.readEnglish) readEnglish();
    else done();
    return;
  }
  const last = s.readEnglish || !ta ? 'en' : 'ta';
  if (ta) Speech.speak(`${k.a}. ${k.b}.`, { ...options(ta, 'ta-IN', s.speechRate), ...(last === 'ta' ? { onDone: done, onStopped: done, onError: done } : {}) });
  if (last === 'en') readEnglish();
}

export function stopReading() {
  generation++;
  stopRecording();
  Speech.stop();
  if (speaking) {
    speaking = 0;
    publish();
  }
}

/** Play a short sample in one phone voice, for choosing in Settings. */
export async function tryVoice(v: Voice, sample: string, rate: number) {
  generation++;
  stopRecording();
  await Speech.stop();
  Speech.speak(sample, { voice: v.id, language: v.language, rate });
}

/** Play couplet [n] in the built-in voice, for choosing in Settings. */
export async function tryBuiltIn(n: number, rate: number) {
  const mine = ++generation;
  await Speech.stop();
  await playRecording(n, rate, () => mine === generation);
}

export function voiceSettings() {
  IntentLauncher.startActivityAsync('com.android.settings.TTS_SETTINGS').catch(() =>
    IntentLauncher.startActivityAsync('android.speech.tts.engine.INSTALL_TTS_DATA').catch(() => {}),
  );
}
