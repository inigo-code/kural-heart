import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PixelRatio, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Valluvar, valluvarImage } from '@/valluvar/Valluvar';

import { KolamBand, SikkuThreshold } from './kolam';
import { F } from './theme';
import { useUI } from './ui';

/**
 * The opening moment: Valluvar greets you and winks, then the app fades in. The native splash (the icon on the
 * app's colour) hands over to this as soon as JavaScript runs. With reduced motion it is still and brief.
 */
export function SplashOverlay({ ready, shown, onDone }: { ready: boolean; shown: boolean; onDone: () => void }) {
  const { c, still, L, tamil } = useUI();
  const [fade] = useState(() => new Animated.Value(1));
  // When the overlay could first be seen: once Android's own splash has gone.
  const shownAt = useRef(0);
  useEffect(() => {
    if (shown && !shownAt.current) shownAt.current = Date.now();
  }, [shown]);
  // A still Valluvar drawn at once, under the moving one, for the moment before the first animated frame.
  const [still0] = useState(() => valluvarImage('greeting', Math.round(220 * PixelRatio.get())));
  // The still goes the moment the moving Valluvar draws: left under him, his waving arm showed twice, like an
  // after-image. A late fallback covers a canvas that never reports.
  const [showStill, setShowStill] = useState(true);
  const hideStill = useCallback(() => setShowStill(false), []);
  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(hideStill, 1500);
    return () => clearTimeout(t);
  }, [shown, hideStill]);
  // Android's own start screen follows the phone's light or dark mode; the app follows the time of day. Start in the
  // phone's colour and fade into the app's, so there is no jump between the two.
  const system = useColorScheme();
  const nativeBg = system === 'dark' ? '#14110F' : '#F6F2EA';
  const [tint] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (shown) Animated.timing(tint, { toValue: 1, duration: still ? 0 : 420, useNativeDriver: false }).start();
  }, [shown, still, tint]);
  const bg = tint.interpolate({ inputRange: [0, 1], outputRange: [nativeBg, c.bg] });
  useEffect(() => {
    if (!ready || !shown) return;
    const hold = Math.max(0, (still ? 500 : 2400) - (Date.now() - (shownAt.current || Date.now())));
    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: still ? 120 : 380, useNativeDriver: true }).start(() => onDone());
    }, hold);
    return () => clearTimeout(t);
  }, [ready, shown, still, fade, onDone]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bg, opacity: fade, alignItems: 'center', justifyContent: 'center' }]} accessibilityLabel="Kural Heart">
      <View style={{ width: 230, height: 230, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ position: 'absolute', left: 14, right: 14, top: 10, bottom: 0, backgroundColor: c.surface2, borderTopLeftRadius: 110, borderTopRightRadius: 110, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }} />
        {showStill && still0 ? <Image source={{ uri: still0 }} style={{ position: 'absolute', bottom: 0, width: 220, height: (220 * 220) / 240 }} /> : null}
        <Valluvar state="greeting" face="greet" size={220} wink onDrawn={hideStill} />
      </View>
      <SikkuThreshold height={18} style={{ width: 200, marginTop: 8 }} />
      <Text allowFontScaling={false} textBreakStrategy="simple" style={{ fontFamily: F.serifMedium, fontSize: 34, color: c.ink, marginTop: 16 }}>
        Kural Heart
      </Text>
      {/* Wraps rather than clips, with room for the italic's overhang. */}
      <Text allowFontScaling={false} textBreakStrategy="simple" style={{ fontFamily: tamil ? F.serifTamil : F.serifItalic, fontSize: tamil ? 16 : 18, lineHeight: 26, color: c.ink3, marginTop: 2, maxWidth: 300, paddingHorizontal: 6, textAlign: 'center' }}>
        {L.tagline}
      </Text>
      <KolamBand style={{ position: 'absolute', left: 0, right: 0, bottom: 64 }} height={26} strength={1.4} />
    </Animated.View>
  );
}
