import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { ScrollViewProps, StyleProp, TextProps, TextStyle, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alpha, mix } from './theme';
import type { Colors, Variant } from './theme';
import { useUI } from './ui';

/** The canvas's line icons, 24 by 24, drawn with a 1.8 stroke. */
export const Ico = {
  today: 'M3.5 12a4 4 0 0 1 4-4h9a4 4 0 0 1 0 8h-9a4 4 0 0 1-4-4ZM10.5 10.8h6M10.5 13.3h3.5M7.3 12h.01',
  journal: 'M6 5h11.5a2.5 2.5 0 0 1 0 5H6a2.5 2.5 0 0 1 0-5ZM6 14h11.5a2.5 2.5 0 0 1 0 5H6a2.5 2.5 0 0 1 0-5ZM7.5 2.5v19',
  journey: 'M4 18c3-1 4-4 7-4s4 3 7 2 2-6 2-6M4 18h.01M20 10h.01M12 3l1.2 2.5L16 6l-2 2 .5 2.8L12 9.5 9.5 10.8 10 8 8 6l2.8-.5Z',
  settings: 'M17.2 3.8a2.3 2.3 0 0 1 3.2 3.2L9 18.4 4.5 19.5 5.6 15ZM15 6l3 3M5.6 15l3.4 3.4',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  chevron: 'M9 5l7 7-7 7',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM20 20l-4.8-4.8',
  calendar: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM4 10h16M8 3.5v4M16 3.5v4',
  list: 'M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6',
  pen: 'M15.5 4.5l4 4L9 19l-5 1 1-5ZM13.5 6.5l4 4',
  plus: 'M12 5v14M5 12h14',
  heart: 'M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20Z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z',
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6Z M9 12l2 2 4-4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z',
  keyboard: 'M4 7h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM7 10h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8',
  bulb: 'M12 3.5a6 6 0 0 0-3.5 10.9V17h7v-2.6A6 6 0 0 0 12 3.5ZM9.5 20h5',
  // A leaf lying flat with an arrow tipping it over.
  turn: 'M4 14h16v5H4ZM6.5 11A6.5 6.5 0 0 1 17.5 8M17.5 4v4h-4',
  shuffle: 'M3 7h3c4.5 0 6.5 10 11 10h4M3 17h3c1.7 0 3-1.4 4.2-3.3M13.8 9.3C15 7.9 15.9 7 17 7h4M18 4l3 3-3 3M18 14l3 3-3 3',
  moon: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z',
  sunrise: 'M7 17a5 5 0 0 1 10 0M3 17h18M12 5v3M5.6 9.6l1.8 1.8M18.4 9.6l-1.8 1.8M2.5 13.5h2M19.5 13.5h2M8 21h8',
  words: 'M4 6h16M4 12h10M4 18h7M17 15l3 3-3 3',
  book: 'M4 5.5C6.5 4.2 9.5 4.2 12 6c2.5-1.8 5.5-1.8 8-.5v13c-2.5-1.3-5.5-1.3-8 .5-2.5-1.8-5.5-1.8-8-.5ZM12 6v13',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z',
  play: 'M8 5.5v13l10-6.5Z',
  stop: 'M7 7h10v10H7Z',
  filter: 'M4 6h16M7 12h10M10 18h4',
  photo: 'M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  gallery: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01',
  pin: 'M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  cloud: 'M7 18h10.5a4 4 0 0 0 .5-8 6 6 0 0 0-11.6-1.5A4.5 4.5 0 0 0 7 18Z',
  tag: 'M3.5 12.5V4.5h8l9 9-8 8ZM8 8.5h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  bold: 'M7 5h6a3.5 3.5 0 0 1 0 7H7ZM7 12h7a3.5 3.5 0 0 1 0 7H7Z',
  italic: 'M10 5h8M6 19h8M14 5l-4 14',
  heading: 'M5 5v14M15 5v14M5 12h10M19 19v-7l-2 1',
  bullets: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  quote: 'M5 7h5v5H7c0 2 1 3 3 3M14 7h5v5h-3c0 2 1 3 3 3',
  check: 'M4 5h16v14H4ZM8 12l3 3 5-6',
  tick: 'M5 12.5l4.5 4.5L19 7.5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c1.5-4 4.5-6 8-6s6.5 2 8 6',
  download: 'M12 4v11M8 11l4 4 4-4M5 19h14',
  sync: 'M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M6 21v-4h4',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3ZM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6',
  video: 'M4 7h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM16 10.5l5-3v9l-5-3',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  grid: 'M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z',
  expand: 'M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7',
} as const;

