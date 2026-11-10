import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Animated as RNAnimated, Easing as RNEasing, FlatList, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clock, longDate } from '@/lib/dates';
import { LENS, chapterOf, english, questionFor } from '@/lib/pack';
import type { Kural, Part } from '@/lib/pack';
import { photoUri } from '@/lib/photos';
import { useSettings } from '@/lib/settings';
import type { Entry, Weather } from '@/lib/types';
import { Valluvar } from '@/valluvar/Valluvar';
import type { ValluvarState } from '@/valluvar/Valluvar';

import { MayilBorder, SikkuThreshold } from './kolam';
import { CoupletText, Leaf, LeafNote, Pronounce } from './leaf';
import { Icon, T, TextLink, raised, timeLabel } from './parts';
import type { IconName } from './parts';
import { F, alpha } from './theme';
import type { Colors } from './theme';
import { useUI } from './ui';

export const MOODS = [
  // Each feeling has its own emoji and colour (a day and a night step), so it reads at a glance.
  { id: 'calm', en: 'Calm', ta: 'அமைதி', emoji: '😌', day: '#2E8B6E', night: '#5CC4A0' },
  { id: 'grateful', en: 'Grateful', ta: 'நன்றி', emoji: '🙏', day: '#B07D12', night: '#E2B33C' },
  { id: 'driven', en: 'Driven', ta: 'முயற்சி', emoji: '💪', day: '#C2502C', night: '#F08A5D' },
  { id: 'unsure', en: 'Seeking clarity', ta: 'தெளிவு', emoji: '🤔', day: '#3B6FC2', night: '#7CA3F0' },
  { id: 'anxious', en: 'Anxious', ta: 'கவலை', emoji: '😟', day: '#8A5BC2', night: '#B48AE8' },
  { id: 'angry', en: 'Angry', ta: 'சினம்', emoji: '😤', day: '#C23A3A', night: '#F07070' },
  { id: 'lonely', en: 'Lonely', ta: 'தனிமை', emoji: '😔', day: '#5A6F8A', night: '#9DB0C8' },
  { id: 'missing', en: 'Missing someone', ta: 'ஏக்கம்', emoji: '💭', day: '#C2457A', night: '#F08AB4' },
  { id: 'heavy', en: 'Very heavy', ta: 'மிகக் கனம்', emoji: '🌧️', day: '#4B5480', night: '#8E97C8' },
] as const;

export type Mood = (typeof MOODS)[number];

export const moodTint = (m: Mood, c: Colors) => (c.isNight ? m.night : m.day);

/** A feeling to pick: its emoji, its name, and its own colour (filled when chosen). */
export function MoodChip({ m, on, onPress }: { m: Mood; on: boolean; onPress: () => void }) {
  const { c, tamil } = useUI();
  const tint = moodTint(m, c);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={tamil ? m.ta : m.en}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 40,
        borderRadius: 18,
        paddingLeft: 10,
        paddingRight: 14,
        paddingVertical: 7,
        borderWidth: 1.5,
        borderColor: on ? tint : alpha(tint, 0.35),
        backgroundColor: on ? tint : alpha(tint, pressed ? 0.24 : 0.12),
      })}>
      <Text allowFontScaling={false} style={{ fontSize: 18, lineHeight: 24 }}>
        {m.emoji}
      </Text>
      <T v="label" color={on ? (c.isNight ? '#1E1A16' : '#FFFFFF') : c.ink} numberOfLines={1}>
        {tamil ? m.ta : m.en}
      </T>
    </Pressable>
  );
}

export const moodLabel = (id: string | null, tamil: boolean) => {
  const m = MOODS.find((x) => x.id === id);
  return m ? `${m.emoji} ${tamil ? m.ta : m.en}` : null;
};

