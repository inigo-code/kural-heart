import { epochDay, today } from './dates';
import type { Day } from './dates';
import { AVOID, MOODS, POOL, WELCOME } from './pack';
import { hashString, rng, shuffled } from './random';
import { logDay, setSettings, settings } from './settings';

/** The six parts of the Tamil day (சிறுபொழுது), which set the greeting and, on Auto, the theme. */
export type Period = 'vaigarai' | 'kaalai' | 'nanpagal' | 'erpadu' | 'maalai' | 'yaamam';

export const PERIODS: Record<Period, { ta: string; en: string; greetTa: string; greetEn: string; night: boolean }> = {
  vaigarai: { ta: 'வைகறை', en: 'Before dawn', greetTa: 'வைகறை வணக்கம்', greetEn: 'Good early morning', night: true },
  kaalai: { ta: 'காலை', en: 'Morning', greetTa: 'காலை வணக்கம்', greetEn: 'Good morning', night: false },
  nanpagal: { ta: 'நண்பகல்', en: 'Midday', greetTa: 'வணக்கம்', greetEn: 'Good afternoon', night: false },
  erpadu: { ta: 'எற்பாடு', en: 'Late afternoon', greetTa: 'மாலை வணக்கம்', greetEn: 'Good afternoon', night: false },
  maalai: { ta: 'மாலை', en: 'Evening', greetTa: 'மாலை வணக்கம்', greetEn: 'Good evening', night: true },
  yaamam: { ta: 'யாமம்', en: 'Deep night', greetTa: 'இரவு வணக்கம்', greetEn: 'Good night', night: true },
};

export const PERIOD_ORDER: Period[] = ['vaigarai', 'kaalai', 'nanpagal', 'erpadu', 'maalai', 'yaamam'];

export function periodAt(d: Date = new Date()): Period {
  const h = d.getHours();
  if (h >= 2 && h <= 5) return 'vaigarai';
  if (h >= 6 && h <= 9) return 'kaalai';
  if (h >= 10 && h <= 13) return 'nanpagal';
  if (h >= 14 && h <= 17) return 'erpadu';
  if (h >= 18 && h <= 21) return 'maalai';
  return 'yaamam';
}

/** Older pages (from the Kotlin app) store the period by its enum name. */
export function asPeriod(s: string): Period {
  const p = s.toLowerCase() as Period;
  return PERIODS[p] ? p : 'kaalai';
}

/**
 * Picks the day's couplet. The first seven days follow a hand-picked welcome; after that the pool is shuffled by the
 * install's seed. A couplet is used only on days the app is opened, so nobody skips couplets by being away, and a
 * day keeps its couplet once chosen.
 */
export function pick(log: Record<Day, number>, seed: number, date: Day, random = false): number {
  const had = log[date];
  if (had) return had;
  const used = new Set(Object.values(log));
  const i = Object.keys(log).length;
  if (random) {
    const left = POOL.filter((n) => !used.has(n));
    const from = left.length ? left : POOL;
    return from[Math.floor(rng(seed + epochDay(date))() * from.length)];
  }
  if (i < WELCOME.length) return WELCOME[i];
  const order = shuffled(POOL, seed);
  return order.find((n) => !used.has(n)) ?? order[i % order.length];
}

/** Today's couplet, chosen and remembered the first time it is asked for on a given day. */
export function todayKural(date: Day = today()): number {
  const s = settings();
  const n = pick(s.dayLog, s.seed, date, s.promptMode === 'random');
  if (s.dayLog[date] == null) logDay(date, n);
  if (!s.startedOn) setSettings({ startedOn: date });
  return n;
}

/** Make [n] today's couplet (from the library, or "another couplet"). */
export function setToday(n: number, date: Day = today()) {
  logDay(date, n);
}

/** Another couplet for today, one not read before. */
export function anotherToday(): number {
  const s = settings();
  const used = new Set(Object.values(s.dayLog));
  const left = POOL.filter((n) => !used.has(n));
  const from = left.length ? left : POOL;
  const n = from[Math.floor(Math.random() * from.length)];
  setToday(n);
  return n;
}

/** A couplet for a feeling, never the same as [not], never one on the avoid list. */
export function forMood(mood: string, seed: number, attempt: number, not?: number): number {
  const chapters = MOODS[mood] ?? MOODS.calm;
  const candidates = chapters
    .flatMap((c) => Array.from({ length: 10 }, (_, i) => (c - 1) * 10 + i + 1))
    .filter((n) => !AVOID.has(n) && n !== not);
  const order = shuffled(candidates, seed + hashString(mood));
  return order[((attempt % order.length) + order.length) % order.length];
}
