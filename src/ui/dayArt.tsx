import { Circle, Group, Path, PathOp, Skia } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import type { Period } from '@/lib/daily';

import { SkiaStill } from './still';
import { alpha } from './theme';
import { useUI } from './ui';

/**
 * The sky of the six Tamil times of day, drawn faintly behind Today's greeting in the manner of a kolam: dots and
 * single lines. Before dawn a fading crescent and the morning star; morning a sun rising over the threshold line,
 * its rays made of pulli; midday a full sun ringed with dots; late afternoon the sun lower, rays lengthening; evening
 * a half sun setting, with birds going home; deep night a crescent and scattered stars. Decoration only.
 */
export function DayArt({ period, style }: { period: Period; style?: StyleProp<ViewStyle> }) {
  const { c } = useUI();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const sun = alpha(c.gold, c.isNight ? 0.34 : 0.42);
  const soft = alpha(c.gold, c.isNight ? 0.2 : 0.26);
  const moon = alpha(c.isNight ? '#E8DCC4' : '#8A7A62', c.isNight ? 0.3 : 0.32);
  const star = alpha(c.isNight ? '#F3E7C6' : '#8A7A62', c.isNight ? 0.45 : 0.4);
  const ink = alpha(c.primary, c.isNight ? 0.22 : 0.2);

  const art = useMemo(() => {
    const { w, h } = box;
    if (!w || !h) return null;
    const f = (n: number) => n.toFixed(1);
    // A crescent: a disc with a second, shifted disc cut out of it.
    // A circle as two half arcs (centre cx, cy).
    const circle = (cx: number, cy: number, r: number) =>
      Skia.Path.MakeFromSVGString(`M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`)!;
    const crescent = (cx: number, cy: number, r: number) => {
      const p = circle(cx, cy, r);
      return Skia.Path.MakeFromOp(p, circle(cx + r * 0.42, cy - r * 0.28, r * 0.86), PathOp.Difference) ?? p;
    };
    // Dotted rays around a centre, every [step] degrees, from [r0] outwards.
    const rays = (cx: number, cy: number, r0: number, n: number, from: number, to: number, step: number) => {
      const out: { x: number; y: number; r: number }[] = [];
      for (let a = from; a <= to + 0.1; a += step) {
        const rad = (a * Math.PI) / 180;
        for (let i = 0; i < n; i++) {
          const d = r0 + i * 9;
          out.push({ x: cx + Math.cos(rad) * d, y: cy - Math.sin(rad) * d, r: 2.4 - i * 0.5 });
        }
      }
      return out;
    };
    const stars = (seed: number, count: number) => {
      const out: { x: number; y: number; r: number }[] = [];
      let s = seed;
      const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      // Stars stay in the sky above the greeting, not over its letters.
      for (let i = 0; i < count; i++) out.push({ x: rnd() * w * 0.95, y: 4 + rnd() * h * 0.36, r: 1.2 + rnd() * 1.6 });
      return out;
    };
    const horizon = h * 0.82;
    const line = Skia.Path.MakeFromSVGString(`M${f(w * 0.04)} ${f(horizon)}L${f(w * 0.96)} ${f(horizon)}`)!;
    // Small birds: two arcs each.
    const birds = Skia.Path.MakeFromSVGString(
      [
        [w * 0.58, h * 0.28, 9],
        [w * 0.68, h * 0.2, 7],
        [w * 0.74, h * 0.33, 6],
      ]
        .map(([x, y, s]) => `M${f(x - s)} ${f(y)}Q${f(x - s / 2)} ${f(y - s * 0.7)} ${f(x)} ${f(y)}Q${f(x + s / 2)} ${f(y - s * 0.7)} ${f(x + s)} ${f(y)}`)
        .join(''),
    )!;
    switch (period) {
      case 'vaigarai':
        return { kind: 'night' as const, moon: crescent(w * 0.78, h * 0.24, h * 0.14), stars: stars(11, 9), venus: { x: w * 0.58, y: h * 0.16 }, horizon };
      case 'yaamam':
        return { kind: 'night' as const, moon: crescent(w * 0.78, h * 0.22, h * 0.15), stars: stars(5, 14), venus: null, horizon };
      case 'kaalai':
        return { kind: 'sun' as const, cx: w * 0.3, cy: horizon, r: h * 0.2, rays: rays(w * 0.3, horizon, h * 0.2 + 12, 3, 15, 165, 25), half: true, line, birds: null };
      case 'nanpagal':
        return { kind: 'sun' as const, cx: w * 0.5, cy: h * 0.45, r: h * 0.16, rays: rays(w * 0.5, h * 0.45, h * 0.16 + 12, 3, 0, 345, 30), half: false, line: null, birds: null };
      case 'erpadu':
        return { kind: 'sun' as const, cx: w * 0.66, cy: h * 0.58, r: h * 0.17, rays: rays(w * 0.66, h * 0.58, h * 0.17 + 12, 4, 0, 330, 30), half: false, line: null, birds: null };
      default:
        return { kind: 'sun' as const, cx: w * 0.4, cy: horizon, r: h * 0.24, rays: rays(w * 0.4, horizon, h * 0.24 + 12, 2, 20, 160, 20), half: true, line, birds };
    }
  }, [box, period]);

  return (
    <View
      style={[{ overflow: 'hidden' }, style]}
      onLayout={(e) => setBox({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {art && box.w ? (
        <SkiaStill width={box.w} height={box.h} sig={`${period} ${sun} ${moon} ${star} ${ink}`}>
          {art.kind === 'night' ? (
            <Group>
              <Path path={art.moon} color={moon} />
              {art.stars.map((s, i) => (
                <Circle key={i} cx={s.x} cy={s.y} r={s.r} color={star} />
              ))}
              {art.venus ? <Circle cx={art.venus.x} cy={art.venus.y} r={4} color={alpha(c.gold, 0.5)} /> : null}
            </Group>
          ) : (
            <Group>
              {art.half ? (
                <Group clip={Skia.XYWHRect(0, 0, box.w, art.cy)}>
                  <Circle cx={art.cx} cy={art.cy} r={art.r} color={soft} />
                  <Circle cx={art.cx} cy={art.cy} r={art.r} color={sun} style="stroke" strokeWidth={1.4} />
                </Group>
              ) : (
                <Group>
                  <Circle cx={art.cx} cy={art.cy} r={art.r} color={soft} />
                  <Circle cx={art.cx} cy={art.cy} r={art.r} color={sun} style="stroke" strokeWidth={1.4} />
                </Group>
              )}
              {art.rays.filter((d) => !art.half || d.y < art.cy - 2).map((d, i) => (
                <Circle key={i} cx={d.x} cy={d.y} r={d.r} color={sun} />
              ))}
              {art.line ? <Path path={art.line} color={ink} style="stroke" strokeWidth={1.2} /> : null}
              {art.birds ? <Path path={art.birds} color={alpha(c.ink, 0.28)} style="stroke" strokeWidth={1.4} strokeCap="round" /> : null}
            </Group>
          )}
        </SkiaStill>
      ) : null}
    </View>
  );
}