export const WEATHER_NAMES: [Weather['kind'], string, string][] = [
  ['sun', 'Sunny', 'வெயில்'],
  ['partly', 'Partly cloudy', 'சிறிது மேகம்'],
  ['cloud', 'Cloudy', 'மேகமூட்டம்'],
  ['rain', 'Rain', 'மழை'],
  ['storm', 'Storm', 'இடிமழை'],
  ['fog', 'Mist', 'பனிமூட்டம்'],
  ['wind', 'Windy', 'காற்று'],
  ['snow', 'Cold', 'குளிர்'],
];

export function weatherLabel(w: Weather, tamil: boolean): string {
  const n = WEATHER_NAMES.find((x) => x[0] === w.kind);
  const name = n ? (tamil ? n[2] : n[1]) : w.kind;
  return w.temp != null ? `${name} · ${Math.round(w.temp)}°` : name;
}

export const partColor = (p: Part, c: Colors) => (p === 'aram' ? c.aram : p === 'porul' ? c.porul : c.inbam);

export function translator(which: string): string {
  return which === 'pope' ? 'G. U. Pope, 1886' : which === 'popeprose' ? 'G. U. Pope, 1886, prose' : 'V. V. S. Aiyar, 1916';
}

/** The question for a lens: Mind uses the chapter's own question, Speech and Action the shared lens prompts. */
export function questionText(k: Kural, lens: number, tamil: boolean): string {
  const q = lens === 1 ? LENS.speech : lens === 2 ? LENS.action : questionFor(k);
  return tamil ? q.ta : q.en;
}

/** "Chapter 40 · கல்வி · Learning · Kural 391", or the Tamil form. */
export function kuralRef(k: Kural, tamil: boolean): string {
  const ch = chapterOf(k);
  return tamil ? `அதிகாரம் ${ch.n} · ${ch.ta} · குறள் ${k.n}` : `Chapter ${ch.n} · ${ch.ta} · ${ch.en} · Kural ${k.n}`;
}

export const timeOf = (e: Entry) => {
  const d = new Date(e.created);
  return timeLabel(d.getHours() * 60 + d.getMinutes());
};

/**
 * The couplet on its leaf. Turned, it shows Pope's verse on the back: the leaf tips over on its long side, as an
 * olai is turned in the hand, and comes back up showing the other face.
 */
export function KuralLeaf({ k, turned = false, onPress, max }: { k: Kural; turned?: boolean; onPress?: () => void; max?: number }) {
  const { c, tamil, type, still } = useUI();
  const ch = chapterOf(k);
  // Both faces are measured and the leaf keeps the taller one's height, so turning it never moves the page.
  const [heights, setHeights] = useState<[number, number]>([0, 0]);
  const measure = (i: 0 | 1) => (e: { nativeEvent: { layout: { height: number } } }) => {
    const h = Math.ceil(e.nativeEvent.layout.height);
    setHeights((hs) => (hs[i] === h ? hs : i === 0 ? [h, hs[1]] : [hs[0], h]));
  };
  // The face on show trails [turned] by half a turn: it changes while the leaf is edge-on.
  const [flipped, setShown] = useState(turned);
  // With motion reduced the face simply changes.
  const shown = still ? turned : flipped;
  const tip = useSharedValue(0);
  useEffect(() => {
    if (still || turned === flipped) return;
    tip.value = withTiming(90, { duration: 170, easing: Easing.in(Easing.quad) }, (done) => {
      if (!done) return;
      scheduleOnRN(setShown, turned);
      tip.value = -90;
      tip.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.back(1.4)) });
    });
    // tip is a shared value and stays the same object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turned, still]);
  const tipping = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateX: `${tip.value}deg` }] }));
  const front = (
    <>
      <CoupletText a={k.a} b={k.b} max={max} />
      <Pronounce a={k.a} b={k.b} />
      <LeafNote>{tamil ? `அதிகாரம் ${ch.n} · ${ch.ta} · குறள் ${k.n}` : `Chapter ${ch.n} · ${ch.ta} · Kural ${k.n}`}</LeafNote>
    </>
  );
  const back = (
    <>
      {[k.pa, k.pb].map((line, i) => (
        <Text key={i} style={[type.body, { fontFamily: F.serifItalic, color: c.leafInk, marginTop: i ? 4 : 0 }]}>
          {line}
        </Text>
      ))}
      <LeafNote>{`G. U. Pope, 1886 · ${ch.en} · ${k.n}`}</LeafNote>
    </>
  );
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <Animated.View style={tipping}>
        <Leaf>
          <View style={{ alignSelf: 'stretch', minHeight: Math.max(heights[0], heights[1]), justifyContent: 'center' }}>
            <View onLayout={measure(shown ? 1 : 0)} style={{ alignItems: 'flex-start' }}>
              {shown ? back : front}
            </View>
            {/* The hidden face, laid out unseen, only to know its height. */}
            <View
              onLayout={measure(shown ? 0 : 1)}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: 0, alignItems: 'flex-start' }}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              {shown ? front : back}
            </View>
          </View>
        </Leaf>
      </Animated.View>
    </Pressable>
  );
}