export type IconName = keyof typeof Ico;

/**
 * A line icon, drawn as native vector paths. (They were small Skia canvases, and on Android a canvas could come back
 * blank after a sheet or dialog had covered it: the tab bar lost its icons.)
 */
export function Icon({ name, size = 24, color, stroke = 1.8, fill }: { name: IconName; size?: number; color?: string; stroke?: number; fill?: boolean }) {
  const { c } = useUI();
  const tint = color ?? c.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <SvgPath d={Ico[name]} fill={fill ? tint : 'none'} stroke={tint} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Text in one of the type roles, sized by the person's text size. */
export function T({ v = 'body', color, style, children, ...rest }: TextProps & { v?: Variant; color?: string; style?: StyleProp<TextStyle> }) {
  const { c, type } = useUI();
  return (
    // "simple" line breaking: Android's default "highQuality" measures Anek Tamil and Literata Italic a touch short,
    // then drops the end of a line ("30 நாள்" showing as "30", "midday" vanishing after "·").
    <Text maxFontSizeMultiplier={1.6} textBreakStrategy="simple" {...rest} style={[type[v], { color: color ?? c.ink }, style]}>
      {children}
    </Text>
  );
}

/** The gold of a starred page or a saved couplet: deep enough to read on Ivory, warm enough on Midnight. */
export const starInk = (c: Colors) => (c.isNight ? '#E9BE5E' : '#A8761A');

/**
 * Star a page or save a couplet. Off, an outline star; on, a filled gold star in a soft gold disc, with a small pop as
 * it fills. [disc] gives it the round backing of the header buttons, so it pairs with Back.
 */
export function StarButton({ on, onPress, label, size = 24, disc }: { on: boolean; onPress: () => void; label: string; size?: number; disc?: boolean }) {
  const { c, still } = useUI();
  const gold = starInk(c);
  const pop = useSharedValue(1);
  const popping = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const side = disc ? 44 : 40;
  return (
    <Pressable
      onPress={() => {
        if (!on && !still) pop.set(withSequence(withTiming(1.28, { duration: 110 }), withSpring(1, { damping: 9, stiffness: 260 })));
        onPress();
      }}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      hitSlop={6}
      style={({ pressed }) => ({
        width: side,
        height: side,
        borderRadius: side / 2,
        margin: disc ? 2 : 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: on ? alpha(gold, c.isNight ? 0.2 : 0.14) : disc ? (pressed ? c.surface3 : c.surface2) : pressed ? c.surface2 : 'transparent',
        borderWidth: on ? 1 : 0,
        borderColor: alpha(gold, 0.45),
      })}>
      <Animated.View style={popping}>
        <Icon name="star" size={size} color={on ? gold : c.ink2} fill={on} stroke={on ? 1.4 : 1.8} />
      </Animated.View>
    </Pressable>
  );
}

/** A 48dp round icon button. */
export function IconButton({ name, label, onPress, color, size = 24 }: { name: IconName; label: string; onPress: () => void; color?: string; size?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={4}
      android_ripple={{ borderless: true, radius: 24 }}
      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} color={color} size={size} />
    </Pressable>
  );
}

/** Back (or close) on a soft round background, so it reads as a button on any screen. */
export function BackButton({ onPress, close, label }: { onPress: () => void; close?: boolean; label?: string }) {
  const { c, L } = useUI();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? (close ? L.close : L.back)}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        margin: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? c.surface3 : c.surface2,
      })}>
      <Icon name={close ? 'close' : 'back'} color={c.ink} size={22} />
    </Pressable>
  );
}

/** A pushed page: safe area, top bar with back or close and a serif title, then the content. */
export function Page({
  title,
  close,
  actions,
  children,
  scroll = true,
  onBack,
  contentStyle,
  scrollProps,
  inTab,
  footer,
}: {
  /** The page sits inside the tabs, above the tab bar, which keeps the bottom inset itself. */
  inTab?: boolean;
  /** A bar of actions fixed under the content (the page view's Edit, Share, Delete); it takes the bottom inset. */
  footer?: ReactNode;
  title: string;
  close?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  onBack?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
}) {
  const { c } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
        <BackButton close={close} onPress={back} />
        <T v="headline" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ flex: 1, marginLeft: 10 }}>
          {title}
        </T>
        {actions}
      </View>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[{ paddingHorizontal: 20, paddingBottom: (inTab || footer ? 0 : insets.bottom) + 32 }, contentStyle]}
          {...scrollProps}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingBottom: inTab ? 0 : insets.bottom }, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.bg }}>{footer}</View>
      ) : inTab ? null : (
        // A strip behind the system's buttons, so text scrolls under it rather than through the buttons.
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: insets.bottom, backgroundColor: c.bg }} />
      )}
    </View>
  );
}

