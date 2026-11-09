// Tamil to a simple English spelling, for reading a couplet aloud without knowing the script: written as it sounds,
// not letter for letter. Tamil's five stops (க ச ட த ப) soften between vowels and after a nasal (agara, mudhala,
// pagavan) and stay hard at the start of a word or when doubled (karka, ezhuththu). Generated from the pack's text,
// never typed by hand.

const VOWELS: Record<string, string> = {
  'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo',
  'எ': 'e', 'ஏ': 'e', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'o', 'ஔ': 'au',
};

const SIGNS: Record<string, string> = {
  'ா': 'aa', 'ி': 'i', 'ீ': 'ee', 'ு': 'u', 'ூ': 'oo', 'ெ': 'e', 'ே': 'e', 'ை': 'ai', 'ொ': 'o', 'ோ': 'o', 'ௌ': 'au',
};

const VIRAMA = '்';

/** Each consonant as [hard, soft]: hard at the start of a word, doubled or after a hard consonant; soft otherwise. */
const CONS: Record<string, [string, string]> = {
  'க': ['k', 'g'], 'ச': ['s', 's'], 'ட': ['t', 'd'], 'த': ['th', 'dh'], 'ப': ['p', 'b'],
  'ங': ['ng', 'ng'], 'ஞ': ['nj', 'nj'], 'ண': ['n', 'n'], 'ந': ['n', 'n'], 'ம': ['m', 'm'], 'ன': ['n', 'n'],
  'ய': ['y', 'y'], 'ர': ['r', 'r'], 'ல': ['l', 'l'], 'வ': ['v', 'v'], 'ழ': ['zh', 'zh'], 'ள': ['l', 'l'], 'ற': ['r', 'r'],
  'ஜ': ['j', 'j'], 'ஷ': ['sh', 'sh'], 'ஸ': ['s', 's'], 'ஹ': ['h', 'h'],
};

const NASALS = new Set(['ங', 'ஞ', 'ண', 'ந', 'ம', 'ன']);
const STOPS = new Set(['க', 'ச', 'ட', 'த', 'ப']);

function word(w: string): string {
  let out = '';
  let prev: 'start' | 'vowel' | 'nasal' | 'cons' = 'start';
  let prevCons = '';
  const chars = [...w];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (VOWELS[ch]) {
      out += VOWELS[ch];
      prev = 'vowel';
      prevCons = '';
      continue;
    }
    if (ch === 'ஃ') {
      out += 'h';
      prev = 'cons';
      continue;
    }
    const pair = CONS[ch];
    if (!pair) {
      out += ch;
      prev = 'start';
      prevCons = '';
      continue;
    }
    const next = chars[i + 1];
    const dead = next === VIRAMA;
    let sound: string;
    if (STOPS.has(ch)) {
      const doubled = prevCons === ch;
      // A stop with no vowel of its own (க், த்) is always said hard.
      if (ch === 'ச') sound = dead || doubled ? 'ch' : prev === 'nasal' ? 'j' : 's';
      else if (dead || doubled || prev === 'start' || prev === 'cons') sound = pair[0];
      else sound = pair[1];
    } else if (ch === 'ங' && dead) {
      // ங் before க is the "ng" of "muyanga": the க that follows supplies the g.
      sound = 'n';
    } else if (ch === 'ற' && prevCons === 'ற') {
      // ற்ற is said "tr", and ன்ற "ndr": the first ற already wrote its sound.
      out = out.slice(0, -1);
      sound = 'tr';
    } else if (ch === 'ற' && prevCons === 'ன') {
      sound = 'dr';
    } else {
      sound = pair[0];
    }
    out += sound;
    if (dead) {
      i++;
      prev = NASALS.has(ch) ? 'nasal' : 'cons';
      prevCons = ch;
      continue;
    }
    const sign = SIGNS[next ?? ''];
    if (sign) {
      out += sign;
      i++;
    } else out += 'a';
    prev = 'vowel';
    prevCons = '';
  }
  return out;
}

/** One line of Tamil in simple English spelling, its first letter capitalised. */
export function pronounce(line: string): string {
  const s = line
    .split(/\s+/)
    .filter(Boolean)
    .map(word)
    .join(' ')
    // An extra vowel written to lengthen a sound (தொழாஅர்) adds no new syllable.
    .replace(/aaa/g, 'aa')
    .replace(/eee/g, 'ee')
    .replace(/ooo/g, 'oo');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Scholarly transliteration (ISO 15919, as Tamil scholarship and the Madras Tamil Lexicon write it): letter for letter,
// long vowels with a macron and the retroflex and alveolar consonants with dots and lines below, so the spelling can
// be turned back into the script. ஃ is written ḥ: the font has no ḵ.

const ISO_VOWELS: Record<string, string> = {
  'அ': 'a', 'ஆ': 'ā', 'இ': 'i', 'ஈ': 'ī', 'உ': 'u', 'ஊ': 'ū',
  'எ': 'e', 'ஏ': 'ē', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'ō', 'ஔ': 'au',
};

const ISO_SIGNS: Record<string, string> = {
  'ா': 'ā', 'ி': 'i', 'ீ': 'ī', 'ு': 'u', 'ூ': 'ū', 'ெ': 'e', 'ே': 'ē', 'ை': 'ai', 'ொ': 'o', 'ோ': 'ō', 'ௌ': 'au',
};

const ISO_CONS: Record<string, string> = {
  'க': 'k', 'ங': 'ṅ', 'ச': 'c', 'ஞ': 'ñ', 'ட': 'ṭ', 'ண': 'ṇ', 'த': 't', 'ந': 'n', 'ப': 'p', 'ம': 'm',
  'ய': 'y', 'ர': 'r', 'ல': 'l', 'வ': 'v', 'ழ': 'ḻ', 'ள': 'ḷ', 'ற': 'ṟ', 'ன': 'ṉ',
  'ஜ': 'j', 'ஷ': 'ṣ', 'ஸ': 's', 'ஹ': 'h',
};

/** One line of Tamil in ISO 15919. */
export function scholarly(line: string): string {
  const chars = [...line];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ISO_VOWELS[ch]) out += ISO_VOWELS[ch];
    else if (ch === 'ஃ') out += 'ḥ';
    else if (ISO_CONS[ch]) {
      out += ISO_CONS[ch];
      const next = chars[i + 1];
      if (next === VIRAMA) i++;
      else if (ISO_SIGNS[next ?? '']) {
        out += ISO_SIGNS[next];
        i++;
      } else out += 'a';
    } else if (ISO_SIGNS[ch] || ch === VIRAMA) {
      // A stray sign (a typing slip in a source) is dropped rather than shown as a broken letter.
    } else out += ch;
  }
  return out.replace(/\s+/g, ' ').trim();
}