/**
 * A piece of a screen that rises softly into place the first time the screen shows it, [i] steps after the first, so
 * a page settles in from top to bottom instead of appearing all at once. Beyond the tenth piece (a long list as it
 * scrolls) nothing waits. Nothing moves with Reduce motion on.
 */
export function Rise({ i = 0, children, style }: { i?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { still } = useUI();
  return (
    <Animated.View
      // No layout animation: on Android it holds a stale size while it runs, which crops text and lets the next
      // section ride over this one when a couplet's English grows.
      entering={still || i >= 10 ? undefined : FadeInDown.duration(420).delay(80 + Math.min(i, 8) * 70).easing(Easing.out(Easing.cubic)).withInitialValues({ transform: [{ translateY: 14 }] })}>
      {/* The look sits on an inner view: Android can leave an animating view with a background unshown. */}
      <View style={style}>{children}</View>
    </Animated.View>
  );
}

/** Text that fades in afresh whenever [k] changes (a new question, a new count). */
export function FadeSwap({ k, children, style }: { k: string | number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { still } = useUI();
  return (
    <Animated.View key={k} entering={still ? undefined : FadeIn.duration(320)} style={style}>
      {children}
    </Animated.View>
  );
}

/** The English chosen in Settings, under a couplet. */
export const MUVA_BY = { en: 'Mu. Varadarasanar, Tamil', ta: 'மு. வரதராசனார் தெளிவுரை' };

/** The couplet's meaning under it: Mu. Va.'s Tamil explanation when Tamil leads, else the chosen English. */
export function MeaningUnder({ k }: { k: Kural }) {
  const s = useSettings();
  const { c, tamil } = useUI();
  const ta = tamil && !!k.ta;
  return (
    <View>
      <T v="body" color={c.ink2}>
        {ta ? k.ta : english(k, s.translation)}
      </T>
      <T v="labelM" color={c.ink3} style={{ marginTop: 4 }}>
        {ta ? MUVA_BY.ta : translator(s.translation)}
      </T>
    </View>
  );
}

/** Valluvar inside the soft arch used on onboarding, lock and empty states. */
export function ArchValluvar({ state, size = 230, typing, once, nod }: { state: ValluvarState; size?: number; typing?: boolean; once?: boolean; nod?: boolean }) {
  const { c } = useUI();
  return (
    <View style={{ alignItems: 'center' }}>
    <View style={{ width: size + 20, height: size + 20, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          top: 18,
          bottom: 0,
          backgroundColor: c.surface2,
          borderTopLeftRadius: size / 2,
          borderTopRightRadius: size / 2,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      />
      <Valluvar state={state} size={size} typing={typing} once={once} nod={nod} />
    </View>
      <SikkuThreshold height={16} style={{ width: size - 16, marginTop: 6 }} />
    </View>
  );
}

export function usePhoto(id: string | null | undefined) {
  const [got, setGot] = useState<{ id: string; uri: string | null } | null>(null);
  useEffect(() => {
    let live = true;
    if (id) photoUri(id).then((uri) => live && setGot({ id, uri }));
    return () => {
      live = false;
    };
  }, [id]);
  return got && got.id === id ? got.uri : null;
}

export function PhotoThumb({ id, size, round }: { id: string; size: number; round?: boolean }) {
  const { c } = useUI();
  const uri = usePhoto(id);
  return (
    <View style={{ width: size, height: size, borderRadius: round ? size / 2 : 16, overflow: 'hidden', backgroundColor: c.surface2 }}>
      {uri ? <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" /> : null}
    </View>
  );
}

/** One photo of a page, cropped to a tidy size; tap to see it whole. */
function PhotoTile({ id, height, width, onPress }: { id: string; height: number; width?: number; onPress: () => void }) {
  const { c, tr } = useUI();
  const uri = usePhoto(id);
  return (
    <Pressable onPress={onPress} accessibilityRole="imagebutton" accessibilityLabel={tr('Open photo', 'படத்தைத் திற')} style={{ width: width ?? '100%', height, borderRadius: 18, overflow: 'hidden', backgroundColor: c.surface2 }}>
      {uri ? <Image source={{ uri }} style={{ flex: 1 }} contentFit="cover" transition={150} /> : null}
      <View style={{ position: 'absolute', right: 8, bottom: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(20,16,12,0.5)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="expand" size={16} color="#F6F2EA" stroke={2} />
      </View>
    </Pressable>
  );
}

/**
 * A page's photos, kept compact: one fills the width at a modest height, more sit two to a row as squares. Tapping
 * one opens the viewer, the photos whole on black, swiped through one by one.
 */
export function PhotoGallery({ ids }: { ids: string[] }) {
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState<number | null>(null);
  if (!ids.length) return null;
  const half = (width - 40 - 10) / 2;
  return (
    <>
      {ids.length === 1 ? (
        <PhotoTile id={ids[0]} height={230} onPress={() => setOpen(0)} />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {ids.map((id, i) => (
            <PhotoTile key={id} id={id} width={half} height={half} onPress={() => setOpen(i)} />
          ))}
        </View>
      )}
      <PhotoViewer ids={ids} start={open} onClose={() => setOpen(null)} />
    </>
  );
}

function ViewerImage({ id, width, height }: { id: string; width: number; height: number }) {
  const uri = usePhoto(id);
  return <View style={{ width, height, justifyContent: 'center' }}>{uri ? <Image source={{ uri }} style={{ width, height }} contentFit="contain" /> : <ActivityIndicator color="#FFFFFF" />}</View>;
}

/** Photos at full size on black: swipe between them, a count at the top, close to go back. */
function PhotoViewer({ ids, start, onClose }: { ids: string[]; start: number | null; onClose: () => void }) {
  const { L } = useUI();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [at, setAt] = useState(0);
  const [was, setWas] = useState<number | null>(null);
  if (start !== was) {
    setWas(start);
    if (start != null) setAt(start);
  }
  return (
    <Modal visible={start != null} transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {start != null ? (
          <FlatList
            data={ids}
            horizontal
            pagingEnabled
            initialScrollIndex={start}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(id) => id}
            onMomentumScrollEnd={(e) => setAt(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => <ViewerImage id={item} width={width} height={height} />}
          />
        ) : null}
        <View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 16, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={L.close} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }} />
          {ids.length > 1 ? (
            <T v="label" color="#FFFFFF">
              {`${at + 1} / ${ids.length}`}
            </T>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export function Avatar({ size }: { size: number }) {
  const s = useSettings();
  const { c, type } = useUI();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {s.avatar ? (
        <PhotoThumb id={s.avatar} size={size} round />
      ) : s.name ? (
        <Text style={[type.headline, { color: c.onSoft, fontSize: size * 0.42, lineHeight: size * 0.6 }]}>{s.name.slice(0, 1).toUpperCase()}</Text>
      ) : (
        <Icon name="user" color={c.onSoft} size={size * 0.45} />
      )}
    </View>
  );
}

/** One page in a list: its date, couplet number, the first lines and a photo, then its details. */
/** A small marker on a journal card: a voice note or a video is kept with the page. */
function MediaMark({ icon, n }: { icon: 'mic' | 'play'; n: number }) {
  const { c } = useUI();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: c.surface2 }}>
      <Icon name={icon} size={13} color={c.ink2} />
      {n > 1 ? <T v="small" color={c.ink2}>{String(n)}</T> : null}
    </View>
  );
}

export function EntryCard({ e }: { e: Entry }) {
  const { c, tamil, L, type } = useUI();
  const router = useRouter();
  const ch = chapterOf(e.kural);
  const bits = [
    e.starred ? '★' : null,
    moodLabel(e.mood, tamil),
    e.weather ? weatherLabel(e.weather, tamil) : null,
    e.place?.name,
    timeOf(e),
    ...e.tags.map((t) => `#${t}`),
  ].filter(Boolean);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/page/[id]', params: { id: e.id } })}
      accessibilityRole="button"
      style={({ pressed }) => ({ marginHorizontal: 16, marginVertical: 6, borderRadius: 24, backgroundColor: pressed ? c.surface2 : c.surface, padding: 16, ...raised(c) })}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[type.headline, { fontSize: type.headline.fontSize * 0.7, lineHeight: type.headline.lineHeight * 0.7, color: c.ink2, flex: 1 }]} numberOfLines={1}>
          {longDate(e.date, tamil)}
        </Text>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: partColor(ch.part, c), marginRight: 6 }} />
        <T v="label" color={c.ink2}>{`${L.kural} ${e.kural}`}</T>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6, gap: 10 }}>
        <T v="body" numberOfLines={3} style={{ flex: 1 }}>
          {plainMarkdown(e.text)}
        </T>
        {e.photos[0] ? <PhotoThumb id={e.photos[0]} size={64} /> : null}
      </View>
      {bits.length || e.audio.length || e.videos.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
          {e.audio.length ? <MediaMark icon="mic" n={e.audio.length} /> : null}
          {e.videos.length ? <MediaMark icon="play" n={e.videos.length} /> : null}
          <T v="labelM" color={c.ink3} numberOfLines={2} style={{ flex: 1 }}>
            {bits.join(' · ')}
          </T>
        </View>
      ) : null}
    </Pressable>
  );
}

