import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { PixelRatio, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { today } from '@/lib/dates';
import { useJournal } from '@/lib/journal';
import { chapterOf, english, kural } from '@/lib/pack';
import type { Kural } from '@/lib/pack';
import { setSettings, useSettings } from '@/lib/settings';
import { isTamil } from '@/lib/types';
import { MUVA_BY, plainMarkdown, translator } from '@/ui/common';
import { KolamBand, MayilBorder } from '@/ui/kolam';
import { CoupletText } from '@/ui/leaf';
import { Button, Choice, Page, SectionLabel, SwitchRow, T } from '@/ui/parts';
import { F, alpha } from '@/ui/theme';
import { useUI } from '@/ui/ui';
import { valluvarImage } from '@/valluvar/Valluvar';

const ICON = require('../../../assets/icon.png');

/**
 * The share card's looks, each from Tamil life: a dawn sky, a night sky, terracotta, peacock blue, a banana leaf,
 * jasmine and turmeric. Every look keeps the palm leaf as it is (couplets flush left); only the ground, the inks and
 * the border around the card change. [story]/[post] are the background gradients for each shape.
 */
type CardTheme = {
  id: string;
  en: string;
  ta: string;
  story: string[];
  post: string[];
  /** Body text, quiet text, the small title line, and the name under the icon. */
  ink: string;
  quiet: string;
  title: string;
  brand: string;
  border: 'kolam' | 'silk' | null;
  borderInk: string;
};

const THEMES: CardTheme[] = [
  { id: 'dawn', en: 'Dawn', ta: 'விடியல்', story: ['#FFD08A', '#F5B98A', '#F6F2EA', '#EFE4CF'], post: ['#F6F2EA', '#EFE4CF'], ink: '#3B2F25', quiet: '#6A5A4A', title: '#5A2A12', brand: '#1E1A16', border: null, borderInk: '#B4492A' },
  { id: 'midnight', en: 'Midnight', ta: 'நள்ளிரவு', story: ['#0E1626', '#1D2340', '#241C1A'], post: ['#1B1714', '#2A211C'], ink: '#F3E7C6', quiet: '#C9B9A0', title: '#E8B98A', brand: '#F6F2EA', border: 'silk', borderInk: '#C9A45C' },
  { id: 'clay', en: 'Clay', ta: 'செம்மண்', story: ['#7A2E17', '#A8432A', '#C9643F'], post: ['#8E3820', '#B4492A'], ink: '#FFF4E8', quiet: '#F6D5C2', title: '#FFE2B8', brand: '#FFF8F0', border: 'kolam', borderInk: '#FFE2B8' },
  { id: 'peacock', en: 'Peacock', ta: 'மயில்', story: ['#0D2B3E', '#134E5E', '#1C6B6B'], post: ['#11364A', '#175C63'], ink: '#EAF6F2', quiet: '#B9D9D2', title: '#E2C26A', brand: '#F4FBF8', border: 'silk', borderInk: '#E2C26A' },
  { id: 'leaf', en: 'Banana leaf', ta: 'வாழையிலை', story: ['#C9E3C8', '#E4F0DC', '#F3F7EC'], post: ['#E1EDE6', '#C6DEC9'], ink: '#1E3A2B', quiet: '#3F5E4C', title: '#2F6B53', brand: '#14271D', border: 'kolam', borderInk: '#2F6B53' },
  { id: 'jasmine', en: 'Jasmine', ta: 'மல்லிகை', story: ['#FFFFFF', '#FBF8F1', '#F4EEE2'], post: ['#FFFFFF', '#F7F2E8'], ink: '#2E2620', quiet: '#6A5D50', title: '#A8475C', brand: '#1E1A16', border: 'silk', borderInk: '#C9A45C' },
  { id: 'turmeric', en: 'Turmeric', ta: 'மஞ்சள்', story: ['#F6C344', '#F9D978', '#FCEFC4'], post: ['#F8D35E', '#FBE7A4'], ink: '#3A2A10', quiet: '#6A5020', title: '#8E3820', brand: '#2A1E0A', border: 'kolam', borderInk: '#8E3820' },
];

const themeOf = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

export default function ShareScreen() {
  const { n: raw } = useLocalSearchParams<{ n: string }>();
  const k = kural(Math.min(1330, Math.max(1, Number(raw) || 1)));
  const { L, c, tr, tamil } = useUI();
  const s = useSettings();
  const { entries } = useJournal();
  const { width, height } = useWindowDimensions();
  const [story, setStory] = useState(false);
  const [addMine, setAddMine] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<ComponentRef<typeof View>>(null);
  const mine = entries.find((e) => e.kural === k.n && e.date === today());
  const line = addMine && mine ? plainMarkdown(mine.text).split('\n')[0].slice(0, 160) : null;
  const theme = themeOf(s.shareTheme);
  // The card is laid out at 1080 pixels wide, then shown scaled down.
  const W = 1080 / PixelRatio.get();
  const H = ((story ? 1920 : 1350) / 1080) * W;
  const fit = Math.min((width - 48) / W, (height * 0.48) / H);
  const share = async () => {
    setBusy(true);
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: L.shareTitle });
    } catch {}
    setBusy(false);
  };
  return (
    <Page title={L.shareTitle} close contentStyle={{ alignItems: 'stretch' }}>
      <View style={{ height: H * fit, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
        <View style={{ width: W, height: H, transform: [{ scale: fit }], borderRadius: 20 / fit, overflow: 'hidden' }}>
          <View ref={ref} collapsable={false} style={{ width: W, height: H }}>
            <Card k={k} story={story} line={line} tamil={s.tamil} translation={s.translation} W={W} H={H} theme={theme} />
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Choice label={L.sharePost} on={!story} onPress={() => setStory(false)} style={{ flex: 1 }} />
        <Choice label={L.shareStory} on={story} onPress={() => setStory(true)} style={{ flex: 1 }} />
      </View>
      <SectionLabel style={{ marginTop: 16 }}>{tr('Look', 'தோற்றம்')}</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 2, paddingBottom: 4 }}>
        {THEMES.map((t) => {
          const on = t.id === theme.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setSettings({ shareTheme: t.id })}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={tamil ? t.ta : t.en}
              style={{ alignItems: 'center', gap: 6, width: 72 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, padding: 3, borderWidth: 2.5, borderColor: on ? c.primary : 'transparent' }}>
                <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: c.line }}>
                  <LinearGradient colors={t.story as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
                  <View style={{ position: 'absolute', left: 12, right: 12, top: 16, height: 18, borderRadius: 5, backgroundColor: '#EAD9B0' }} />
                </View>
              </View>
              <T v="small" color={on ? c.ink : c.ink3} numberOfLines={1} adjustsFontSizeToFit>
                {tamil ? t.ta : t.en}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>
      {mine ? <SwitchRow title={L.shareMine} sub={L.shareMineSub} value={addMine} onChange={setAddMine} divider={false} /> : null}
      <Button label={L.share} icon="share" busy={busy} style={{ marginTop: 12 }} onPress={share} />
    </Page>
  );
}

