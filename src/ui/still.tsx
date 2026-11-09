import { Group, drawAsImage } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { PixelRatio } from 'react-native';
import type { StyleProp, ImageStyle } from 'react-native';

/**
 * A still Skia drawing, rendered once offscreen into an image at the screen's density. Decorations (kolam, the sky)
 * never change frame to frame, and a live canvas on Android can come back blank after a dialog's window has covered
 * it; an image can't. [sig] names everything the drawing depends on (size, colours, kind), so it redraws only then.
 */
export function SkiaStill({ width, height, sig, children, style }: { width: number; height: number; sig: string; children: ReactElement; style?: StyleProp<ImageStyle> }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    if (!width || !height) return;
    let live = true;
    const r = PixelRatio.get();
    drawAsImage(<Group transform={[{ scale: r }]}>{children}</Group>, { width: Math.ceil(width * r), height: Math.ceil(height * r) })
      .then((img) => {
        if (live && img) setUri(`data:image/png;base64,${img.encodeToBase64()}`);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // The drawing is described by [sig]; its element tree is rebuilt every render and must not retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, width, height]);
  return <Image source={uri ? { uri } : undefined} style={[{ width, height }, style]} transition={uri ? 120 : 0} accessible={false} />;
}