// --- light Markdown: # heading, - list, - [ ] checklist, > quote, **bold** and _italic_ ---

const INLINE = /\*\*(.+?)\*\*|_(.+?)_/g;

export function plainMarkdown(text: string): string {
  return text
    .split('\n')
    .map((l) => l.replace(/^(# |- \[[ xX]\] |- |\* |> )/, ''))
    .join('\n')
    .replace(INLINE, (_m, b: string, i: string) => b || i);
}

function inline(s: string, key: string, style?: StyleProp<TextStyle>): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  let n = 0;
  for (const m of s.matchAll(INLINE)) {
    if (m.index! > at) out.push(s.slice(at, m.index));
    if (m[1]) out.push(<Text key={`${key}b${n++}`} style={[style, { fontFamily: F.sansBold }]}>{m[1]}</Text>);
    else if (m[2]) out.push(<Text key={`${key}i${n++}`} style={[style, { fontStyle: 'italic' }]}>{m[2]}</Text>);
    at = m.index! + m[0].length;
  }
  out.push(s.slice(at));
  return out;
}

export function Markdown({ text, style }: { text: string; style: StyleProp<TextStyle> }) {
  const { c } = useUI();
  const lines = text.split('\n');
  return (
    <Text style={style}>
      {lines.map((raw, i) => {
        const nl = i < lines.length - 1 ? '\n' : '';
        const k = `l${i}`;
        if (raw.startsWith('# '))
          return (
            <Text key={k} style={{ fontFamily: F.serifSemi, fontSize: 24 }}>
              {inline(raw.slice(2), k)}
              {nl}
            </Text>
          );
        if (raw.startsWith('- [ ] '))
          return (
            <Text key={k}>
              {'☐  '}
              {inline(raw.slice(6), k)}
              {nl}
            </Text>
          );
        if (/^- \[[xX]\] /.test(raw))
          return (
            <Text key={k}>
              <Text style={{ color: c.primary }}>{'☑  '}</Text>
              {inline(raw.slice(6), k)}
              {nl}
            </Text>
          );
        if (raw.startsWith('- ') || raw.startsWith('* '))
          return (
            <Text key={k}>
              <Text style={{ color: c.primary }}>{'•  '}</Text>
              {inline(raw.slice(2), k)}
              {nl}
            </Text>
          );
        if (raw.startsWith('> '))
          return (
            <Text key={k} style={{ fontStyle: 'italic', color: c.ink2 }}>
              {'“'}
              {inline(raw.slice(2), k)}
              {'”'}
              {nl}
            </Text>
          );
        return (
          <Text key={k}>
            {inline(raw, k)}
            {nl}
          </Text>
        );
      })}
    </Text>
  );
}

// --- inputs and dialogs ---

export function Field({ value, onChangeText, placeholder, secret, style, ...rest }: TextInputProps & { secret?: boolean; style?: StyleProp<TextStyle> }) {
  const { c, type } = useUI();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.ink3}
      secureTextEntry={secret}
      autoCorrect={!secret}
      autoCapitalize={secret ? 'none' : 'sentences'}
      accessibilityLabel={placeholder}
      selectionColor={c.primary}
      cursorColor={c.primary}
      maxFontSizeMultiplier={1.6}
      style={[type.body, { color: c.ink, backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 }, style]}
      {...rest}
    />
  );
}

