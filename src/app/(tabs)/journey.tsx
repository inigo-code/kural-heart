import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentThread } from '@/lib/actions';
import { addDays, parseDay, monthName, today } from '@/lib/dates';
import { useJournal } from '@/lib/journal';
import { CHAPTERS, PARTS, kural } from '@/lib/pack';
import type { Part } from '@/lib/pack';
import { SEALS, sealProgress } from '@/lib/progress';
import { useSettings } from '@/lib/settings';
import { partColor } from '@/ui/common';
import { Button, SectionLabel, T } from '@/ui/parts';
import { useRouter } from 'expo-router';
import { SealMedal } from '@/ui/seal';
import { alpha } from '@/ui/theme';
import { useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';

export default function JourneyScreen() {
  const { c, L, tamil, type, tr } = useUI();
  const router = useRouter();
  const s = useSettings();
  const insets = useSafeAreaInsets();
  const { entries } = useJournal();
  const thread = currentThread();
  const t = today();
  const written = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
  const chaptersWritten = useMemo(() => new Set(entries.map((e) => kural(e.kural).c)), [entries]);
  const since = s.startedOn ? `${parseDay(s.startedOn).getDate()} ${monthName(parseDay(s.startedOn).getMonth(), tamil)}` : null;
  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 28 }}>
      <T v="display" style={{ marginLeft: 4 }}>
        {L.journey}
      </T>
      {since ? (
        <T v="label" color={c.ink3} style={{ marginLeft: 4 }}>
          {L.since(since)}
        </T>
      ) : null}
      <View style={{ marginTop: 16, borderRadius: 28, backgroundColor: c.surface, padding: 18, flexDirection: 'row', alignItems: 'center' }}>
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
        </View>
        {/* On a day you've written he celebrates; otherwise he walks on with you. */}
        <Valluvar state={thread.writtenToday ? 'celebrating' : 'walking'} size={150} headroom={0.12} />
      </View>
      <T v="labelM" color={c.ink3} style={{ marginHorizontal: 4, marginVertical: 8 }}>
        {L.restNote}
      </T>
      <Button label={tr('See your insights', 'உங்கள் புள்ளிவிவரங்கள்')} icon="chart" tonal onPress={() => router.push('/insights')} style={{ marginTop: 4 }} />
      <SectionLabel>{`${L.chapters} · ${chaptersWritten.size} ${L.of133}`}</SectionLabel>
      <View style={{ borderRadius: 24, backgroundColor: c.surface, padding: 16 }}>
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
      <SectionLabel>{L.seals}</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', rowGap: 14 }}>
        {SEALS.map((seal) => {
          const has = !!s.seals[seal.id];
          const [done, of] = sealProgress(seal.id, entries, thread);
          return (
            <View key={seal.id} style={{ width: 104, alignItems: 'center' }}>
              <SealMedal seal={seal} earned={has} size={76} />
              <T v="label" style={{ textAlign: 'center' }}>
                {tamil ? seal.ta : seal.en}
              </T>
              <T v="labelM" color={c.ink3} style={{ textAlign: 'center' }}>
                {has ? L.sealEarned : `${tamil ? seal.ct : seal.ce} · ${done}/${of}`}
              </T>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
