import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentThread } from '@/lib/actions';
import { PERIODS, anotherToday, pick, todayKural } from '@/lib/daily';
import { longDate, today } from '@/lib/dates';
import { useJournal } from '@/lib/journal';
import { english, kural } from '@/lib/pack';
import { setSettings, useSettings } from '@/lib/settings';
import { readAloud, stopReading, useSpeaker } from '@/lib/speak';
import { ActionGrid, Avatar, KuralLeaf, MeaningUnder, questionText } from '@/ui/common';
import { DayArt } from '@/ui/dayArt';
import { SikkuThreshold } from '@/ui/kolam';
import { Button, Icon, T } from '@/ui/parts';
import { useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';

export default function TodayScreen() {
  const { c, L, tamil, tr, period, type } = useUI();
  const s = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries } = useJournal();
  const speaker = useSpeaker();
  const day = today();
  // Reading s.dayLog keeps this in step when today's couplet changes; a new day is recorded after drawing.
  const k = kural(s.dayLog[day] ?? pick(s.dayLog, s.seed, day, s.promptMode === 'random'));
  useEffect(() => {
    todayKural(day);
  }, [day]);
  const written = entries.some((e) => e.date === day);
  const thread = currentThread();
  const [turned, setTurned] = useState(false);
  const lens = s.lastLens;
  const p = PERIODS[period];
  const playing = speaker.speaking === k.n;
  // A new couplet on screen: whatever was being read stops, so Listen always reads what you see.
  useEffect(() => {
    stopReading();
  }, [k.n]);
  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 12, minHeight: 48 }}>
        <T v="label" color={c.ink3} style={{ flex: 1 }}>
          {longDate(day, tamil)}
        </T>
        <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel={tr('Your profile', 'உங்கள் சுயவிவரம்')} hitSlop={6}>
          <Avatar size={40} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 20, paddingRight: 8 }}>
        <View style={{ flex: 1, paddingBottom: 10 }}>
          {/* The sky of this time of day, faint behind the greeting. */}
          <DayArt period={period} style={{ position: 'absolute', left: -20, right: -8, top: -36, bottom: 0 }} />
          <T v="display">{s.name ? `${tamil ? p.greetTa : p.greetEn},
${s.name.split(' ')[0]}` : tamil ? p.greetTa : p.greetEn}</T>
          <T v="label" color={c.primary} style={{ marginTop: 4 }}>
            {tamil ? p.ta : `${p.ta} · ${p.en.toLowerCase()}`}
          </T>
        </View>
        <View style={{ width: 156, height: 156, alignItems: 'center', justifyContent: 'flex-end' }}>
          <View style={{ position: 'absolute', left: 8, right: 8, top: 6, bottom: 0, backgroundColor: c.surface2, borderTopLeftRadius: 78, borderTopRightRadius: 78, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }} />
          {/* He recites while Listen plays, rests once you've written today, and otherwise reads. */}
          <Valluvar state={playing ? 'teaching' : written ? 'resting' : 'reading'} size={156} label={tr('Valluvar', 'வள்ளுவர்')} />
          <SikkuThreshold height={14} style={{ position: 'absolute', left: 14, right: 14, bottom: -18 }} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 30 }}>
        <KuralLeaf k={k} turned={turned} onPress={() => router.push({ pathname: '/kural/[n]', params: { n: String(k.n) } })} />
      </View>
      <View style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
        <MeaningUnder k={k} />
      </View>
      <ActionGrid
        items={[
          { icon: playing ? 'stop' : 'play', label: playing ? tr('Stop', 'நிறுத்து') : tr('Listen', 'கேள்'), on: playing, onPress: () => readAloud(k, english(k, s.translation)) },
          { icon: 'turn', label: L.turn, on: turned, onPress: () => setTurned(!turned) },
          {
            icon: 'sync',
            label: tr('Another couplet', 'வேறு குறள்'),
            onPress: () => {
              stopReading();
              anotherToday();
            },
          },
          { icon: 'book', label: tr('Choose from the Kural', 'குறளைத் தேர்ந்தெடு'), onPress: () => router.navigate({ pathname: '/kural', params: { from: 'today' } }) },
          { icon: 'share', label: L.share, onPress: () => router.push({ pathname: '/share/[n]', params: { n: String(k.n) } }) },
          { icon: 'heart', label: L.feel, onPress: () => router.push('/feeling') },
        ]}
      />
      <View style={{ margin: 20, borderRadius: 28, backgroundColor: c.surface, padding: 18 }}>
        <T v="label" color={c.ink3}>
          {L.todayQ}
        </T>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {L.lens.map((name, i) => {
            const on = lens === i;
            return (
              <Pressable
                key={name}
                onPress={() => setSettings({ lastLens: i })}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={{ borderRadius: 16, backgroundColor: on ? c.primary : c.surface2, minHeight: 36, paddingHorizontal: 14, paddingVertical: 8 }}>
                <T v="label" color={on ? c.onPrimary : c.ink2}>
                  {name}
                </T>
              </Pressable>
            );
          })}
        </View>
        <T v="headline" style={{ marginTop: 14, fontSize: type.headline.fontSize * 0.85, lineHeight: type.headline.lineHeight * 0.88 }}>
          {questionText(k, lens, tamil)}
        </T>
        <Button
          label={written ? L.keep : L.write}
          icon="pen"
          style={{ marginTop: 16 }}
          onPress={() => {
            const mine = entries.find((e) => e.date === day && e.kural === k.n);
            router.push({ pathname: '/write', params: mine ? { kural: String(k.n), id: mine.id } : { kural: String(k.n) } });
          }}
        />
      </View>
      {thread.days > 0 ? (
        <Pressable
          onPress={() => router.navigate('/journey')}
          style={{ marginHorizontal: 20, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, backgroundColor: c.inbamSoft, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Icon name="heart" color={c.heart} size={20} />
          <T v="label">{L.threadDays(thread.days)}</T>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
