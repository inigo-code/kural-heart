import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SEALS } from '@/lib/progress';
import { Button, T } from '@/ui/parts';
import { SealMedal } from '@/ui/seal';
import { useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';

/** A new seal: Valluvar holds it up, with a burst behind him. */
export default function AwardScreen() {
  const { ids } = useLocalSearchParams<{ ids: string }>();
  const { c, L, tamil } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const seals = (ids ?? '')
    .split(',')
    .map((id) => SEALS.find((x) => x.id === id))
    .filter((x): x is (typeof SEALS)[number] => !!x);
  const s = seals[0] ?? SEALS[0];
  const size = 280;
  // Room above him: the awarding pose lifts the seal (and his head) above the art's frame.
  const headroom = 0.28;
  const top = Math.round(headroom * ((size * 220) / 240));
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, alignItems: 'center' }}>
      <View style={{ flex: 1 }} />
      <T v="label" color={c.primary}>
        {L.newSeal}
      </T>
      <View style={{ height: 8 }} />
      <View style={{ alignItems: 'center' }}>
        <Valluvar state="awarding" size={size} once headroom={headroom} />
        {/* The seal sits over the medallion in his hands: art centre (120, 126) of 240 by 220. */}
        <View style={{ position: 'absolute', top: top + (126 / 240) * size - 84 * (58 / 120) }}>
          <SealMedal seal={s} earned size={84} />
        </View>
      </View>
      <T v="display" style={{ textAlign: 'center', marginTop: 12 }}>
        {tamil ? s.ta : s.en}
      </T>
      <T v="body" color={c.ink2} style={{ textAlign: 'center' }}>
        {tamil ? s.ct : s.ce}
      </T>
      {seals.length > 1 ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {seals.slice(1).map((o) => (
            <SealMedal key={o.id} seal={o} earned size={48} />
          ))}
        </View>
      ) : null}
      <View style={{ flex: 1 }} />
      <Button label={L.continueLabel} onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}
