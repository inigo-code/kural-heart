import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { pronounce, scholarly } from '@/lib/translit';
import { useSettings } from '@/lib/settings';

import { F, alpha } from './theme';
import { useUI } from './ui';

/**
 * The palm-leaf card: a dried olai with its string hole, three faint ribs and darker edges. Mirrors `.leaf` in
 * docs/canvas/project/olai.css. Couplets are always set flush left, as they are written on the leaf.
 */
export function Leaf({ children, mini, style }: { children: ReactNode; mini?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c } = useUI();
  const rib = c.leafRib;
  const r = mini ? 3 : 4;
  return (
    <View
      style={[
        {
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          elevation: 6,
          shadowColor: '#3C280A',
          backgroundColor: c.leaf2,
        },
        style,
      ]}>
      <View style={{ borderRadius: 14, overflow: 'hidden', minHeight: mini ? 0 : 138, paddingHorizontal: 14, paddingTop: mini ? 20 : 26, paddingBottom: mini ? 12 : 16, justifyContent: 'center' }}>
        <LinearGradient colors={[c.leaf1, c.leaf2]} style={StyleSheet.absoluteFill} />
        {/* Two faint ribs by the edges, at fixed places, so they never run through a line of writing. */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: mini ? 6 : 7, height: 1, backgroundColor: alpha(rib, 0.1) }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: mini ? 5 : 6, height: 1, backgroundColor: alpha(rib, 0.1) }} />
        <LinearGradient
          colors={[alpha(rib, 0.09), 'transparent', 'transparent', alpha(rib, 0.09)]}
          locations={[0, 0.06, 0.94, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient colors={['transparent', alpha(rib, 0.18)]} locations={[0.8, 1]} style={StyleSheet.absoluteFill} />
        <View
          style={{
            position: 'absolute',
            top: (mini ? 10 : 13) - r - 0.75,
            alignSelf: 'center',
            width: (r + 0.75) * 2,
            height: (r + 0.75) * 2,
            borderRadius: r + 1,
            backgroundColor: c.surface,
            borderWidth: 1.5,
            borderColor: alpha(rib, 0.28),
          }}
        />
        <View style={{ alignItems: 'flex-start' }}>{children}</View>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 14, borderWidth: 1, borderColor: alpha(rib, 0.22) }]} />
      </View>
    </View>
  );
}

/** Pure sizing: the largest size in [min, max] (0.25 steps) at which the widest line fits, or min. */
export function fitSize(available: number, widestAtMax: number, max: number, min: number): number {
  if (widestAtMax <= available) return max;
  const s = Math.floor(((max * available) / widestAtMax) * 4) / 4;
  return Math.max(min, Math.min(max, s));
}

/**
 * A couplet's two lines, each always on one line: never wrapped, never cut with "…". The size comes down together for
 * both lines until the longer one fits, as a scribe would write smaller. Measuring is a little generous, and Android
 * shrinks a line further itself if it still runs over, so a line can never spill.
 */
export function CoupletText({ a, b, max = 27, min = 14, color, bold, fixed }: { a: string; b: string; max?: number; min?: number; color?: string; bold?: boolean; fixed?: boolean }) {
  const { c, scale: textScale } = useUI();
  // Share images keep their own sizes, whatever the text-size setting.
  const scale = fixed ? 1 : textScale;
  const [width, setWidth] = useState(0);
  const [natural, setNatural] = useState<[number, number]>([0, 0]);
  const top = max * scale;
  const bottom = min * scale;
  const widest = Math.max(natural[0], natural[1]);
  // 6% to spare: Tamil shaping does not scale exactly with the size.
  const size = width && widest ? fitSize(width * 0.94, widest, top, bottom) : top;
  const family = bold ? F.coupletBold : F.couplet;
  const measure = (i: 0 | 1) => (e: { nativeEvent: { lines: { width: number }[] } }) => {
    const w = Math.max(...e.nativeEvent.lines.map((l) => l.width), 0);
    setNatural((n) => (n[i] === w ? n : i === 0 ? [w, n[1]] : [n[0], w]));
  };
  return (
    <View style={{ alignSelf: 'stretch' }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessible accessibilityLabel={`${a} ${b}`}>
      <View style={{ position: 'absolute', opacity: 0, width: 4000, left: -8000 }} pointerEvents="none">
        <Text allowFontScaling={false} onTextLayout={measure(0)} style={{ fontFamily: family, fontSize: top }}>
          {a}
        </Text>
        <Text allowFontScaling={false} onTextLayout={measure(1)} style={{ fontFamily: family, fontSize: top }}>
          {b}
        </Text>
      </View>
      {[a, b].map((line, i) => (
        <Text
          key={i}
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={{ fontFamily: family, fontSize: size, lineHeight: Math.round(size * 1.5), color: color ?? c.leafInk, textAlign: 'left' }}>
          {line}
        </Text>
      ))}
    </View>
  );
}

/** The couplet spelled out for readers who don't read Tamil (Settings, Pronunciation; on by default). */
export function Pronounce({ a, b, color, size = 14.5 }: { a: string; b: string; color?: string; size?: number }) {
  const { c, scale } = useUI();
  const s = useSettings();
  if (!s.pronounce) return null;
  const spell = s.pronounceStyle === 'scholarly' ? scholarly : pronounce;
  // Each line of the couplet keeps to one line here too, coming down a little in size when it is long.
  const style = { fontFamily: F.serifItalic, fontSize: size * scale, lineHeight: Math.round(size * scale * 1.45), color: color ?? c.leafNote, textAlign: 'left' as const };
  return (
    <View style={{ alignSelf: 'stretch', marginTop: 8 }} accessible accessibilityLabel={`Pronunciation: ${pronounce(a)}. ${pronounce(b)}`}>
      {[a, b].map((line, i) => (
        <Text key={i} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={style}>
          {spell(line)}
        </Text>
      ))}
    </View>
  );
}

/** A small label in the leaf's note colour, for the chapter and number under a couplet. */
export function LeafNote({ children }: { children: ReactNode }) {
  const { c, scale } = useUI();
  return (
    <Text allowFontScaling={false} style={{ fontFamily: F.sans, fontSize: 13.5 * scale, lineHeight: 19 * scale, color: c.leafNote, marginTop: 6 }}>
      {children}
    </Text>
  );
}
