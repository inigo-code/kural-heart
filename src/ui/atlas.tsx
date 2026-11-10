import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useMemo, useState } from 'react';
import { PanResponder, Platform, Pressable, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { Icon, T } from './parts';
import { F, alpha } from './theme';
import { useUI } from './ui';

// A map drawn from OpenStreetMap's standard tiles, fetched only while a map is on screen. OSM's tile policy asks for
// an identifying User-Agent and the attribution below. Pages carry their place rounded to about a kilometre.

const TILE = 192;
const UA = 'KuralHeart/1.0 (+https://inigo-code.github.io/kural-heart-site/)';
const MAX_Z = 17;

export type MapPoint = { id: string; lat: number; lon: number };

function project(lat: number, lon: number, z: number): [number, number] {
  const n = TILE * 2 ** z;
  const r = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  return [((lon + 180) / 360) * n, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n];
}

/** Points that fall in the same spot at this zoom, as one pin with a count. */
function cluster(points: MapPoint[], z: number) {
  const groups = new Map<string, { x: number; y: number; ids: string[] }>();
  for (const p of points) {
    const [x, y] = project(p.lat, p.lon, z);
    const key = `${Math.round(x / 36)}:${Math.round(y / 36)}`;
    const g = groups.get(key);
    if (g) g.ids.push(p.id);
    else groups.set(key, { x, y, ids: [p.id] });
  }
  return [...groups.values()];
}

function fit(points: MapPoint[], w: number, h: number): { z: number; cx: number; cy: number } {
  if (!points.length) {
    const [cx, cy] = project(11, 78.5, 5);
    return { z: 5, cx, cy };
  }
  for (let z = 14; z >= 2; z--) {
    const xy = points.map((p) => project(p.lat, p.lon, z));
    const xs = xy.map((a) => a[0]);
    const ys = xy.map((a) => a[1]);
    const bw = Math.max(...xs) - Math.min(...xs);
    const bh = Math.max(...ys) - Math.min(...ys);
    if (bw <= w * 0.7 && bh <= h * 0.7) return { z, cx: (Math.max(...xs) + Math.min(...xs)) / 2, cy: (Math.max(...ys) + Math.min(...ys)) / 2 };
  }
  const [cx, cy] = project(points[0].lat, points[0].lon, 2);
  return { z: 2, cx, cy };
}

/** Keep the top and bottom of the world inside the frame: there is nothing to see beyond them. */
function clampY(cy: number, z: number, h: number) {
  const world = TILE * 2 ** z;
  return world <= h ? world / 2 : Math.max(h / 2, Math.min(world - h / 2, cy));
}

/** The night look for map tiles, where Android can draw view filters (12 and later). */
const DARK_FILTER: ViewStyle['filter'] | null =
  Platform.OS === 'android' && Number(Platform.Version) >= 31 ? [{ invert: 1 }, { hueRotate: '180deg' }, { brightness: 0.92 }, { contrast: 0.88 }, { saturate: 0.7 }] : null;

export function AtlasMap({ points, height, focus, selected, onSelect }: { points: MapPoint[]; height: number; focus?: string; selected?: string[]; onSelect?: (ids: string[]) => void }) {
  const { c, tr } = useUI();
  const [width, setWidth] = useState(0);
  const heightRef = height;
  // ox and oy hold where a drag began.
  const [view, setView] = useState<{ z: number; cx: number; cy: number; ox?: number; oy?: number } | null>(null);

  // The first view: the focused page close up, or every page in frame.
  if (width && !view) {
    const f = focus ? points.find((p) => p.id === focus) : undefined;
    if (f) {
      const [cx, cy] = project(f.lat, f.lon, 13);
      setView({ z: 13, cx, cy });
    } else setView(fit(points, width, height));
  }

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Capture drags inside the map, so a page around it doesn't scroll instead.
        onMoveShouldSetPanResponderCapture: (_e, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => setView((v) => (v ? { ...v, ox: v.cx, oy: v.cy } : v)),
        onPanResponderMove: (_e, g) => setView((v) => (v && v.ox != null && v.oy != null ? { ...v, cx: v.ox - g.dx, cy: clampY(v.oy - g.dy, v.z, heightRef) } : v)),
      }),
    [heightRef],
  );

  const zoom = (d: number) =>
    setView((v) => {
      if (!v) return v;
      const z = Math.max(2, Math.min(MAX_Z, v.z + d));
      const k = 2 ** (z - v.z);
      return { z, cx: v.cx * k, cy: clampY(v.cy * k, z, height) };
    });

  const tiles: { key: string; x: number; y: number; url: string }[] = [];
  if (view && width) {
    const n = 2 ** view.z;
    const left = view.cx - width / 2;
    const top = view.cy - height / 2;
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + width) / TILE); tx++) {
      for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + height) / TILE); ty++) {
        if (ty < 0 || ty >= n) continue;
        const wx = ((tx % n) + n) % n;
        tiles.push({ key: `${view.z}/${tx}/${ty}`, x: tx * TILE - left, y: ty * TILE - top, url: `https://tile.openstreetmap.org/${view.z}/${wx}/${ty}.png` });
      }
    }
  }
  const pins = view ? cluster(points, view.z) : [];

  return (
    <View
      style={{ height, borderRadius: 24, overflow: 'hidden', backgroundColor: c.isNight ? '#2A2622' : '#E9E3D6' }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}>
      {/* On Midnight the map turns dark too: the same OpenStreetMap tiles, inverted and turned back round the colour
          wheel so water stays blue and parks green (Android 12 and later; older phones get them dimmed). */}
      <View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }, c.isNight && DARK_FILTER ? { filter: DARK_FILTER } : null]}>
        {tiles.map((t) => (
          <Image
            key={t.key}
            source={{ uri: t.url, headers: { 'User-Agent': UA } }}
            cachePolicy="disk"
            style={{ position: 'absolute', left: t.x, top: t.y, width: TILE, height: TILE, opacity: c.isNight && !DARK_FILTER ? 0.6 : 1 }}
            transition={120}
            accessible={false}
          />
        ))}
      </View>
      {view
        ? pins.map((p) => {
            const x = p.x - (view.cx - width / 2);
            const y = p.y - (view.cy - height / 2);
            if (x < -30 || y < -30 || x > width + 30 || y > height + 30) return null;
            const on = selected ? p.ids.some((id) => selected.includes(id)) : false;
            return (
              <Pressable
                key={p.ids.join(',')}
                onPress={() => onSelect?.(p.ids)}
                accessibilityRole="button"
                accessibilityLabel={tr(p.ids.length === 1 ? 'A page here' : `${p.ids.length} pages here`, `இங்கே ${p.ids.length} பக்கங்கள்`)}
                hitSlop={10}
                style={{
                  position: 'absolute',
                  left: x - 17,
                  top: y - 34,
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  borderBottomRightRadius: 3,
                  transform: [{ rotate: '45deg' }],
                  backgroundColor: on ? c.ink : c.primary,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 4,
                }}>
                <Text allowFontScaling={false} style={{ transform: [{ rotate: '-45deg' }], color: on ? c.bg : c.onPrimary, fontFamily: F.sansBold, fontSize: 13 }}>
                  {p.ids.length}
                </Text>
              </Pressable>
            );
          })
        : null}
      <View style={{ position: 'absolute', right: 10, top: 10, gap: 8 }}>
        {(
          [
            [1, 'plus', tr('Zoom in', 'பெரிதாக்கு')],
            [-1, 'close', tr('Zoom out', 'சிறிதாக்கு')],
          ] as const
        ).map(([d, icon, label]) => (
          <Pressable key={d} onPress={() => zoom(d)} accessibilityRole="button" accessibilityLabel={label} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', elevation: 3 }}>
            {d === 1 ? <Icon name="plus" size={20} /> : <View style={{ width: 16, height: 2, borderRadius: 1, backgroundColor: c.ink }} />}
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}
        accessibilityRole="link"
        style={{ position: 'absolute', right: 0, bottom: 0, paddingHorizontal: 8, paddingVertical: 3, borderTopLeftRadius: 10, backgroundColor: alpha(c.surface, 0.85) }}>
        <Text allowFontScaling={false} style={{ fontFamily: F.sans, fontSize: 11, color: c.ink2 }}>
          © OpenStreetMap contributors
        </Text>
      </Pressable>
      {!points.length ? (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 30, padding: 12, borderRadius: 16, backgroundColor: c.surface }}>
          <T v="bodyM" color={c.ink2}>
            {tr('Pages with a place from your location will appear here.', 'உங்கள் இருப்பிடத்துடன் சேர்த்த பக்கங்கள் இங்கே தோன்றும்.')}
          </T>
        </View>
      ) : null}
    </View>
  );
}
