// Olai tokens, one for one with `.o` and `.o.night` in docs/canvas/project/olai.css. Change a colour there and here
// together.

export type Colors = {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  onSoft: string;
  aram: string;
  porul: string;
  inbam: string;
  aramSoft: string;
  porulSoft: string;
  inbamSoft: string;
  heart: string;
  gold: string;
  leaf1: string;
  leaf2: string;
  leafInk: string;
  leafNote: string;
  leafRib: string;
  isNight: boolean;
};

const LEAF = { heart: '#D63B58', gold: '#C9A45C', leaf1: '#F3E7C6', leaf2: '#E7D4A2', leafInk: '#2B1E10', leafNote: '#6A4B22', leafRib: '#7A5A2E' };

export const Ivory: Colors = {
  bg: '#F6F2EA',
  surface: '#FFFDF9',
  surface2: '#EFE8DC',
  surface3: '#E7DECF',
  ink: '#1E1A16',
  ink2: '#564D44',
  ink3: '#6B6156',
  line: '#E0D4C1',
  primary: '#B4492A',
  onPrimary: '#FFF8F2',
  // Strong enough to read as 'selected' on the ivory ground, not just a tint of it.
  primarySoft: '#F1D2C1',
  onSoft: '#6E2610',
  aram: '#2F6B53',
  porul: '#3A4E86',
  inbam: '#A8475C',
  aramSoft: '#E1EDE6',
  porulSoft: '#E2E6F2',
  inbamSoft: '#F4E1E5',
  ...LEAF,
  isNight: false,
};

export const Midnight: Colors = {
  bg: '#14110F',
  surface: '#1E1A17',
  surface2: '#28231F',
  surface3: '#332D28',
  ink: '#F3ECE2',
  ink2: '#CBC1B4',
  ink3: '#A0958A',
  line: '#352E28',
  primary: '#E58A62',
  onPrimary: '#2A140B',
  primarySoft: '#4D2C1C',
  onSoft: '#F8D2BE',
  aram: '#7FC3A5',
  porul: '#9DB0E6',
  inbam: '#E79AAD',
  aramSoft: '#1F2C26',
  porulSoft: '#1F2433',
  inbamSoft: '#33222A',
  ...LEAF,
  // On Midnight the leaf is dimmed to 90%, as in the canvas.
  leaf1: '#DBD0B2',
  leaf2: '#D0BF92',
  isNight: true,
};

/** The four accents a person can choose. Each keeps 4.5:1 contrast for its text on both grounds. */
export function withAccent(c: Colors, accent: string): Colors {
  const n = c.isNight;
  switch (accent) {
    case 'indigo':
      return n
        ? { ...c, primary: '#9DB0E6', onPrimary: '#10162A', primarySoft: '#2C3A63', onSoft: '#DCE3FA' }
        : { ...c, primary: '#3A4E86', onPrimary: '#F7F8FF', primarySoft: '#D3DAF0', onSoft: '#22305C' };
    case 'green':
      return n
        ? { ...c, primary: '#7FC3A5', onPrimary: '#0E1F18', primarySoft: '#21463A', onSoft: '#C9EBDA' }
        : { ...c, primary: '#2F6B53', onPrimary: '#F4FBF7', primarySoft: '#CDE3D7', onSoft: '#1A4333' };
    case 'rose':
      return n
        ? { ...c, primary: '#E79AAD', onPrimary: '#2A1118', primarySoft: '#55293A', onSoft: '#F8D5DE' }
        : { ...c, primary: '#A8475C', onPrimary: '#FFF7F9', primarySoft: '#F0CFD7', onSoft: '#64202F' };
    default:
      return c;
  }
}

export const ACCENT_SWATCH: Record<string, string> = { clay: '#B4492A', indigo: '#3A4E86', green: '#2F6B53', rose: '#A8475C' };

/**
 * Three bundled families (all SIL OFL, licences in assets/licenses), cut into static fonts by tools/fonts/make_fonts.py
 * because React Native can't set variable-font axes. Each weight is its own family name.
 */
