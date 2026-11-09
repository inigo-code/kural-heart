import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { chapter } from '@/lib/pack';
import type { Kural } from '@/lib/pack';
import { toggleSaved, useSettings } from '@/lib/settings';

import { kuralRef, partColor } from './common';
import { alpha } from './theme';
import { CoupletText } from './leaf';
import { IconButton, T } from './parts';
import { useUI } from './ui';

/**
 * One couplet in a list: its number, the two lines flush left, and a star to save it. Inside a chapter the chapter
 * isn't repeated under each couplet; elsewhere (search, saved) it is.
 */
export function KuralRow({ k, inChapter }: { k: Kural; inChapter?: boolean }) {
  const { c, tamil, tr } = useUI();
  const s = useSettings();
  const router = useRouter();
  const saved = s.saved.includes(k.n);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/kural/[n]', params: { n: String(k.n) } })}
      accessibilityRole="button"
      accessibilityLabel={`${tr('Kural', 'குறள்')} ${k.n}`}
      style={({ pressed }) => ({ marginHorizontal: 16, marginVertical: 5, borderRadius: 20, backgroundColor: pressed ? c.surface2 : c.surface, paddingTop: 6, paddingBottom: 14, paddingHorizontal: 14 })}>
      {/* The number and the star share a slim top row, so the couplet below gets the card's full width. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: -10 }}>
        <View style={{ minWidth: 40, height: 26, paddingHorizontal: 8, borderRadius: 13, backgroundColor: alpha(partColor(chapter(k.c).part, c), c.isNight ? 0.22 : 0.14), alignItems: 'center', justifyContent: 'center' }}>
          <T v="small" color={partColor(chapter(k.c).part, c)} style={{ fontVariant: ['tabular-nums'] }}>
            {String(k.n)}
          </T>
        </View>
        {inChapter ? null : (
          <T v="labelM" color={c.ink3} numberOfLines={1} style={{ flex: 1, marginHorizontal: 10 }}>
            {kuralRef(k, tamil)}
          </T>
        )}
        <IconButton
          name="star"
          label={saved ? tr('Remove from saved', 'சேமிப்பிலிருந்து நீக்கு') : tr('Save', 'சேமி')}
          onPress={() => toggleSaved(k.n)}
          color={saved ? c.gold : c.ink3}
          size={22}
        />
      </View>
      <CoupletText a={k.a} b={k.b} max={20} min={15} color={c.ink} />
    </Pressable>
  );
}
