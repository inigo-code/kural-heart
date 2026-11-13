import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { currentThread } from '@/lib/actions';
import { PERIODS, PERIOD_ORDER, asPeriod } from '@/lib/daily';
import { addDays, dayOf, epochDay, mondayOf, monthName, parseDay, shortDate, weekdayShort } from '@/lib/dates';
import type { Day } from '@/lib/dates';
import { useJournal } from '@/lib/journal';
import { CHAPTERS, PARTS, chapter, kural } from '@/lib/pack';
import type { Part } from '@/lib/pack';
import { useSettings } from '@/lib/settings';
import { wordCount } from '@/lib/types';
import type { Entry } from '@/lib/types';
import { MOODS, Rise, moodTint } from '@/ui/common';
import { AthangudiCorner, MayilBorder } from '@/ui/kolam';
import { Card, Icon, Page, SectionLabel, T, raised } from '@/ui/parts';
import type { IconName } from '@/ui/parts';
import { alpha } from '@/ui/theme';
import { useToday, useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';

type Range = '30' | '365' | 'all';

/** The three books as chart colours: stronger steps of the theme's hues, checked for colour-blind separation. */
const BOOK_INK: Record<Part, { day: string; night: string }> = {
  aram: { day: '#1E7A52', night: '#2FA06D' },
  porul: { day: '#3B5BC2', night: '#6B8BE6' },
  inbam: { day: '#C23A62', night: '#E0607F' },
};

const BOOKS: Part[] = ['aram', 'porul', 'inbam'];

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** A smooth line through the points that never overshoots them (monotone cubic, Fritsch–Carlson). */
function smoothLine(pts: [number, number][]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0][0]} ${pts[0][1]}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
  t.push(m[n - 2]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i][0] + h} ${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h} ${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]} ${pts[i + 1][1]}`;
  }
  return d;
}

/** Words over time as a soft area. Drag across it to read any point. */
/** 0 to 1 over [ms] whenever [key] changes, for drawing a chart in; at once with Reduce motion on. */
function useDrawIn(key: string, ms = 900): SharedValue<number> {
  const { still } = useUI();
  const v = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) {
      v.value = 1;
      return;
    }
    v.value = 0;
    v.value = withTiming(1, { duration: ms, easing: Easing.out(Easing.cubic) });
    // v is a shared value and stays the same object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, still, ms]);
  return v;
}

function TrendChart({ values, labels, color, onPick }: { values: number[]; labels: string[]; color: string; onPick: (i: number | null) => void }) {
  const { c } = useUI();
  // The line draws itself from left to right, and the fill under it fades up with it.
  const draw = useDrawIn(values.join(','));
  const [width, setWidth] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const height = 150;
  const top = 14;
  const base = height - 6;
  const n = values.length;
  const max = Math.max(1, ...values);
  const dx = n > 1 ? width / (n - 1) : 0;
  const pts = values.map((v, i) => [n > 1 ? i * dx : width / 2, base - (v / max) * (base - top)] as [number, number]);
  const line = width ? smoothLine(pts) : '';
  const linePath = Skia.Path.MakeFromSVGString(line || 'M0 0') ?? Skia.Path.Make();
  const areaPath = Skia.Path.MakeFromSVGString(line && n > 1 ? `${line}L${width} ${base}L0 ${base}Z` : 'M0 0') ?? Skia.Path.Make();
  const choose = (x: number) => {
    if (!n || !width) return;
    const i = n > 1 ? Math.max(0, Math.min(n - 1, Math.round(x / dx))) : 0;
    setPick(i);
    onPick(i);
  };
  const p = pick != null && pick < n ? pts[pick] : null;
  return (
    <View>
      <View
        style={{ height }}
        onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => choose(e.nativeEvent.locationX)}
        onResponderMove={(e) => choose(e.nativeEvent.locationX)}
        onResponderRelease={() => {
          setPick(null);
          onPick(null);
        }}
        onResponderTerminate={() => {
          setPick(null);
          onPick(null);
        }}
        accessibilityRole="adjustable"
        accessibilityLabel={labels.map((l, i) => `${l}: ${values[i]}`).join(', ')}>
        {width ? (
          <Canvas style={{ width, height }} pointerEvents="none">
            <Line p1={vec(0, top)} p2={vec(width, top)} color={alpha(c.ink3, 0.28)} strokeWidth={1}>
              <DashPathEffect intervals={[3, 5]} />
            </Line>
            <Line p1={vec(0, base)} p2={vec(width, base)} color={alpha(c.ink3, 0.3)} strokeWidth={1} />
            {n > 1 ? (
              <Path path={areaPath} opacity={draw}>
                <LinearGradient start={vec(0, top)} end={vec(0, base)} colors={[alpha(color, 0.34), alpha(color, 0)]} />
              </Path>
            ) : null}
            <Path path={linePath} color={color} style="stroke" strokeWidth={2.2} strokeJoin="round" strokeCap="round" end={draw} />
            {p ? (
              <Group>
                <Line p1={vec(p[0], top - 6)} p2={vec(p[0], base)} color={alpha(c.ink, 0.35)} strokeWidth={1} />
                <Circle cx={p[0]} cy={p[1]} r={7} color={c.surface} />
                <Circle cx={p[0]} cy={p[1]} r={5} color={color} />
              </Group>
            ) : n === 1 ? (
              <Circle cx={pts[0][0]} cy={pts[0][1]} r={5} color={color} />
            ) : null}
          </Canvas>
        ) : null}
        <T v="small" color={c.ink3} style={{ position: 'absolute', right: 0, top: top - 18 }} pointerEvents="none">
          {max.toLocaleString()}
        </T>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <T v="small" color={c.ink3}>
          {labels[0] ?? ''}
        </T>
        {n > 2 ? (
          <T v="small" color={c.ink3}>
            {labels[Math.floor((n - 1) / 2)]}
          </T>
        ) : null}
        <T v="small" color={c.ink3}>
          {n > 1 ? labels[n - 1] : ''}
        </T>
      </View>
    </View>
  );
}

/** Columns with the tallest one lit; tap any to read it. */
function Columns({ values, labels, color }: { values: number[]; labels: string[]; color: string }) {
  const { c } = useUI();
  const [pick, setPick] = useState<number | null>(null);
  const max = Math.max(0, ...values);
  const top = values.indexOf(max);
  const shown = pick ?? (max > 0 ? top : null);
  const H = 96;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
      {values.map((v, i) => {
        const lit = i === shown;
        const h = v > 0 ? Math.max(8, (v / Math.max(1, max)) * H) : 4;
        return (
          <Pressable
            key={labels[i]}
            onPress={() => setPick(pick === i ? null : i)}
            accessibilityRole="button"
            accessibilityLabel={`${labels[i]}: ${v}`}
            style={{ flex: 1, alignItems: 'center' }}>
            <T v="small" color={c.ink} numberOfLines={1} style={{ opacity: lit ? 1 : 0 }}>
              {v}
            </T>
            <View
              style={{
                width: '72%',
                maxWidth: 34,
                height: h,
                marginTop: 4,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
                backgroundColor: v === 0 ? alpha(c.ink3, 0.16) : lit ? color : alpha(color, 0.38),
              }}
            />
            <T v="small" color={lit ? c.ink : c.ink3} numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 6 }}>
              {labels[i]}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The last weeks as a grid, darker for days with more words; tap a day to read it. */
function Heatmap({ words, written, weeks, onPick, picked }: { words: Map<Day, number>; written: Set<Day>; weeks: number; onPick: (d: Day | null) => void; picked: Day | null }) {
  const { c, tamil } = useUI();
  const [width, setWidth] = useState(0);
  const t = useToday();
  const first = addDays(mondayOf(t), -7 * (weeks - 1));
  const labelW = 22;
  const gap = 3;
  const cell = width ? Math.floor((width - labelW - gap * (weeks - 1)) / weeks) : 0;
  let max = 1;
  for (let i = 0; i < weeks * 7; i++) max = Math.max(max, words.get(addDays(first, i)) ?? 0);
  // Any page lights its day; more words, a deeper shade.
  const level = (d: Day) => (!written.has(d) ? 0 : Math.max(1, Math.min(4, Math.ceil((4 * (words.get(d) ?? 0)) / max))));
  const shade = (l: number) => (l === 0 ? alpha(c.ink3, 0.13) : alpha(c.primary, [0, 0.3, 0.52, 0.76, 1][l]));
  const dayRow = tamil ? ['தி', '', 'பு', '', 'வெ', '', 'ஞா'] : ['M', '', 'W', '', 'F', '', 'S'];
  return (
    <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {cell > 0 ? (
        <>
          <View style={{ flexDirection: 'row', marginLeft: labelW, height: 18 }}>
            {Array.from({ length: weeks }, (_, w) => {
              const monday = addDays(first, w * 7);
              const d = parseDay(monday);
              // A month is named on its first week; the first column only when no month starts right after it.
              const startsAt = (k: number) => parseDay(addDays(first, k * 7)).getDate() <= 7;
              const named = startsAt(w) || (w === 0 && !startsAt(1) && !startsAt(2));
              return (
                <View key={w} style={{ width: cell + (w < weeks - 1 ? gap : 0) }}>
                  {named && w < weeks - 2 ? (
                    <T v="small" color={c.ink3} numberOfLines={1} style={{ width: cell * 3 + gap * 2 }}>
                      {monthName(d.getMonth(), tamil).slice(0, tamil ? 4 : 3)}
                    </T>
                  ) : null}
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: labelW, gap }}>
              {dayRow.map((l, i) => (
                <View key={i} style={{ height: cell, justifyContent: 'center' }}>
                  <T v="small" color={c.ink3} style={{ fontSize: 10, lineHeight: 12 }}>
                    {l}
                  </T>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap }}>
              {Array.from({ length: weeks }, (_, w) => (
                <View key={w} style={{ gap }}>
                  {Array.from({ length: 7 }, (_, d) => {
                    const day = addDays(first, w * 7 + d);
                    if (day > t) return <View key={d} style={{ width: cell, height: cell }} />;
                    const on = picked === day;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => onPick(on ? null : day)}
                        hitSlop={1}
                        accessibilityLabel={`${shortDate(day, tamil)}: ${words.get(day) ?? 0}`}
                        style={{ width: cell, height: cell, borderRadius: Math.max(2, cell * 0.28), backgroundColor: shade(level(day)), borderWidth: on ? 2 : 0, borderColor: c.ink }}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 12 }}>
            <T v="small" color={c.ink3} style={{ marginRight: 4 }}>
              {tamil ? 'குறைவு' : 'Less'}
            </T>
            {[0, 1, 2, 3, 4].map((l) => (
              <View key={l} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: shade(l) }} />
            ))}
            <T v="small" color={c.ink3} style={{ marginLeft: 4 }}>
              {tamil ? 'அதிகம்' : 'More'}
            </T>
          </View>
        </>
      ) : null}
    </View>
  );
}

/** Three rings, one for each book of the Kural: how many of its chapters you have written on. */
function BookRings({ done }: { done: Record<Part, number> }) {
  const { c, tr, tamil } = useUI();
  const sweepIn = useDrawIn(`${done.aram} ${done.porul} ${done.inbam}`, 1100);
  const size = 128;
  const stroke = 12;
  const gap = 5;
  const total = (p: Part) => CHAPTERS.filter((ch) => ch.part === p).length;
  const ink = (p: Part) => (c.isNight ? BOOK_INK[p].night : BOOK_INK[p].day);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <Canvas style={{ width: size, height: size }}>
        {BOOKS.map((p, i) => {
          const r = size / 2 - stroke / 2 - i * (stroke + gap);
          const all = total(p);
          const frac = all ? Math.min(1, done[p] / all) : 0;
          const o = size / 2;
          const ring = `M${o} ${o - r}A${r} ${r} 0 1 1 ${o} ${o + r}A${r} ${r} 0 1 1 ${o} ${o - r}Z`;
          const track = Skia.Path.MakeFromSVGString(ring) ?? Skia.Path.Make();
          // Clockwise from twelve o'clock; a full book draws the whole ring.
          const sweep = (Math.max(6, frac * 360) * Math.PI) / 180;
          const arcSvg =
            frac >= 1 ? ring : `M${o} ${o - r}A${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${(o + r * Math.sin(sweep)).toFixed(2)} ${(o - r * Math.cos(sweep)).toFixed(2)}`;
          const arc = Skia.Path.MakeFromSVGString(arcSvg) ?? Skia.Path.Make();
          return (
            <Group key={p}>
              <Path path={track} color={alpha(ink(p), 0.16)} style="stroke" strokeWidth={stroke} />
              {frac > 0 ? <Path path={arc} color={ink(p)} style="stroke" strokeWidth={stroke} strokeCap="round" end={sweepIn} /> : null}
            </Group>
          );
        })}
      </Canvas>
      <View style={{ flex: 1, gap: 12 }}>
        {BOOKS.map((p) => (
          <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ink(p) }} />
            <View style={{ flex: 1 }}>
              <T v="label" numberOfLines={1} adjustsFontSizeToFit>
                {tamil ? PARTS[p].ta : PARTS[p].en}
              </T>
              <T v="small" color={c.ink3}>
                {tr(`${done[p]} of ${total(p)} chapters`, `${total(p)}-இல் ${done[p]} அதிகாரங்கள்`)}
              </T>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function Tile({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  const { c, type } = useUI();
  return (
    <View style={{ flexBasis: '46%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 14, gap: 12, ...raised(c) }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} color={c.onSoft} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="headline" numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: type.headline.fontSize * 1.1 }}>
          {value}
        </T>
        <T v="labelM" color={c.ink3} numberOfLines={2}>
          {label}
        </T>
      </View>
    </View>
  );
}

function Section({ title, note, children, i = 2 }: { title: string; note?: string; children: ReactNode; i?: number }) {
  const { c } = useUI();
  return (
    <Rise i={i}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <SectionLabel>{title}</SectionLabel>
        {note ? (
          <T v="small" color={c.ink3} style={{ marginTop: 28, marginBottom: 10, flexShrink: 1, textAlign: 'right' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {note}
          </T>
        ) : null}
      </View>
      {children}
    </Rise>
  );
}

const inRange = (e: Entry, from: Day, to: Day) => e.date >= from && e.date <= to;

export default function InsightsScreen() {
  const { c, tr, tamil } = useUI();
  const s = useSettings();
  const { entries } = useJournal();
  const t = useToday();
  const thread = currentThread(t);
  const [range, setRange] = useState<Range>('30');
  const [trendPick, setTrendPick] = useState<number | null>(null);
  const [dayPick, setDayPick] = useState<Day | null>(null);

  const firstDay = useMemo(() => entries.reduce<Day>((a, e) => (e.date < a ? e.date : a), t), [entries, t]);

  const data = useMemo(() => {
    const now = parseDay(t);
    // 30 days, or the twelve whole months up to this one, or everything.
    const from = range === '30' ? addDays(t, -29) : range === '365' ? dayOf(new Date(now.getFullYear(), now.getMonth() - 11, 1)) : firstDay;
    const span = range === 'all' ? 0 : epochDay(t) - epochDay(from) + 1;
    const list = entries.filter((e) => inRange(e, from, t));
    const prev = span ? entries.filter((e) => inRange(e, addDays(from, -span), addDays(from, -1))) : [];
    const words = (es: Entry[]) => es.reduce((a, e) => a + wordCount(e.text), 0);
    const total = words(list);
    const before = words(prev);

    // The trend: days for 30 days, months otherwise.
    let values: number[] = [];
    let labels: string[] = [];
    if (range === '30') {
      const byDay = new Map<Day, number>();
      for (const e of list) byDay.set(e.date, (byDay.get(e.date) ?? 0) + wordCount(e.text));
      for (let i = 0; i < 30; i++) {
        const d = addDays(from, i);
        values.push(byDay.get(d) ?? 0);
        labels.push(shortDate(d, tamil));
      }
    } else {
      const start = range === '365' ? new Date(now.getFullYear(), now.getMonth() - 11, 1) : parseDay(firstDay);
      let y = start.getFullYear();
      let m = start.getMonth();
      // At least two months, so the line has somewhere to go.
      if (range === 'all' && y === now.getFullYear() && m === now.getMonth()) {
        m -= 1;
        if (m < 0) {
          m = 11;
          y -= 1;
        }
      }
      const byMonth = new Map<string, number>();
      for (const e of list) byMonth.set(e.date.slice(0, 7), (byMonth.get(e.date.slice(0, 7)) ?? 0) + wordCount(e.text));
      while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth())) {
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        values.push(byMonth.get(key) ?? 0);
        labels.push(`${monthName(m, tamil).slice(0, tamil ? 4 : 3)}${y !== now.getFullYear() ? ` ${String(y).slice(2)}` : ''}`);
        m += 1;
        if (m > 11) {
          m = 0;
          y += 1;
        }
      }
    }

    const moods = MOODS.map((md) => ({ ...md, n: list.filter((e) => e.mood === md.id).length }))
      .filter((md) => md.n > 0)
      .sort((a, b) => b.n - a.n);
    const periods = PERIOD_ORDER.map((p) => list.filter((e) => asPeriod(e.period) === p).length);
    const weekdays = Array.from({ length: 7 }, (_, i) => list.filter((e) => (parseDay(e.date).getDay() + 6) % 7 === i).length);
    const byChapter = new Map<number, number>();
    for (const e of list) byChapter.set(kural(e.kural).c, (byChapter.get(kural(e.kural).c) ?? 0) + 1);
    const topChapters = [...byChapter.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 5);

    return {
      pages: list.length,
      days: new Set(list.map((e) => e.date)).size,
      total,
      average: list.length ? Math.round(total / list.length) : 0,
      longest: list.reduce((a, e) => Math.max(a, wordCount(e.text)), 0),
      change: range !== 'all' && before > 0 ? Math.round(((total - before) / before) * 100) : null,
      values,
      labels,
      moods,
      periods,
      weekdays,
      topChapters,
    };
  }, [entries, range, t, firstDay, tamil]);

  // All time: the heatmap, the three books and what is kept with the pages.
  const allTime = useMemo(() => {
    const words = new Map<Day, number>();
    for (const e of entries) words.set(e.date, (words.get(e.date) ?? 0) + wordCount(e.text));
    const chapters: Record<Part, Set<number>> = { aram: new Set(), porul: new Set(), inbam: new Set() };
    for (const e of entries) {
      const n = kural(e.kural).c;
      chapters[chapter(n).part].add(n);
    }
    return {
      words,
      written: new Set(entries.map((e) => e.date)),
      books: { aram: chapters.aram.size, porul: chapters.porul.size, inbam: chapters.inbam.size } as Record<Part, number>,
      photos: entries.reduce((a, e) => a + e.photos.length, 0),
      audio: entries.reduce((a, e) => a + e.audio.length, 0),
      videos: entries.reduce((a, e) => a + e.videos.length, 0),
    };
  }, [entries]);

  const rangeName = range === '30' ? tr('Last 30 days', 'கடந்த 30 நாட்கள்') : range === '365' ? tr('Last 12 months', 'கடந்த 12 மாதங்கள்') : tr('All time', 'எல்லாக் காலமும்');
  const trendHead =
    trendPick != null && trendPick < data.values.length
      ? { big: data.values[trendPick].toLocaleString(), small: data.labels[trendPick] }
      : { big: data.total.toLocaleString(), small: rangeName };
  const dayNames = tamil ? ['தி', 'செ', 'பு', 'வி', 'வெ', 'ச', 'ஞா'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const SHORT: Record<string, string> = { vaigarai: 'Dawn', kaalai: 'Morning', nanpagal: 'Midday', erpadu: 'Afternoon', maalai: 'Evening', yaamam: 'Night' };
  const periodNames = PERIOD_ORDER.map((p) => (tamil ? PERIODS[p].ta : (SHORT[p] ?? PERIODS[p].en)));
  const dayNote = (d: Day) => {
    if (!allTime.written.has(d)) return tr('no page', 'பக்கம் இல்லை');
    const w = allTime.words.get(d) ?? 0;
    return tr(`${w} ${plural(w, 'word', 'words')}`, `${w} ${w === 1 ? 'சொல்' : 'சொற்கள்'}`);
  };
  const bestPeriod = Math.max(...data.periods) > 0 ? PERIOD_ORDER[data.periods.indexOf(Math.max(...data.periods))] : null;
  const moodTotal = data.moods.reduce((a, m) => a + m.n, 0);

  return (
    <Page title={tr('Insights', 'புள்ளிவிவரங்கள்')} inTab actions={<Valluvar state="presenting" size={64} />}>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, padding: 4, borderRadius: 22, backgroundColor: c.surface2 }}>
        {(
          [
            ['30', tr('30 days', '30 நாட்கள்')],
            ['365', tr('12 months', '12 மாதங்கள்')],
            ['all', tr('All time', 'எல்லாக் காலமும்')],
          ] as const
        ).map(([v, label]) => {
          const on = range === v;
          return (
            <Pressable
              key={v}
              onPress={() => {
                setRange(v);
                setTrendPick(null);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={{ flex: 1, minHeight: 40, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.primary : 'transparent' }}>
              <T v="label" color={on ? c.onPrimary : c.ink2} numberOfLines={1} style={{ paddingHorizontal: 4 }}>
                {label}
              </T>
            </Pressable>
          );
        })}
      </View>

      <Rise i={0}>
      <Card style={{ marginTop: 14, overflow: 'hidden' }}>
        <AthangudiCorner size={120} style={{ position: 'absolute', top: 0, right: 0 }} />
        <T v="labelM" color={c.ink3}>
          {tr('Words written', 'எழுதிய சொற்கள்')}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', columnGap: 10, marginTop: 2 }}>
          <T v="display">{trendHead.big}</T>
          <T v="labelM" color={c.ink2} style={{ marginBottom: 8 }}>
            {trendHead.small}
          </T>
        </View>
        {data.change != null && trendPick == null ? (
          <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: c.surface2 }}>
            <T v="small" color={c.ink2}>
              {data.change > 0 ? '▲' : data.change < 0 ? '▼' : '•'} {Math.abs(data.change)}%{' '}
              {range === '30' ? tr('on the 30 days before', 'முந்தைய 30 நாட்களை விட') : tr('on the year before', 'முந்தைய ஆண்டை விட')}
            </T>
          </View>
        ) : null}
        <MayilBorder height={12} style={{ marginTop: 16 }} strength={0.8} />
        <View style={{ marginTop: 14 }}>
          <TrendChart key={range} values={data.values} labels={data.labels} color={c.primary} onPick={setTrendPick} />
        </View>
      </Card>
      </Rise>

      <Rise i={1} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
        <Tile icon="journal" value={String(data.pages)} label={tr(plural(data.pages, 'page', 'pages'), 'பக்கங்கள்')} />
        <Tile icon="calendar" value={String(data.days)} label={tr(plural(data.days, 'day written', 'days written'), data.days === 1 ? 'எழுதிய நாள்' : 'எழுதிய நாட்கள்')} />
        <Tile icon="words" value={String(data.average)} label={tr(plural(data.average, 'word a page', 'words a page'), 'பக்கத்துக்குச் சொற்கள்')} />
        <Tile icon="pen" value={String(data.longest)} label={tr(plural(data.longest, 'word, longest page', 'words, longest page'), 'சொற்கள், நீண்ட பக்கம்')} />
      </Rise>

      <Section title={tr('Writing days', 'எழுதிய நாட்கள்')} note={dayPick ? `${weekdayShort(dayPick, tamil)} ${shortDate(dayPick, tamil)} · ${dayNote(dayPick)}` : tr('Last 18 weeks', 'கடந்த 18 வாரங்கள்')}>
        <Card>
          <Heatmap words={allTime.words} written={allTime.written} weeks={18} picked={dayPick} onPick={setDayPick} />
        </Card>
      </Section>

      {data.moods.length ? (
        <Section title={tr('Feelings', 'உணர்வுகள்')} note={rangeName}>
          <Card style={{ gap: 14 }}>
            {data.moods.map((m, i) => {
              const pct = Math.round((m.n / moodTotal) * 100);
              return (
                <View key={m.id} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <T v="label" style={{ flex: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      {`${m.emoji}  ${tamil ? m.ta : m.en}`}
                    </T>
                    <T v="labelM" color={c.ink3}>
                      {`${m.n} · ${pct}%`}
                    </T>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: alpha(moodTint(m, c), 0.15), overflow: 'hidden' }}>
                    <View style={{ width: `${Math.max(3, (m.n / data.moods[0].n) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: moodTint(m, c) }} />
                  </View>
                </View>
              );
            })}
          </Card>
        </Section>
      ) : null}

      <Section title={tr('When you write', 'நீங்கள் எழுதும் நேரம்')} note={bestPeriod ? tr(`Mostly ${PERIODS[bestPeriod].en.toLowerCase()}`, `பெரும்பாலும் ${PERIODS[bestPeriod].ta}`) : rangeName}>
        <Card>
          <Columns values={data.periods} labels={periodNames} color={c.primary} />
        </Card>
      </Section>

      <Section title={tr('Days of the week', 'வாரத்தின் நாட்கள்')} note={rangeName}>
        <Card>
          <Columns values={data.weekdays} labels={dayNames} color={c.primary} />
        </Card>
      </Section>

      <Section title={tr('The three books', 'முப்பால்')} note={tr('All time', 'எல்லாக் காலமும்')}>
        <Card>
          <BookRings done={allTime.books} />
        </Card>
      </Section>

      {data.topChapters.length ? (
        <Section title={tr('Chapters you return to', 'நீங்கள் திரும்பும் அதிகாரங்கள்')} note={rangeName}>
          <Card style={{ gap: 16 }}>
            {data.topChapters.map(([n, count], i) => {
              const ch = chapter(n);
              const ink = c.isNight ? BOOK_INK[ch.part].night : BOOK_INK[ch.part].day;
              return (
                <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <T v="headline" color={c.ink3} style={{ width: 24, textAlign: 'center' }}>
                    {i + 1}
                  </T>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                      <T v="label" style={{ flex: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                        {tamil ? ch.ta : ch.en}
                      </T>
                      <T v="labelM" color={c.ink3}>
                        {tr(`${count} ${plural(count, 'page', 'pages')}`, `${count} ${count === 1 ? 'பக்கம்' : 'பக்கங்கள்'}`)}
                      </T>
                    </View>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: alpha(ink, 0.15), overflow: 'hidden' }}>
                      <View style={{ width: `${(count / data.topChapters[0][1]) * 100}%`, height: 6, borderRadius: 3, backgroundColor: ink }} />
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        </Section>
      ) : null}

      <Section title={tr('All time', 'எல்லாக் காலமும்')} note={tr(`Since ${shortDate(s.startedOn || firstDay, false)}`, `${shortDate(s.startedOn || firstDay, true)} முதல்`)}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Tile icon="book" value={String(s.read.length)} label={tr(plural(s.read.length, 'couplet read', 'couplets read'), 'படித்த குறள்கள்')} />
          <Tile icon="journey" value={String(thread.longest)} label={tr(plural(thread.longest, 'day, longest thread', 'days, longest thread'), 'நாள், நீண்ட தொடர்')} />
          <Tile icon="gallery" value={String(allTime.photos)} label={tr(plural(allTime.photos, 'photo', 'photos'), 'படங்கள்')} />
          <Tile icon="mic" value={String(allTime.audio + allTime.videos)} label={tr(plural(allTime.audio + allTime.videos, 'voice note or video', 'voice notes and videos'), 'குரல் குறிப்புகள், காணொளிகள்')} />
        </View>
      </Section>
    </Page>
  );
}
