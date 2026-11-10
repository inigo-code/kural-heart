import { Circle, Group, Path, RadialGradient, Rect, Skia, vec } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

import { SkiaStill } from './still';
import { alpha } from './theme';
import { useUI } from './ui';

/**
 * A faint band of kolam: a row of pulli (dots) with a curved lozenge drawn around each, linked to the next, as drawn
 * on a threshold each morning. Decoration only, so it stays quiet and hides from screen readers.
 */
export function KolamBand({ height = 22, style, strength = 1, color }: { height?: number; style?: StyleProp<ViewStyle>; strength?: number; color?: string }) {
  const { c } = useUI();
  const [width, setWidth] = useState(0);
  const step = height * 1.15;
  const path = useMemo(() => {
    if (!width) return Skia.Path.Make();
    const y = height / 2;
    const r = height * 0.42;
    const q = r * 0.18;
    const f = (n: number) => n.toFixed(1);
    let d = '';
    for (let x = step / 2; x < width + step; x += step) {
      // A lozenge with sides bowed inward, its points touching the next one's.
      d += `M${f(x)} ${f(y - r)}Q${f(x + q)} ${f(y - q)} ${f(x + r)} ${f(y)}Q${f(x + q)} ${f(y + q)} ${f(x)} ${f(y + r)}`;
      d += `Q${f(x - q)} ${f(y + q)} ${f(x - r)} ${f(y)}Q${f(x - q)} ${f(y - q)} ${f(x)} ${f(y - r)}Z`;
    }
    return Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
  }, [width, height, step]);
  const dots = useMemo(() => {
    const out: number[] = [];
    for (let x = step / 2; x < width + step; x += step) out.push(x);
    return out;
  }, [width, step]);
  const ink = alpha(color ?? c.primary, (c.isNight && !color ? 0.2 : 0.16) * strength);
  return (
    <View
      style={[{ height, overflow: 'hidden' }, style]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none">
      {width ? (
        <SkiaStill width={width} height={height} sig={`band ${ink}`}>
          <Group>
            <Path path={path} color={ink} style="stroke" strokeWidth={1.2} />
            {dots.map((x) => (
              <Circle key={x} cx={x} cy={height / 2} r={1.6} color={ink} />
            ))}
            {dots.map((x) => (
              <Circle key={`h${x}`} cx={x + step / 2} cy={height / 2} r={1.1} color={ink} />
            ))}
          </Group>
        </SkiaStill>
      ) : null}
    </View>
  );
}

/** Shared wrapper: measures its width, hides from screen readers and touch, and draws only once it knows its size. */
function Measured({ height, style, draw, sig }: { height: number; style?: StyleProp<ViewStyle>; draw: (width: number) => ReactElement; sig: string }) {
  const [width, setWidth] = useState(0);
  return (
    <View
      style={[{ height, overflow: 'hidden' }, style]}
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none">
      {width > 0 ? (
        <SkiaStill width={width} height={height} sig={sig}>
          {draw(width)}
        </SkiaStill>
      ) : null}
    </View>
  );
}

/**
 * A sikku (knot) kolam threshold: a row of pulli, each wrapped by two lines that cross between the dots and never
 * end, the way a kolam is drawn on the step of a house. Sits under Valluvar's arch, where a threshold would be.
 */
export function SikkuThreshold({ height = 20, style, strength = 1 }: { height?: number; style?: StyleProp<ViewStyle>; strength?: number }) {
  const { c } = useUI();
  const ink = alpha(c.primary, (c.isNight ? 0.26 : 0.2) * strength);
  return (
    <Measured
      height={height}
      style={style}
      sig={`sikku ${ink}`}
      draw={(width) => {
        const y = height / 2;
        const step = height * 1.3;
        const n = Math.max(1, Math.floor(width / step));
        const x0 = (width - n * step) / 2;
        const r = height * 0.36;
        const f = (v: number) => v.toFixed(1);
        // Two waves in opposite phase: each wraps one dot as an eye and crosses the other between dots.
        let d = '';
        for (const sgn of [1, -1]) {
          d += `M${f(x0)} ${f(y)}`;
          for (let i = 0; i < n; i++) {
            const a = x0 + i * step;
            const k = 0.5523 * (step / 2);
            d += `C${f(a + k)} ${f(y - sgn * r * 1.33)} ${f(a + step - k)} ${f(y - sgn * r * 1.33)} ${f(a + step)} ${f(y)}`;
          }
        }
        // Closing loops at both ends, so the line has no loose end.
        d += `M${f(x0)} ${f(y)}m0 0a${f(r * 0.66)} ${f(r * 0.66)} 0 1 0 0 0.01`;
        d += `M${f(x0 + n * step)} ${f(y)}m0 0a${f(r * 0.66)} ${f(r * 0.66)} 0 1 1 0 0.01`;
        const path = Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
        return (
          <Group>
            <Path path={path} color={ink} style="stroke" strokeWidth={1.3} strokeCap="round" />
            {Array.from({ length: n }, (_, i) => (
              <Circle key={i} cx={x0 + i * step + step / 2} cy={y} r={1.7} color={ink} />
            ))}
          </Group>
        );
      }}
    />
  );
}

/**
 * A silk-border band after the Kanchipuram korvai: two fine rules with a row of mayil kann (peacock eyes) between
 * them, linked by small diamonds. Used to edge sheets and the Insights card. Drawn with plain views, not Skia, so it
 * also shows inside Android's modal windows (sheets), where a Skia canvas may not draw.
 */
export function MayilBorder({ height = 14, style, strength = 1, color }: { height?: number; style?: StyleProp<ViewStyle>; strength?: number; color?: string }) {
  const { c } = useUI();
  const [width, setWidth] = useState(0);
  const ink = alpha(color ?? c.gold, (c.isNight && !color ? 0.42 : 0.5) * strength);
  const step = height * 1.6;
  const n = width ? Math.max(1, Math.floor(width / step)) : 0;
  const x0 = (width - n * step) / 2 + step / 2;
  const r = height * 0.26;
  const dm = height * 0.17;
  return (
    <View
      style={[{ height, overflow: 'hidden' }, style]}
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none">
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0.5, height: 0.9, backgroundColor: ink }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0.5, height: 0.9, backgroundColor: ink }} />
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + i * step;
        return (
          <View key={i}>
            <View
              style={{ position: 'absolute', left: x - r, top: height / 2 - r, width: r * 2, height: r * 2, borderRadius: r, borderWidth: 1, borderColor: ink, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: r * 0.8, height: r * 0.8, borderRadius: r * 0.4, backgroundColor: ink }} />
            </View>
            {i < n - 1 ? (
              <View style={{ position: 'absolute', left: x + step / 2 - dm / 2, top: height / 2 - dm / 2, width: dm, height: dm, backgroundColor: ink, transform: [{ rotate: '45deg' }] }} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/**
 * A corner watermark after the Athangudi floor tiles of Chettinad: quarter circles from every corner of a square
 * grid, which meet as rings and four-point stars. Fades out towards the content so text never sits on it.
 */
export function AthangudiCorner({ size = 132, style, strength = 1, bg }: { size?: number; style?: StyleProp<ViewStyle>; strength?: number; bg?: string }) {
  const { c } = useUI();
  const ink = alpha(c.primary, (c.isNight ? 0.11 : 0.09) * strength);
  const cell = size / 4;
  const f = (v: number) => v.toFixed(1);
  let d = '';
  for (let gx = 0; gx <= 4; gx++) {
    for (let gy = 0; gy <= 4; gy++) {
      const cx = gx * cell;
      const cy = gy * cell;
      d += `M${f(cx + cell / 2)} ${f(cy)}a${f(cell / 2)} ${f(cell / 2)} 0 1 0 0 0.01`;
    }
  }
  const path = Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
  return (
    <View style={[{ width: size, height: size }, style]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SkiaStill width={size} height={size} sig={`tile ${ink} ${bg ?? c.surface}`}>
        <Group>
          <Path path={path} color={ink} style="stroke" strokeWidth={1.2} />
          {Array.from({ length: 16 }, (_, i) => (
            <Circle key={i} cx={(i % 4) * cell + cell / 2} cy={Math.floor(i / 4) * cell + cell / 2} r={1.6} color={ink} />
          ))}
          <Rect x={0} y={0} width={size} height={size}>
            <RadialGradient c={vec(size, 0)} r={size * 1.05} colors={[alpha(bg ?? c.surface, 0), bg ?? c.surface]} positions={[0.45, 1]} />
          </Rect>
        </Group>
      </SkiaStill>
    </View>
  );
}

/**
 * A ring of kolam pulli around something round (the profile photo on Today): a circle of dots in gold, with a fine
 * inner line, like the dotted border drawn round a doorstep design.
 */
export function KolamRing({ size, children }: { size: number; children: ReactNode }) {
  const { c } = useUI();
  const r = size / 2 - 2;
  const dots = 20;
  const gap = (2 * Math.PI * r) / dots;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }} pointerEvents="none">
        <SvgCircle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={alpha(c.gold, c.isNight ? 0.85 : 0.95)} strokeWidth={2.6} strokeLinecap="round" strokeDasharray={`0.1 ${gap.toFixed(2)}`} />
        <SvgCircle cx={size / 2} cy={size / 2} r={r - 3.5} fill="none" stroke={alpha(c.gold, 0.45)} strokeWidth={1} />
      </Svg>
      {children}
    </View>
  );
}