/** The raised look of a card on the page: a fine edge and, on Ivory, a soft shadow, so it doesn't melt into the ground. */
export function raised(c: { isNight: boolean; line: string }): ViewStyle {
  return { borderWidth: 1, borderColor: c.line, elevation: c.isNight ? 0 : 1.5, shadowColor: '#3C280A' };
}

/** A white rounded group of rows, as in Settings. */
export function Group({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useUI();
  return <View style={[{ backgroundColor: c.surface, borderRadius: 24, overflow: 'hidden' }, raised(c), style]}>{children}</View>;
}

export function Row({
  title,
  sub,
  onPress,
  titleColor,
  divider = true,
  trailing,
  icon,
}: {
  title: string;
  sub?: string | null;
  onPress?: () => void;
  titleColor?: string;
  divider?: boolean;
  trailing?: ReactNode;
  icon?: IconName;
}) {
  const { c } = useUI();
  return (
    <View>
      {divider ? <View style={{ height: 1, backgroundColor: c.line }} /> : null}
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        android_ripple={{ color: c.surface3 }}
        style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 14 }}>
        {icon ? <Icon name={icon} color={c.ink2} size={22} /> : null}
        <View style={{ flex: 1 }}>
          <T v="body" color={titleColor}>
            {title}
          </T>
          {sub ? (
            <T v="labelM" color={c.ink3}>
              {sub}
            </T>
          ) : null}
        </View>
        {trailing ?? (onPress ? <Icon name="chevron" color={c.ink3} size={20} /> : null)}
      </Pressable>
    </View>
  );
}

/**
 * The app's own on/off switch: a pill that fills with the accent, its thumb sliding across and showing a tick when on.
 * Android's stock switch was thin and grey on the ivory ground, and gave no sense of "on".
 */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { c, still } = useUI();
  const on = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    on.value = still ? (value ? 1 : 0) : withTiming(value ? 1 : 0, { duration: 180 });
    // on is a shared value and stays the same object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, still]);
  const offTrack = c.isNight ? c.surface3 : '#E3D9C9';
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(on.value, [0, 1], [offTrack, c.primary]) }));
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: 4 + on.value * 22 }],
    width: 22 + on.value * 2,
    height: 22 + on.value * 2,
    borderRadius: 12,
    marginTop: (28 - (22 + on.value * 2)) / 2,
  }));
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} hitSlop={8}>
      <Animated.View style={[{ width: 52, height: 28, borderRadius: 14, borderWidth: value ? 0 : 1.5, borderColor: alpha(c.ink3, 0.45) }, track]}>
        <Animated.View style={[{ position: 'absolute', top: value ? 0 : -1.5, left: value ? 0 : -1.5, backgroundColor: value ? '#FFFFFF' : c.isNight ? c.ink2 : '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000' }, thumb]}>
          {value ? <Icon name="tick" size={14} color={c.primary} stroke={2.6} /> : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export function SwitchRow({ title, sub, value, onChange, divider = true }: { title: string; sub?: string | null; value: boolean; onChange: (v: boolean) => void; divider?: boolean }) {
  return <Row title={title} sub={sub} divider={divider} onPress={() => onChange(!value)} trailing={<Toggle value={value} onChange={onChange} label={title} />} />;
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { c } = useUI();
  return (
    <T v="label" color={c.ink2} style={[{ marginLeft: 4, marginTop: 28, marginBottom: 10 }, style]}>
      {children}
    </T>
  );
}

/** A soft note with an icon, used for promises and tips. */
export function Note({ children, icon = 'shield', iconColor, style }: { children: ReactNode; icon?: IconName; iconColor?: string; style?: StyleProp<ViewStyle> }) {
  const { c } = useUI();
  return (
    <View style={[{ flexDirection: 'row', gap: 12, backgroundColor: c.surface2, borderRadius: 20, padding: 14 }, style]}>
      <Icon name={icon} color={iconColor ?? c.aram} size={22} />
      <T v="bodyM" color={c.ink2} style={{ flex: 1 }}>
        {children}
      </T>
    </View>
  );
}

export function Chip({ label, icon, on = false, onPress, small }: { label: string; icon?: IconName; on?: boolean; onPress: () => void; small?: boolean }) {
  const { c } = useUI();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: small ? 36 : 40,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: on ? c.primary : pressed ? c.surface3 : c.surface2,
      })}>
      {icon ? <Icon name={icon} size={18} color={on ? c.onPrimary : c.ink2} /> : null}
      <T v="label" color={on ? c.onPrimary : c.ink} numberOfLines={1}>
        {label}
      </T>
    </Pressable>
  );
}

