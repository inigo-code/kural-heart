// The couplet pack, built by tools/content/build_pack.py. Kural text lives only there, never in code.

import raw from '../../assets/kural/pack.json';

export type Part = 'aram' | 'porul' | 'inbam';

export const PARTS: Record<Part, { ta: string; en: string }> = {
  aram: { ta: 'அறத்துப்பால்', en: 'Virtue' },
  porul: { ta: 'பொருட்பால்', en: 'Wealth' },
  inbam: { ta: 'காமத்துப்பால்', en: 'Love' },
};

export type Chapter = { n: number; ta: string; en: string; part: Part };

export type Kural = {
  n: number;
  /** Chapter number. */
  c: number;
  a: string;
  b: string;
  /** Aiyar's prose (1916). */
  en: string;
  /** Mu. Varadarasanar's Tamil explanation (Thirukkural Thelivurai, 1969); empty for the one couplet the scan lacks. */
  ta: string;
  /** Pope's verse, two lines, and the prose printed with it (1886). */
  pa: string;
  pb: string;
  pp: string;
  /** How the Tamil was verified: agree, voted or review. */
  check: string;
};

export type Question = { en: string; ta: string };

type PackJson = {
  chapters: Chapter[];
  kurals: Kural[];
  questions: {
    lens: Record<string, Question>;
    chapter: Record<string, Question>;
    welcome: number[];
    moods: Record<string, number[]>;
    avoid: number[];
  };
};

const pack = raw as unknown as PackJson;

if (pack.kurals.length !== 1330 || pack.chapters.length !== 133) throw new Error('The couplet pack is incomplete');

export const KURALS: readonly Kural[] = pack.kurals;
export const CHAPTERS: readonly Chapter[] = pack.chapters;
export const LENS = pack.questions.lens;
export const WELCOME = pack.questions.welcome;
export const MOODS = pack.questions.moods;
export const AVOID = new Set(pack.questions.avoid);

export const kural = (n: number): Kural => KURALS[n - 1];
export const chapter = (n: number): Chapter => CHAPTERS[n - 1];
export const chapterOf = (k: Kural | number): Chapter => chapter(typeof k === 'number' ? kural(k).c : k.c);
export const partOf = (k: Kural | number): Part => chapterOf(k).part;

export const chapterKurals = (c: number): Kural[] => KURALS.slice((c - 1) * 10, c * 10);

/** The chapters that daily couplets come from (68 core and 22 selective, see PLAN.md). */
export const POOL_CHAPTERS: number[] = Object.keys(pack.questions.chapter).map(Number).sort((a, b) => a - b);

/** Every couplet in the pool chapters, in order. */
export const POOL: number[] = POOL_CHAPTERS.flatMap((c) => Array.from({ length: 10 }, (_, i) => (c - 1) * 10 + i + 1));

/** The chapter's question, or the Mind lens for chapters outside the pool. */
export function questionFor(k: Kural | number): Question {
  const c = typeof k === 'number' ? kural(k).c : k.c;
  return pack.questions.chapter[String(c)] ?? LENS.mind;
}

export const LENS_KEYS = ['mind', 'speech', 'action'] as const;

/** The English the person chose to read under a couplet. */
export function english(k: Kural, t: 'aiyar' | 'pope' | 'popeprose'): string {
  if (t === 'pope') return `${k.pa}\n${k.pb}`;
  if (t === 'popeprose') return k.pp;
  return k.en;
}

/** Search by number, Tamil words or English words. */
export function searchKurals(q: string): Kural[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return n >= 1 && n <= 1330 ? [kural(n)] : [];
  }
  const words = s.split(/\s+/);
  return KURALS.filter((k) => {
    const hay = `${k.a} ${k.b} ${k.en} ${k.pa} ${k.pb} ${k.pp} ${chapter(k.c).en} ${chapter(k.c).ta}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
