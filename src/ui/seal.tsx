import { Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { Text, View } from 'react-native';

import type { Seal } from '@/lib/progress';

import { F, alpha, toneColors } from './theme';

/** The seal medallion: brass rim, enamel face in its tone, ribbon tails, and the Tamil numeral over the digit. */
export function SealMedal({ seal, earned, size }: { seal: Seal; earned: boolean; size: number }) {
  const [c1, c2, c3] = toneColors(seal.tone);
  const h = size * (136 / 120);
  const k = size / 120;
  const glyphSize = (seal.glyph.length > 3 ? 15 : seal.glyph.length > 1 ? 26 : seal.num ? 36 : 44) * k;
  const face = earned ? '#FFF4DF' : alpha(c1, 0.6);
  return (
    <View style={{ width: size, height: h }} accessible accessibilityLabel={seal.en}>
      <Canvas style={{ width: size, height: h, position: 'absolute' }}>
        <Group transform={[{ scale: k }]}>
          {earned ? (
            <>
              <Path path="M40 88L30 128 42 121 50 132 60 96Z" color={c2} />
              <Path path="M80 88L90 128 78 121 70 132 60 96Z" color={c3} />
              <Circle cx={60} cy={61} r={56} color="rgba(0,0,0,0.18)" />
              <Circle cx={60} cy={58} r={56}>
                <LinearGradient start={vec(4, 2)} end={vec(116, 114)} colors={['#F6DC9C', '#D3AE62', '#9A7432']} />
              </Circle>
              <Circle cx={60} cy={58} r={51.5} color={alpha('#7E5C22', 0.7)} style="stroke" strokeWidth={2.4} strokeCap="round">
                <DashPathEffect intervals={[0.01, 6.74]} />
              </Circle>
              <Circle cx={60} cy={58} r={47} color={alpha('#7E5C22', 0.55)} />
              <Circle cx={60} cy={58} r={45}>
                <RadialGradient c={vec(60 - 45 + 0.38 * 90, 58 - 45 + 0.32 * 90)} r={72} colors={[c1, c2]} />
              </Circle>
              <Circle cx={60} cy={58} r={40.5} color={alpha('#FFF4DF', 0.35)} style="stroke" strokeWidth={0.9} />
              <Path path="M27 46C33 28 49 19 66 20 52 25 38 34 31 52Z" color="rgba(255,255,255,0.16)" />
            </>
          ) : (
            <>
              <Circle cx={60} cy={58} r={54} color={alpha(c1, 0.55)} style="stroke" strokeWidth={1.6}>
                <DashPathEffect intervals={[3, 5]} />
              </Circle>
              <Circle cx={60} cy={58} r={44} color={alpha(c1, 0.09)} />
            </>
          )}
        </Group>
      </Canvas>
      <View style={{ width: size, height: size * (116 / 120), alignItems: 'center', justifyContent: 'center' }}>
        <Text allowFontScaling={false} style={{ fontFamily: F.serifTamil, fontSize: glyphSize, lineHeight: glyphSize * 1.5, color: face }}>
          {seal.glyph}
        </Text>
        {seal.num ? (
          <Text allowFontScaling={false} style={{ fontFamily: F.serifSemi, fontSize: 14 * k, color: earned ? alpha(face, 0.82) : face, includeFontPadding: false }}>
            {seal.num}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
