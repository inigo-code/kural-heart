// The thread (the app's streak) and the nine seals.
//
// Thread rules (PLAN.md): each calendar week, Monday to Sunday, keeps two rest days for you, so a busy day never
// breaks the thread. A third missed day in a week ends it. Today never counts against you before it is over. The
// number shown is the count of days written in the current thread.

import { addDays, mondayOf } from './dates';
import type { Day } from './dates';
import { partOf } from './pack';
import { isTamil } from './types';
import type { Entry } from './types';

export type Thread = { days: number; longest: number; writtenToday: boolean; restDaysUsedThisWeek: number; lastSeven: number };

function runFrom(written: Set<Day>, first: Day, end: Day, ended: boolean): number {
  let days = 0;
  let d = !ended && !written.has(end) ? addDays(end, -1) : end;
  const misses = new Map<Day, number>();
  while (d >= first) {
    if (written.has(d)) days++;
    else {
      const wk = mondayOf(d);
      const m = (misses.get(wk) ?? 0) + 1;
      if (m > 2) break;
      misses.set(wk, m);
    }
    d = addDays(d, -1);
  }
  return days;
}

/**
 * The longest thread that ended on a written day before [today], in one walk forward: the same as runFrom for every
 * such day, without walking back from each. Walking back from a day, a run stops at the third miss met in one week,
 * which is that week's third-last miss (counting only misses before the day, in the day's own week). Those stopping
 * points only move forward as the end does, so the run ending on a day is the written days since the latest of them.
 */
function longestEnded(written: Set<Day>, first: Day, today: Day): number {
  let best = 0;
  let total = 0; // written days so far
  let cut = 0; // written days up to the latest stopping point
  let week = '';
  let misses: number[] = []; // this week's misses so far, each as the written days before it
  for (let d = first; d < today; d = addDays(d, 1)) {
    const wk = mondayOf(d);
    if (wk !== week) {
      if (misses.length >= 3) cut = Math.max(cut, misses[misses.length - 3]);
      week = wk;
      misses = [];
    }
    if (written.has(d)) {
      total++;
      best = Math.max(best, total - Math.max(cut, misses.length >= 3 ? misses[misses.length - 3] : 0));
    } else misses.push(total);
  }
  return best;
}

export function thread(written: Set<Day>, today: Day): Thread {
  const writtenToday = written.has(today);
  if (written.size === 0) return { days: 0, longest: 0, writtenToday, restDaysUsedThisWeek: 0, lastSeven: 0 };
  const first = [...written].sort()[0];
  const current = runFrom(written, first, today, false);
  const longest = Math.max(current, longestEnded(written, first, today));
  let missed = 0;
  for (let d = mondayOf(today); d < today; d = addDays(d, 1)) if (!written.has(d)) missed++;
  let lastSeven = 0;
  for (let i = 0; i < 7; i++) if (written.has(addDays(today, -i))) lastSeven++;
  return { days: current, longest, writtenToday, restDaysUsedThisWeek: Math.min(missed, 2), lastSeven };
}

export type SealId = 'FirstLeaf' | 'InTamil' | 'Seven' | 'Chapter' | 'SixTimes' | 'ThreeParts' | 'Thirty' | 'Hundred' | 'Year';
export type Tone = 'clay' | 'indigo' | 'rose' | 'green';

export type Seal = { id: SealId; glyph: string; num: string | null; tone: Tone; ta: string; en: string; ce: string; ct: string };

export const SEALS: Seal[] = [
  { id: 'FirstLeaf', glyph: '௧', num: '1', tone: 'clay', ta: 'முதல் ஏடு', en: 'First leaf', ce: 'Your first saved page', ct: 'சேமித்த முதல் பக்கம்' },
  { id: 'InTamil', glyph: 'அ', num: null, tone: 'indigo', ta: 'தமிழில்', en: 'In Tamil', ce: 'A page written in Tamil', ct: 'தமிழில் எழுதிய பக்கம்' },
  { id: 'Seven', glyph: '௭', num: '7', tone: 'rose', ta: 'ஏழு நாள் தொடர்', en: 'Seven-day thread', ce: '7 days on your thread', ct: 'தொடரில் 7 நாட்கள்' },
  { id: 'Chapter', glyph: '௰', num: '10', tone: 'clay', ta: 'அதிகாரம்', en: 'A chapter', ce: '10 pages', ct: '10 பக்கங்கள்' },
  { id: 'SixTimes', glyph: '௬', num: '6', tone: 'green', ta: 'ஆறு பொழுது', en: 'All six times', ce: 'A page in each part of the day', ct: 'ஒவ்வொரு பொழுதிலும் ஒரு பக்கம்' },
  { id: 'ThreeParts', glyph: '௩', num: '3', tone: 'green', ta: 'முப்பால்', en: 'All three parts', ce: 'A page on Aram, Porul and Inbam', ct: 'அறம், பொருள், இன்பம் மூன்றிலும் ஒரு பக்கம்' },
  { id: 'Thirty', glyph: '௩௰', num: '30', tone: 'rose', ta: 'முப்பது நாள் தொடர்', en: 'Thirty-day thread', ce: '30 days on your thread', ct: 'தொடரில் 30 நாட்கள்' },
  { id: 'Hundred', glyph: '௱', num: '100', tone: 'clay', ta: 'நூறு ஏடுகள்', en: 'A hundred leaves', ce: '100 pages', ct: '100 பக்கங்கள்' },
  { id: 'Year', glyph: '௩௱௬௰௫', num: '365', tone: 'clay', ta: 'ஓர் ஆண்டு', en: 'A year with Valluvar', ce: '365 pages', ct: '365 பக்கங்கள்' },
];

/** How far along a seal is, as [done, of]. */
export function sealProgress(id: SealId, entries: Entry[], t: Thread): [number, number] {
  switch (id) {
    case 'FirstLeaf':
      return [Math.min(entries.length, 1), 1];
    case 'InTamil':
      return [entries.some((e) => isTamil(e.text)) ? 1 : 0, 1];
    case 'Seven':
      return [Math.min(t.longest, 7), 7];
    case 'Chapter':
      return [Math.min(entries.length, 10), 10];
    case 'SixTimes':
      return [Math.min(new Set(entries.map((e) => e.period.toLowerCase())).size, 6), 6];
    case 'ThreeParts':
      return [new Set(entries.map((e) => partOf(e.kural))).size, 3];
    case 'Thirty':
      return [Math.min(t.longest, 30), 30];
    case 'Hundred':
      return [Math.min(entries.length, 100), 100];
    case 'Year':
      return [Math.min(entries.length, 365), 365];
  }
}

/** Seals newly met by this journal, in order. The caller records them. */
export function newlyEarned(entries: Entry[], t: Thread, have: Record<string, string>): Seal[] {
  return SEALS.filter((s) => !have[s.id]).filter((s) => {
    const [d, of] = sealProgress(s.id, entries, t);
    return d >= of;
  });
}
