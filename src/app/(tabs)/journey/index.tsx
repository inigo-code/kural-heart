import { useMemo, useRef } from 'react';
import type { ComponentRef } from 'react';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentThread } from '@/lib/actions';
import { useTabTop } from '@/lib/tabTop';
import { addDays, parseDay, monthName, today } from '@/lib/dates';
import { useJournal } from '@/lib/journal';
import { CHAPTERS, PARTS, kural } from '@/lib/pack';
import type { Part } from '@/lib/pack';
import { SEALS, sealProgress } from '@/lib/progress';
import { useSettings } from '@/lib/settings';
import { Rise, partColor } from '@/ui/common';
import { ActionCard, raised, SectionLabel, T } from '@/ui/parts';
import { useRouter } from 'expo-router';
import { SealMedal } from '@/ui/seal';
import { alpha } from '@/ui/theme';
import { useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';

export default function JourneyScreen() {
  const { c, L, tamil, type, tr, still } = useUI();
  const router = useRouter();
  const s = useSettings();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useTabTop('journey', () => scroll.current?.scrollTo({ y: 0, animated: true }));
  const { entries } = useJournal();
  const thread = currentThread();
  const t = today();
  const written = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
  const chaptersWritten = useMemo(() => new Set(entries.map((e) => kural(e.kural).c)), [entries]);
  const since = s.startedOn ? `${parseDay(s.startedOn).getDate()} ${monthName(parseDay(s.startedOn).getMonth(), tamil)}` : null;
  return (
    <ScrollView ref={scroll} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 28 }}>
      <T v="display" style={{ marginLeft: 4 }}>
        {L.journey}
      </T>
      {since ? (
        <T v="label" color={c.ink3} style={{ marginLeft: 4 }}>
          {L.since(since)}
        </T>
      ) : null}
      <Rise i={0} style={{ marginTop: 16, borderRadius: 28, backgroundColor: c.surface, padding: 18, flexDirection: 'row', alignItems: 'center', ...raised(c) }}>
        <View style={{ flex: 1 }}>
          <T v="display" style={{ fontSize: type.display.fontSize * 1.4, lineHeight: type.display.lineHeight * 1.3 }}>
            {thread.days}
          </T>
          <T v="bodyM" color={c.ink2}>
            {L.threadDays(thread.days)}
          </T>
          <T v="labelM" color={c.ink3}>
            {L.longest(thread.longest)}
          </T>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }} accessible accessibilityLabel={L.week(thread.lastSeven)}>
            {[6, 5, 4, 3, 2, 1, 0].map((i) => (
              <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: written.has(addDays(t, -i)) ? c.heart : c.surface3 }} />
            ))}
          </View>
          <T v="small" color={c.ink3} style={{ marginTop: 8 }}>
            {L.restNote}
          </T>
        </View>
        {/* On a day you've written he celebrates; otherwise he walks on with you. */}
        <Valluvar state={thread.writtenToday ? 'celebrating' : 'walking'} size={150} headroom={0.12} />
      </Rise>
      <Rise i={1}>
        <ActionCard
          icon="chart"
          title={tr('See your insights', 'உங்கள் புள்ளிவிவரங்கள்')}
          sub={tr('Your words, feelings, writing times and chapters', 'உங்கள் சொற்கள், உணர்வுகள், எழுதும் நேரங்கள், அதிகாரங்கள்')}
          onPress={() => router.push('/journey/insights')}
          style={{ marginTop: 14 }}
        />
      </Rise>
      <Rise i={2}>
      <SectionLabel>{`${L.chapters} · ${chaptersWritten.size} ${L.of133}`}</SectionLabel>
      <View style={{ borderRadius: 24, backgroundColor: c.surface, padding: 16, ...raised(c) }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
          {CHAPTERS.map((ch) => {
            const col = partColor(ch.part, c);
            return <View key={ch.n} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: chaptersWritten.has(ch.n) ? col : alpha(col, 0.14) }} />;
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
          {(['aram', 'porul', 'inbam'] as Part[]).map((p) => (
            <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: partColor(p, c) }} />
              <T v="labelM" color={c.ink2}>
                {tamil ? PARTS[p].ta : PARTS[p].en}
              </T>
            </View>
          ))}
        </View>
      </View>
      </Rise>
      <SectionLabel>{L.seals}</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', rowGap: 14 }}>
        {SEALS.map((seal, i) => {
          const has = !!s.seals[seal.id];
          const [done, of] = sealProgress(seal.id, entries, thread);
          return (
            // The seals pop into place one after another.
            <Animated.View key={seal.id} entering={still ? undefined : ZoomIn.delay(200 + i * 60).springify().damping(14)} style={{ width: 104, alignItems: 'center' }}>
              <SealMedal seal={seal} earned={has} size={76} />
              <T v="label" style={{ textAlign: 'center' }}>
                {tamil ? seal.ta : seal.en}
              </T>
              <T v="labelM" color={c.ink3} style={{ textAlign: 'center' }}>
                {has ? L.sealEarned : `${tamil ? seal.ct : seal.ce} · ${done}/${of}`}
              </T>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}
