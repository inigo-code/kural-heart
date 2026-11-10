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
import { ActionRow, Avatar, FadeSwap, KuralLeaf, LinkPills, MeaningUnder, Rise, questionText } from '@/ui/common';
import { ArchSky } from '@/ui/dayArt';
import { SikkuThreshold } from '@/ui/kolam';
import { Button, Icon, T } from '@/ui/parts';
import type { IconName } from '@/ui/parts';
import { useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';

/** The sun or moon beside the time of day's name. */
const PERIOD_ICON: Record<string, IconName> = { vaigarai: 'moon', kaalai: 'sunrise', nanpagal: 'sun', erpadu: 'sun', maalai: 'sunrise', yaamam: 'moon' };

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
      <Rise i={0} style={{ flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 20, paddingRight: 8 }}>
        <View style={{ flex: 1, paddingBottom: 10 }}>
          <T v="display">{s.name ? `${tamil ? p.greetTa : p.greetEn},
${s.name.split(' ')[0]}` : tamil ? p.greetTa : p.greetEn}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Icon name={PERIOD_ICON[period]} size={18} color={c.primary} stroke={2} />
            <T v="label" color={c.primary} style={{ flexShrink: 1 }}>
              {tamil ? p.ta : `${p.ta} · ${p.en.toLowerCase()}`}
            </T>
          </View>
        </View>
        <View style={{ width: 156, height: 156, alignItems: 'center', justifyContent: 'flex-end' }}>
          {/* The arch shows the sky of this time of day behind him. */}
          <ArchSky period={period} width={140} height={150} style={{ position: 'absolute', left: 8, top: 6 }} />
          {/* He recites while Listen plays, rests once you've written today, and otherwise reads. */}
          <Valluvar state={playing ? 'teaching' : written ? 'resting' : 'reading'} size={156} label={tr('Valluvar', 'வள்ளுவர்')} />
          <SikkuThreshold height={14} style={{ position: 'absolute', left: 14, right: 14, bottom: -18 }} />
        </View>
      </Rise>
      <Rise i={1} style={{ paddingHorizontal: 20, paddingTop: 30 }}>
        {/* A new couplet fades onto the leaf. */}
        <FadeSwap k={k.n}>
          <KuralLeaf k={k} turned={turned} onPress={() => router.push({ pathname: '/kural/[n]', params: { n: String(k.n) } })} />
        </FadeSwap>
      </Rise>
      <Rise i={2} style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
        <FadeSwap k={k.n}>
          <MeaningUnder k={k} />
        </FadeSwap>
      </Rise>
      <Rise i={3}>
        <ActionRow
          style={{ marginTop: 8 }}
          items={[
            { icon: playing ? 'stop' : 'play', label: playing ? tr('Stop', 'நிறுத்து') : tr('Listen', 'கேள்'), on: playing, onPress: () => readAloud(k, english(k, s.translation)) },
            { icon: 'turn', label: L.turn, on: turned, onPress: () => setTurned(!turned) },
            {
              icon: 'shuffle',
              label: tr('Another', 'வேறு குறள்'),
              onPress: () => {
                stopReading();
                setTurned(false);
                anotherToday();
              },
            },
            { icon: 'share', label: L.share, onPress: () => router.push({ pathname: '/share/[n]', params: { n: String(k.n) } }) },
          ]}
        />
        <LinkPills
          style={{ marginTop: 18 }}
          items={[
            { icon: 'book', label: tr('Choose a couplet', 'குறள் தேர்வு'), onPress: () => router.navigate({ pathname: '/kural', params: { from: 'today' } }) },
            { icon: 'heart', label: L.feel, onPress: () => router.push('/feeling') },
          ]}
        />
      </Rise>
      <Rise i={4} style={{ margin: 20, borderRadius: 28, backgroundColor: c.surface, padding: 18 }}>
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
        <FadeSwap k={`${k.n}-${lens}`}>
          <T v="headline" style={{ marginTop: 14, fontSize: type.headline.fontSize * 0.85, lineHeight: type.headline.lineHeight * 0.88 }}>
            {questionText(k, lens, tamil)}
          </T>
        </FadeSwap>
        <Button
          label={written ? L.keep : L.write}
          icon="pen"
          style={{ marginTop: 16 }}
          onPress={() => {
            const mine = entries.find((e) => e.date === day && e.kural === k.n);
            router.push({ pathname: '/write', params: mine ? { kural: String(k.n), id: mine.id } : { kural: String(k.n) } });
          }}
        />
      </Rise>
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
