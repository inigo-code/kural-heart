import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { useJournal } from '@/lib/journal';
import { AtlasMap } from '@/ui/atlas';
import type { MapPoint } from '@/ui/atlas';
import { EntryCard } from '@/ui/common';
import { Page, T } from '@/ui/parts';
import { useUI } from '@/ui/ui';

/** Every page with a place, on a map. Tap a pin to see its pages below. */
export default function AtlasScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const { c, tr } = useUI();
  const { entries } = useJournal();
  const { height } = useWindowDimensions();
  const points: MapPoint[] = useMemo(
    () => entries.flatMap((e) => (e.place?.lat != null && e.place?.lon != null ? [{ id: e.id, lat: e.place.lat, lon: e.place.lon }] : [])),
    [entries],
  );
  const [chosen, setChosen] = useState<string[]>(focus ? [focus] : []);
  const shown = entries.filter((e) => chosen.includes(e.id));
  return (
    <Page title={tr('Atlas', 'வரைபடம்')} scrollProps={{ scrollEnabled: true }}>
      <AtlasMap points={points} height={Math.round(height * 0.5)} focus={focus} selected={chosen} onSelect={setChosen} />
      <T v="labelM" color={c.ink3} style={{ marginTop: 10 }}>
        {tr(`${points.length} pages with a place · drag to move, + and − to zoom`, `இடத்துடன் ${points.length} பக்கங்கள் · நகர்த்த இழுக்கவும்`)}
      </T>
      <View style={{ marginHorizontal: -16, marginTop: 8 }}>
        {shown.map((e) => (
          <EntryCard key={e.id} e={e} />
        ))}
      </View>
    </Page>
  );
}