/** A centred dialog, like Android's own. */
export function Dialog({
  visible,
  title,
  children,
  onClose,
  actions,
}: {
  visible: boolean;
  title?: string;
  children?: ReactNode;
  onClose: () => void;
  actions?: { label: string; onPress: () => void; color?: string; disabled?: boolean }[];
}) {
  const { c } = useUI();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: c.surface, borderRadius: 28, padding: 22, maxHeight: '90%' }}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
              {title ? <T v="headline">{title}</T> : null}
              {children}
            </ScrollView>
            {actions?.length ? (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 8 }}>
                {actions.map((a) => (
                  <TextLink key={a.label} label={a.label} onPress={a.disabled ? () => {} : a.onPress} color={a.disabled ? c.ink3 : a.color} />
                ))}
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * A sheet that rises from the foot of the screen. The dimmed backdrop fades in where it is and only the sheet slides
 * up (a Modal's own "slide" carries the backdrop with it). React Native's own Animated moves it: inside a Modal's
 * window it lands flush on the bottom edge, where an entering animation could leave a gap under the sheet.
 */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const { c, still } = useUI();
  const insets = useSafeAreaInsets();
  const [rise] = useState(() => new RNAnimated.Value(1));
  useEffect(() => {
    if (!visible) return;
    rise.setValue(still ? 0 : 1);
    if (!still) RNAnimated.timing(rise, { toValue: 0, duration: 300, easing: RNEasing.out(RNEasing.cubic), useNativeDriver: true }).start();
  }, [visible, still, rise]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.42)' }]} accessibilityLabel="Close" />
        <RNAnimated.View
          style={{
            maxHeight: '88%',
            backgroundColor: c.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: insets.bottom,
            transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }) }],
          }}>
          <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: c.surface3, marginTop: 10 }} />
          <MayilBorder height={12} style={{ alignSelf: 'center', width: 132, marginTop: 10 }} />
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }}>{children}</ScrollView>
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

