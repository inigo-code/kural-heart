import { Circle, DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import type { Period } from '@/lib/daily';

import { SkiaStill } from './still';
import { alpha } from './theme';
import { useUI } from './ui';

/** The sky's two tones, top to bottom, for each time of day: [Ivory, Midnight]. */
const SKY: Record<Period, [[string, string], [string, string]]> = {
  vaigarai: [['#DCD5EC', '#F1EAE3'], ['#2D2A47', '#1F1B22']],
  kaalai: [['#FBDDBF', '#F4ECDF'], ['#4B3424', '#251F1A']],
  nanpagal: [['#D9E8F1', '#F2EEE6'], ['#26343F', '#1F1D1B']],
  erpadu: [['#F6D5A8', '#F2EADB'], ['#4A3620', '#241F19']],
  maalai: [['#F0C4B3', '#EEE1D9'], ['#47282B', '#221B1B']],
  yaamam: [['#CCD0E6', '#ECE8EF'], ['#1E2342', '#19171E']],
};

/** The app's heart (the line icon's outline), 24 by 24. */
const HEART = 'M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20Z';

/**
 * The sky of the six Tamil times of day, inside the arch behind Valluvar on Today: a wash of that hour's colour, a
 * soft heart (the app's) that he sits in, his head in its cleft and never ringed by it, and at night a few stars in
 * the arch's far corners. The sun and moon are not drawn here, where they would crowd his
 * head (or read as a halo); a small sun or moon sits by the time of day's name instead.
 */
export function ArchSky({ period, width, height, style }: { period: Period; width: number; height: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useUI();
  const [top, bottom] = SKY[period][c.isNight ? 1 : 0];
  const night = period === 'yaamam' || period === 'vaigarai';
  const heart = Skia.Path.MakeFromSVGString(HEART)!;
  const k = (width * 0.9) / 14;
  const star = c.isNight ? alpha('#F3E7C6', 0.75) : alpha('#5F6690', 0.5);
  // Stars keep to the two outer edges, beside his head and arms, never behind them.
  const stars = [
    [0.12, 0.42, 1.6],
    [0.2, 0.3, 1.1],
    [0.07, 0.58, 1.0],
    [0.86, 0.33, 1.5],
    [0.92, 0.5, 1.1],
  ].map(([x, y, r]) => ({ x: x * width, y: y * height, r }));
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, overflow: 'hidden', borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
        style,
      ]}>
      <LinearGradient colors={[top, bottom]} locations={[0, 0.85]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <SkiaStill width={width} height={height} sig={`${period} ${width} ${height} ${c.isNight} ${c.primary}`}>
        <Group>
          {/* The heart's 14-wide outline scaled to most of the arch, its point on the threshold. */}
          <Group transform={[{ translateX: width / 2 - 12 * k }, { translateY: height * 0.98 - 20 * k }, { scale: k }]}>
            <Path path={heart} color={alpha(c.primary, c.isNight ? 0.16 : 0.1)} />
            <Path path={heart} color={alpha(c.primary, c.isNight ? 0.5 : 0.38)} style="stroke" strokeWidth={2.2 / k} strokeCap="round">
              <DashPathEffect intervals={[0.01, 6 / k]} />
            </Path>
          </Group>
          {night
            ? stars.map((s, i) => <Circle key={i} cx={s.x} cy={s.y} r={s.r} color={star} />)
            : null}
        </Group>
      </SkiaStill>
    </View>
  );
}