export const F = {
  sans: 'AnekTamil-Regular',
  sansMedium: 'AnekTamil-Medium',
  sansSemi: 'AnekTamil-SemiBold',
  sansBold: 'AnekTamil-Bold',
  couplet: 'AnekTamil-Couplet',
  coupletBold: 'AnekTamil-CoupletBold',
  serif: 'Literata-Regular',
  serifMedium: 'Literata-Medium',
  serifSemi: 'Literata-SemiBold',
  serifItalic: 'Literata-Italic',
  serifTamil: 'NotoSerifTamil-Regular',
  serifTamilMedium: 'NotoSerifTamil-Medium',
  serifTamilSemi: 'NotoSerifTamil-SemiBold',
  serifTamilBold: 'NotoSerifTamil-ExtraBold',
};

export type Variant = 'display' | 'headline' | 'title' | 'body' | 'bodyM' | 'label' | 'labelM' | 'small';

type Style = { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing?: number };

/**
 * Type roles. Sizes are a step above Material's defaults because a journal is read slowly, and Tamil gets a further
 * lift: Anek Tamil's letters sit smaller than Latin ones at the same size. The text-size setting scales all of it.
 */
export function typeScale(tamil: boolean, scale: number): Record<Variant, Style> {
  const k = (tamil ? 1.08 : 1) * scale;
  const s = (size: number, lh: number, fontFamily: string, letterSpacing?: number): Style => ({
    fontFamily,
    fontSize: Math.round(size * scale * 10) / 10,
    lineHeight: Math.round(lh * scale),
    letterSpacing,
  });
  const heading = tamil ? F.serifTamilMedium : F.serifMedium;
  return {
    // Noto Serif Tamil's vowel signs reach far above and below the line, so Tamil headings get 1.6 leading.
    // Literata's descenders (g, y) need more than 1.25 leading on Android, or the last line's tails are cut.
    display: s(tamil ? 30 : 34, tamil ? 48 : 46, heading, tamil ? 0 : -0.3),
    headline: s(tamil ? 23 : 25, tamil ? 37 : 34, heading),
    title: { fontFamily: F.sansSemi, fontSize: 18 * k, lineHeight: Math.round(18 * k * 1.4) },
    body: { fontFamily: F.sans, fontSize: 17.5 * k, lineHeight: Math.round((tamil ? 32 : 28) * scale) },
    bodyM: { fontFamily: F.sans, fontSize: 16 * k, lineHeight: Math.round((tamil ? 29 : 25) * scale) },
    label: { fontFamily: F.sansSemi, fontSize: 15 * k, lineHeight: Math.round(15 * k * 1.35) },
    labelM: { fontFamily: F.sansMedium, fontSize: 14 * k, lineHeight: Math.round(14 * k * 1.35) },
    small: { fontFamily: F.sansMedium, fontSize: 12.5 * k, lineHeight: Math.round(12.5 * k * 1.35) },
  };
}

/** A style in Noto Serif Tamil with room for its tall vowel signs (used for Tamil titles in either language). */
export function tamilSerif(size: number, weight: 'regular' | 'medium' | 'semi' = 'medium') {
  const fontFamily = weight === 'regular' ? F.serifTamil : weight === 'semi' ? F.serifTamilSemi : F.serifTamilMedium;
  return { fontFamily, fontSize: size, lineHeight: Math.round(size * 1.62) };
}

export function toneColors(tone: string): [string, string, string] {
  switch (tone) {
    case 'rose':
      return ['#D65473', '#8A2238', '#6C1A2C'];
    case 'indigo':
      return ['#5C72B8', '#26366A', '#1B2852'];
    case 'green':
      return ['#4E9A79', '#1D4B3B', '#143A2D'];
    default:
      return ['#D2714A', '#8E3418', '#6E2810'];
  }
}

/** [hex] moved [k] (0 to 1) of the way towards [to]: for a gradient's lighter or darker end. */
export function mix(hex: string, to: string, k: number): string {
  const n = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const ch = (i: number) => Math.round(n(hex, i) + (n(to, i) - n(hex, i)) * k).toString(16).padStart(2, '0');
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

export function alpha(hex: string, a: number): string {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${v}`;
}