/**
 * The share image. Story (9:16): the theme's sky, Valluvar reading, then the leaf. Post (4:5): the leaf first,
 * Valluvar below. Couplets are always flush left. Units are pixels of the 1080-wide image.
 */
function Card({ k, story, line, tamil, translation, W, H, theme }: { k: Kural; story: boolean; line: string | null; tamil: boolean; translation: 'aiyar' | 'pope' | 'popeprose'; W: number; H: number; theme: CardTheme }) {
  const u = W / 1080;
  const ch = chapterOf(k);
  const valluvar = useMemo(() => valluvarImage('reading', story ? 600 : 330), [story]);
  const rib = '#7A5A2E';
  const margin = 96 * u;
  // Tamil-led share images carry Mu. Va.'s Tamil explanation; otherwise the chosen English.
  const text = line ? `“${line}”` : tamil && k.ta ? k.ta : english(k, translation);
  const colors = (story ? theme.story : theme.post) as [string, string, ...string[]];
  const dark = theme.brand.toUpperCase().startsWith('#F');
  return (
    <View style={{ width: W, height: H }}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />
      {/* The border: a kolam band or a silk border along the top and bottom of the card. */}
      {theme.border === 'kolam' ? (
        <>
          <KolamBand height={40 * u} color={theme.borderInk} strength={2.6} style={{ position: 'absolute', left: 0, right: 0, top: 26 * u }} />
          <KolamBand height={40 * u} color={theme.borderInk} strength={2.6} style={{ position: 'absolute', left: 0, right: 0, bottom: 22 * u }} />
        </>
      ) : theme.border === 'silk' ? (
        <>
          <MayilBorder height={34 * u} color={theme.borderInk} strength={1.4} style={{ position: 'absolute', left: 40 * u, right: 40 * u, top: 34 * u }} />
          <MayilBorder height={34 * u} color={theme.borderInk} strength={1.4} style={{ position: 'absolute', left: 40 * u, right: 40 * u, bottom: 28 * u }} />
        </>
      ) : null}
      <View style={{ paddingHorizontal: margin, paddingTop: (story ? 110 : 100) * u }}>
        <Text allowFontScaling={false} style={{ fontFamily: F.serifTamil, fontSize: 38 * u, color: theme.title }}>
          {`திருக்குறள் · ${tamil ? 'குறள்' : 'Kural'} ${k.n}`}
        </Text>
        {story && valluvar ? (
          <View style={{ alignItems: 'center', marginTop: 40 * u }}>
            <View
              style={{
                position: 'absolute',
                top: 20 * u,
                width: 540 * u,
                height: 570 * u,
                borderTopLeftRadius: 300 * u,
                borderTopRightRadius: 300 * u,
                borderRadius: 40 * u,
                backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)',
              }}
            />
            <Image source={{ uri: valluvar }} style={{ width: 600 * u, height: 550 * u }} />
          </View>
        ) : null}
        <View
          style={{
            marginTop: (story ? 30 : 60) * u,
            borderRadius: 44 * u,
            overflow: 'hidden',
            borderWidth: 3 * u,
            borderColor: alpha(rib, 0.22),
            paddingLeft: 50 * u,
            paddingRight: 40 * u,
            paddingTop: 90 * u,
            paddingBottom: 40 * u,
          }}>
          <LinearGradient colors={['#F3E7C6', '#E7D4A2']} style={StyleSheet.absoluteFill} />
          {/* Two ribs by the edges, as on the app's leaf, so none runs through the writing. */}
          {[{ top: 14 * u }, { bottom: 12 * u }].map((at, i) => (
            <View key={i} style={{ position: 'absolute', left: 6 * u, right: 6 * u, ...at, height: 3 * u, backgroundColor: alpha(rib, 0.1) }} />
          ))}
          <View style={{ position: 'absolute', top: 25 * u, alignSelf: 'center', width: 30 * u, height: 30 * u, borderRadius: 15 * u, backgroundColor: '#F6F2EA', borderWidth: 4 * u, borderColor: alpha(rib, 0.28) }} />
          <CoupletText a={k.a} b={k.b} max={68 * u} min={36 * u} fixed />
          <Text allowFontScaling={false} style={{ fontFamily: F.sans, fontSize: 32 * u, color: '#6A4B22', marginTop: 24 * u }}>
            {`அதிகாரம் ${ch.n} · ${ch.ta} · ${ch.en}`}
          </Text>
        </View>
        <Text
          allowFontScaling={false}
          numberOfLines={story ? 8 : 5}
          style={{
            fontFamily: isTamil(text) ? F.serifTamil : F.serifItalic,
            fontSize: (story ? 46 : 42) * u,
            lineHeight: (story ? 46 : 42) * (isTamil(text) ? 1.6 : 1.35) * u,
            color: theme.ink,
            marginTop: 60 * u,
          }}>
          {text}
        </Text>
        {!line ? (
          <Text allowFontScaling={false} style={{ fontFamily: F.sans, fontSize: 30 * u, color: theme.quiet, marginTop: 24 * u }}>
            {`— ${tamil && k.ta ? MUVA_BY.ta : translator(translation)}`}
          </Text>
        ) : null}
      </View>
      {!story && valluvar ? <Image source={{ uri: valluvar }} style={{ position: 'absolute', right: margin - 30 * u, bottom: 40 * u, width: 330 * u, height: 302 * u }} /> : null}
      <View style={{ position: 'absolute', left: margin, bottom: 96 * u, flexDirection: 'row', alignItems: 'center' }}>
        <Image source={ICON} style={{ width: 84 * u, height: 84 * u, borderRadius: 20 * u }} />
        <View style={{ marginLeft: 24 * u }}>
          <Text allowFontScaling={false} style={{ fontFamily: F.serif, fontSize: 44 * u, color: theme.brand }}>
            Kural Heart
          </Text>
          <Text allowFontScaling={false} style={{ fontFamily: F.sans, fontSize: 28 * u, color: theme.quiet }}>
            {tamil ? 'குறளுடன் நாட்குறிப்பு' : 'A journal with the Kural'}
          </Text>
        </View>
      </View>
    </View>
  );
}