export function Wrap({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>{children}</View>;
}

export type Action = { icon: IconName; label: string; onPress: () => void; on?: boolean };

/**
 * A couplet's actions: round icon buttons in one row with their names under them, like a player's controls. The
 * one that is on (Listen while it reads, the leaf while it is turned) fills with the accent.
 */
export function ActionRow({ items, style }: { items: Action[]; style?: StyleProp<ViewStyle> }) {
  const { c } = useUI();
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12 }, style]}>
      {items.map((a) => (
        <Pressable
          key={a.icon + a.label}
          onPress={a.onPress}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          accessibilityState={a.on != null ? { selected: a.on } : undefined}
          style={{ flex: 1, maxWidth: 104, alignItems: 'center', gap: 8, paddingVertical: 4 }}>
          {({ pressed }) => (
            <>
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: a.on ? c.primary : pressed ? c.primarySoft : c.surface,
                  borderWidth: a.on ? 0 : 1,
                  borderColor: c.line,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                }}>
                <Icon name={a.icon} size={24} color={a.on ? c.onPrimary : pressed ? c.onSoft : c.ink} stroke={2} />
              </View>
              <T v="labelM" color={a.on ? c.primary : c.ink2} numberOfLines={2} style={{ textAlign: 'center', paddingHorizontal: 2 }}>
                {a.label}
              </T>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

/** Wider ways on from a couplet (choose another, say how you feel): soft pills with an icon, side by side. */
export function LinkPills({ items, style }: { items: Action[]; style?: StyleProp<ViewStyle> }) {
  const { c } = useUI();
  return (
    <View style={[{ flexDirection: 'row', gap: 10, paddingHorizontal: 20 }, style]}>
      {items.map((a) => (
        <Pressable
          key={a.icon + a.label}
          onPress={a.onPress}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 52,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 26,
            borderWidth: 1,
            borderColor: c.line,
            backgroundColor: pressed ? c.primarySoft : c.surface,
          })}>
          <Icon name={a.icon} size={20} color={c.primary} stroke={2} />
          <T v="label" color={c.ink} numberOfLines={2} style={{ flex: 1 }}>
            {a.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}

/** A round button that floats over a long list once it has been scrolled down, and takes it back to the top. */
export function ToTop({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  const { c, still, tr } = useUI();
  if (!visible) return null;
  return (
    <Animated.View entering={still ? undefined : FadeInDown.duration(220)} style={{ position: 'absolute', right: 18, bottom: 22 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={tr('Back to the top', 'மேலே செல்')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 48,
          paddingHorizontal: 16,
          borderRadius: 24,
          backgroundColor: c.primary,
          elevation: 6,
          shadowColor: '#000',
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}>
        <View style={{ transform: [{ rotate: '90deg' }] }}>
          <Icon name="back" size={20} color={c.onPrimary} stroke={2.2} />
        </View>
        <T v="label" color={c.onPrimary}>
          {tr('Top', 'மேலே')}
        </T>
      </Pressable>
    </Animated.View>
  );
}

/** A row of chips that wraps onto the next line, so no chip is ever cut off at the screen's edge. */
export function HScroll({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 }, style]}>{children}</View>;
}

export function DetailLine({ icon, text }: { icon: Parameters<typeof Icon>[0]['name']; text: string }) {
  const { c } = useUI();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3, gap: 10 }}>
      <Icon name={icon} size={18} color={c.ink3} />
      <T v="label" color={c.ink2} style={{ flex: 1 }}>
        {text}
      </T>
    </View>
  );
}

export function lastLabel(at: number, L: { backupNever: string; backupLast: (s: string) => string }, tamil: boolean): string {
  if (!at) return L.backupNever;
  const d = new Date(at);
  return L.backupLast(`${longDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, tamil)}, ${clock(at)}`);
}
