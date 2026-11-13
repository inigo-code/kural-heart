import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentThread } from '@/lib/actions';
import { useTabTop } from '@/lib/tabTop';
import { PERIODS, anotherToday, pick, todayKural } from '@/lib/daily';
import { longDate } from '@/lib/dates';
import { useJournal } from '@/lib/journal';
import { english, kural } from '@/lib/pack';
import { useSettings } from '@/lib/settings';
import { readAloud, stopReading, useSpeaker } from '@/lib/speak';
import { ActionRow, Avatar, KuralLeaf, LensQuestion, LinkPills, MeaningUnder, Rise, SmoothHeight, WisdomNote, useCrossfade } from '@/ui/common';
import { ArchSky } from '@/ui/dayArt';
import { KolamBand, KolamRing, SikkuThreshold } from '@/ui/kolam';
import { ActionCard, Button, Icon, raised, T } from '@/ui/parts';
import type { IconName } from '@/ui/parts';
import { useToday, useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';

/** The sun or moon beside the time of day's name. */
const PERIOD_ICON: Record<string, IconName> = { vaigarai: 'moon', kaalai: 'sunrise', nanpagal: 'sun', erpadu: 'sun', maalai: 'sunrise', yaamam: 'moon' };

export default function TodayScreen() {
  const { c, L, tamil, tr, period } = useUI();
  const s = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useTabTop('index', () => scroll.current?.scrollTo({ y: 0, animated: true }));
  const { entries } = useJournal();
  const speaker = useSpeaker();
  const day = useToday();
  // Reading s.dayLog keeps this in step when today's couplet changes; a new day is recorded after drawing.
  const k = kural(s.dayLog[day] ?? pick(s.dayLog, s.seed, day, s.promptMode === 'random'));
  useEffect(() => {
    todayKural(day);
  }, [day]);
  const written = entries.some((e) => e.date === day);
  // The page written today on this couplet, if there is one: the button keeps writing it, and says so.
  const mine = entries.find((e) => e.date === day && e.kural === k.n);
  const thread = currentThread(day);
  // Turned belongs to the couplet it was turned on: a new day's or another couplet starts face up.
  const [turnedFor, setTurnedFor] = useState<number | null>(null);
  const turned = turnedFor === k.n;
  const p = PERIODS[period];
  const playing = speaker.speaking === k.n;
  // A new couplet fades out and in on the leaf and under it together, and the space they take eases to its new size.
  const [shownN, leafFade] = useCrossfade(k.n);
  const shownK = kural(shownN);
  // A new couplet on screen: whatever was being read stops, so Listen always reads what you see.
  useEffect(() => {
    stopReading();
  }, [k.n]);
  return (
    <ScrollView ref={scroll} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 12, minHeight: 56 }}>
        {/* The date, underlined with a short row of pulli kolam, as a threshold is drawn each morning. */}
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <T v="label" color={c.ink2}>
            {longDate(day, tamil)}
          </T>
          <KolamBand height={10} strength={1.1} style={{ width: 132, marginTop: 6 }} />
        </View>
        <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel={tr('Your profile', 'உங்கள் சுயவிவரம்')} hitSlop={6}>
          <KolamRing size={52}>
            <Avatar size={40} />
          </KolamRing>
        </Pressable>
      </View>
      <Rise i={0} style={{ flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 20, paddingRight: 8 }}>
        <View style={{ flex: 1, paddingBottom: 10 }}>
          <T v="display">{s.name ? `${tamil ? p.greetTa : p.greetEn},
${s.name.split(' ')[0]}` : tamil ? p.greetTa : p.greetEn}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Icon name={PERIOD_ICON[period]} size={18} color={c.primary} stroke={2} />
            {/* Tamil and English as separate pieces: one mixed line can be measured short on Android and lose its end. */}
            <T v="label" color={c.primary} numberOfLines={1}>
              {p.ta}
            </T>
            {tamil ? null : (
              <T v="label" color={c.primary} numberOfLines={1}>
                {`· ${p.en.toLowerCase()}`}
              </T>
            )}
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
        <SmoothHeight bleed={10}>
          <Animated.View style={leafFade}>
            <KuralLeaf k={shownK} turned={turned} onPress={() => router.push({ pathname: '/kural/[n]', params: { n: String(shownK.n) } })} />
          </Animated.View>
        </SmoothHeight>
      </Rise>
      <Rise i={2} style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <SmoothHeight style={{ paddingBottom: 12 }}>
          <Animated.View style={leafFade}>
            <MeaningUnder k={shownK} />
            <WisdomNote k={shownK} style={{ marginTop: 14 }} />
          </Animated.View>
        </SmoothHeight>
      </Rise>
      <Rise i={3}>
        <ActionRow
          style={{ marginTop: 18 }}
          items={[
            { icon: playing ? 'stop' : 'play', label: playing ? tr('Stop', 'நிறுத்து') : tr('Listen', 'கேள்'), on: playing, onPress: () => readAloud(k, english(k, s.translation)) },
            { icon: 'turn', label: L.turn, on: turned, onPress: () => setTurnedFor(turned ? null : k.n) },
            {
              icon: 'shuffle',
              label: tr('Another', 'வேறு குறள்'),
              onPress: () => {
                stopReading();
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
      <Rise i={4} style={{ margin: 20, borderRadius: 28, backgroundColor: c.surface, padding: 18, ...raised(c) }}>
        <T v="label" color={c.ink3}>
          {L.todayQ}
        </T>
        <LensQuestion k={k} />
        <Button
          label={mine ? L.keep : L.write}
          icon="pen"
          style={{ marginTop: 16 }}
          onPress={() => router.push({ pathname: '/write', params: mine ? { kural: String(k.n), id: mine.id } : { kural: String(k.n) } })}
        />
      </Rise>
      {thread.days > 0 ? (
        <Rise i={5}>
          <ActionCard
            icon="journey"
            title={L.threadDays(thread.days)}
            sub={tr('Your seals, chapters and insights', 'உங்கள் முத்திரைகள், அதிகாரங்கள், புள்ளிவிவரங்கள்')}
            onPress={() => router.navigate('/journey')}
            style={{ marginHorizontal: 20 }}
          />
        </Rise>
      ) : null}
    </ScrollView>
  );
}