export function Choice({ label, on, onPress, style }: { label: string; on: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const { c } = useUI();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      style={[
        {
          minHeight: 48,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: on ? c.primary : c.line,
          backgroundColor: on ? c.primarySoft : c.surface,
          paddingHorizontal: 14,
          paddingVertical: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <T v="label" color={on ? c.onSoft : c.ink} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </T>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  icon,
  tonal,
  enabled = true,
  busy,
  danger,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  tonal?: boolean;
  enabled?: boolean;
  busy?: boolean;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useUI();
  const base = danger ? c.heart : c.primary;
  const filled = enabled && !tonal;
  const fg = !enabled ? c.ink3 : tonal ? c.onSoft : danger ? '#FFFFFF' : c.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [
        {
          minHeight: 54,
          borderRadius: 27,
          overflow: 'hidden',
          backgroundColor: !enabled ? c.surface3 : tonal ? c.primarySoft : base,
          borderWidth: tonal && enabled ? 1 : 0,
          borderColor: alpha(c.primary, 0.3),
          // A filled button sits up off the page a little, in its own colour, so it reads as the thing to do.
          elevation: filled && !pressed ? 4 : 0,
          shadowColor: base,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingHorizontal: 22,
          paddingVertical: 12,
        },
        style,
      ]}>
      {filled ? <LinearGradient colors={[mix(base, '#FFFFFF', 0.16), base]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} /> : null}
      {busy ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={20} color={tonal && enabled ? c.primary : fg} stroke={2} /> : null}
      <T v="title" color={fg} style={{ textAlign: 'center', flexShrink: 1 }}>
        {label}
      </T>
    </Pressable>
  );
}

/**
 * An invitation to go somewhere (Insights, your journey): an accent tile with its icon, a title, a line of what is
 * there, and an arrow. Reads as a door, where a plain button reads as a form's Submit.
 */
export function ActionCard({ icon, title, sub, onPress, style }: { icon: IconName; title: string; sub?: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const { c } = useUI();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sub ? `${title}. ${sub}` : title}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 14,
          paddingRight: 16,
          borderRadius: 24,
          backgroundColor: pressed ? c.surface2 : c.surface,
          borderWidth: 1,
          borderColor: c.line,
          elevation: c.isNight ? 0 : 1.5,
          shadowColor: '#3C280A',
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}>
      <View style={{ width: 50, height: 50, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient colors={[mix(c.primary, '#FFFFFF', 0.18), c.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <Icon name={icon} size={24} color={c.onPrimary} stroke={2} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="title">{title}</T>
        {sub ? (
          <T v="labelM" color={c.ink3} numberOfLines={2}>
            {sub}
          </T>
        ) : null}
      </View>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevron" size={18} color={c.onSoft} stroke={2.2} />
      </View>
    </Pressable>
  );
}

export function TextLink({ label, onPress, color }: { label: string; onPress: () => void; color?: string }) {
  const { c } = useUI();
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" style={{ paddingVertical: 10, paddingHorizontal: 8 }}>
      <T v="label" color={color ?? c.primary}>
        {label}
      </T>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useUI();
  return <View style={[{ backgroundColor: c.surface, borderRadius: 28, padding: 18 }, raised(c), style]}>{children}</View>;
}

export function Divider() {
  const { c } = useUI();
  return <View style={{ height: 1, backgroundColor: c.line }} />;
}

export function Pill({ label, color, bg }: { label: string; color?: string; bg?: string }) {
  const { c } = useUI();
  return (
    <View style={{ borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: bg ?? alpha(c.primary, 0.12) }}>
      <T v="small" color={color ?? c.primary}>
        {label}
      </T>
    </View>
  );
}

export function timeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
