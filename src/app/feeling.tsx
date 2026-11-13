import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { forMood } from '@/lib/daily';
import { COUNTRIES, ELSEWHERE_URL, homeCountry } from '@/lib/helplines';
import { kural } from '@/lib/pack';
import { useSettings } from '@/lib/settings';
import { KuralLeaf, MOODS, MeaningUnder, MoodChip, SmoothHeight, WisdomNote, Wrap, useCrossfade } from '@/ui/common';
import { Button, Chip, Icon, Page, raised, T, TextLink } from '@/ui/parts';
import { useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';

/** How is your heart? Pick a feeling and Valluvar finds a couplet for it. "Very heavy" also offers support. */
export default function FeelingScreen() {
  const { c, L } = useUI();
  const s = useSettings();
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const picked = mood ? forMood(mood, s.seed, attempt) : 0;
  // Another couplet fades out and in, and the space eases to its size, instead of the page jumping under it.
  const [shownN, fade] = useCrossfade(picked);
  const k = shownN ? kural(shownN) : null;
  return (
    <Page title={L.feel} close>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <T v="body" color={c.ink2} style={{ flex: 1 }}>
          {L.feelSub}
        </T>
        <Valluvar state="contemplating" size={140} />
      </View>
      <Wrap style={{ marginTop: 10 }}>
        {MOODS.map((m) => (
          <MoodChip
            key={m.id}
            m={m}
            on={mood === m.id}
            onPress={() => {
              setMood(m.id);
              setAttempt(0);
            }}
          />
        ))}
      </Wrap>
      {mood === 'heavy' ? <HeavyDays onNotNow={() => setMood('calm')} /> : null}
      {k ? (
        <>
          <T v="label" color={c.ink3} style={{ marginTop: 18, marginBottom: 10 }}>
            {L.forNow}
          </T>
          <SmoothHeight bleed={10}>
            <Animated.View style={fade}>
              <KuralLeaf k={k} />
              <View style={{ marginTop: 10 }}>
                <MeaningUnder k={k} />
                <WisdomNote k={k} style={{ marginTop: 12 }} />
              </View>
            </Animated.View>
          </SmoothHeight>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Chip label={L.another} icon="shuffle" onPress={() => setAttempt(attempt + 1)} />
          </View>
          <Button label={L.write} icon="pen" style={{ marginTop: 14 }} onPress={() => router.replace({ pathname: '/write', params: { kural: String(k.n) } })} />
        </>
      ) : null}
    </Page>
  );
}

/**
 * Support for a very heavy day: the checked helplines for the reader's country (from the phone's region; any other
 * listed country one tap away), the emergency number, and someone close. Each opens the phone's dialler with the
 * number filled in; nothing is called without the person pressing Call there.
 */
function HeavyDays({ onNotNow }: { onNotNow: () => void }) {
  const { c, L, tamil, tr } = useUI();
  const [country, setCountry] = useState(homeCountry);
  const [picking, setPicking] = useState(false);
  const dial = (n: string) => Linking.openURL(`tel:${n}`).catch(() => {});
  return (
    <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: c.surface, padding: 16, ...raised(c) }}>
      <T v="headline">{L.heavyTitle}</T>
      <T v="bodyM" color={c.ink2} style={{ marginTop: 6 }}>
        {L.heavyBody}
      </T>
      {country.lines.map((line) => (
        <Pressable
          key={line.dial}
          onPress={() => dial(line.dial)}
          accessibilityRole="button"
          accessibilityLabel={`${tr('Call', 'அழை')} ${line.name}, ${line.number}`}
          style={({ pressed }) => ({ marginTop: 12, borderRadius: 18, backgroundColor: pressed ? c.surface3 : c.surface2, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 })}>
          <View style={{ flex: 1 }}>
            <T v="label">{line.name}</T>
            <T v="labelM" color={c.ink3}>
              {tamil ? line.noteTa : line.note}
            </T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, backgroundColor: c.primary, paddingHorizontal: 14, paddingVertical: 9 }}>
            <Icon name="phone" size={17} color={c.onPrimary} stroke={2} />
            <T v="label" color={c.onPrimary} style={{ fontVariant: ['tabular-nums'] }}>
              {line.number}
            </T>
          </View>
        </Pressable>
      ))}
      <Pressable
        onPress={() => dial('')}
        accessibilityRole="button"
        style={({ pressed }) => ({ marginTop: 10, borderRadius: 18, backgroundColor: pressed ? c.surface3 : c.surface2, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 })}>
        <View style={{ flex: 1 }}>
          <T v="label">{L.heavyPerson}</T>
          <T v="labelM" color={c.ink3}>
            {L.heavyPersonNote}
          </T>
        </View>
        <Icon name="user" size={22} color={c.ink2} />
      </Pressable>
      <Pressable onPress={() => dial(country.emergency)} accessibilityRole="button" hitSlop={4} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="shield" size={18} color={c.heart} />
        <T v="labelM" color={c.ink2} style={{ flex: 1 }}>
          {tr('In danger right now? Call ', 'இப்போது ஆபத்தில் இருக்கிறீர்களா? அழையுங்கள் ')}
          <T v="label" color={c.heart}>
            {country.emergency}
          </T>
        </T>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <T v="small" color={c.ink3} style={{ flex: 1 }}>
          {tr(`Lines for ${country.en}`, `${country.ta} உதவி எண்கள்`)}
        </T>
        <TextLink label={picking ? tr('Done', 'முடிந்தது') : tr('Another country', 'வேறு நாடு')} onPress={() => setPicking(!picking)} />
      </View>
      {picking ? (
        <Wrap>
          {COUNTRIES.map((k) => (
            <Chip
              key={k.id}
              small
              label={tamil ? k.ta : k.en}
              on={k.id === country.id}
              onPress={() => {
                setCountry(k);
                setPicking(false);
              }}
            />
          ))}
          <Chip small icon="search" label={tr('Elsewhere', 'பிற நாடுகள்')} onPress={() => Linking.openURL(ELSEWHERE_URL).catch(() => {})} />
        </Wrap>
      ) : null}
      <TextLink label={L.heavyNotNow} onPress={onNotNow} />
    </View>
  );
}
