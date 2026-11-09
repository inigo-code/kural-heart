import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { forMood } from '@/lib/daily';
import { kural } from '@/lib/pack';
import { useSettings } from '@/lib/settings';
import { KuralLeaf, MOODS, MeaningUnder, MoodChip, Wrap } from '@/ui/common';
import { Button, Chip, Icon, Page, T, TextLink } from '@/ui/parts';
import { useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';

/** How is your heart? Pick a feeling and Valluvar finds a couplet for it. "Very heavy" also offers support. */
export default function FeelingScreen() {
  const { c, L } = useUI();
  const s = useSettings();
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const k = mood ? kural(forMood(mood, s.seed, attempt)) : null;
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
          <KuralLeaf k={k} />
          <View style={{ marginTop: 10 }}>
            <MeaningUnder k={k} />
          </View>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Chip label={L.another} icon="turn" onPress={() => setAttempt(attempt + 1)} />
          </View>
          <Button label={L.write} icon="pen" style={{ marginTop: 14 }} onPress={() => router.replace({ pathname: '/write', params: { kural: String(k.n) } })} />
        </>
      ) : null}
    </Page>
  );
}

/** Support lines. No number is ever shown until it comes from a checked list for the reader's country. */
function HeavyDays({ onNotNow }: { onNotNow: () => void }) {
  const { c, L } = useUI();
  return (
    <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: c.surface, padding: 16 }}>
      <T v="headline">{L.heavyTitle}</T>
      <T v="bodyM" color={c.ink2} style={{ marginTop: 6 }}>
        {L.heavyBody}
      </T>
      {(
        [
          [L.heavyLineName, L.heavyLineNote],
          [L.heavyPerson, L.heavyPersonNote],
        ] as const
      ).map(([t, sub]) => (
        <View key={t} style={{ marginTop: 10, borderRadius: 16, backgroundColor: c.surface2, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <T v="label">{t}</T>
            <T v="labelM" color={c.ink3}>
              {sub}
            </T>
          </View>
          <Icon name="phone" color={c.ink3} />
        </View>
      ))}
      <TextLink label={L.heavyNotNow} onPress={onNotNow} />
    </View>
  );
}
