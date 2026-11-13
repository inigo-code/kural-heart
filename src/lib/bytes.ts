// Small byte helpers: UTF-8 and base64. Backups carry every photo, voice note and video as base64 inside one JSON
// text, often tens of megabytes, so these fill typed arrays and turn them into strings a chunk at a time rather than
// growing JavaScript arrays and strings one character at a time (which made a restore take minutes). The engine's own
// TextEncoder and TextDecoder are used when it has them.

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const ENC = Uint8Array.from(B64, (ch) => ch.charCodeAt(0));
const LOOKUP = (() => {
  const t = new Int16Array(256).fill(-1);
  for (let i = 0; i < B64.length; i++) t[B64.charCodeAt(i)] = i;
  t['-'.charCodeAt(0)] = 62;
  t['_'.charCodeAt(0)] = 63;
  return t;
})();

/** Character codes to a string, in slices small enough for the call stack. */
function codesToString(codes: Uint8Array | Uint16Array, length = codes.length): string {
  const parts: string[] = [];
  for (let i = 0; i < length; i += 8192) {
    parts.push(String.fromCharCode.apply(null, codes.subarray(i, Math.min(length, i + 8192)) as unknown as number[]));
  }
  return parts.join('');
}

export function toBase64(bytes: Uint8Array): string {
  const n = bytes.length;
  const out = new Uint8Array(Math.ceil(n / 3) * 4);
  let o = 0;
  let i = 0;
  for (; i + 2 < n; i += 3) {
    const v = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out[o++] = ENC[v >> 18];
    out[o++] = ENC[(v >> 12) & 63];
    out[o++] = ENC[(v >> 6) & 63];
    out[o++] = ENC[v & 63];
  }
  if (i < n) {
    const a = bytes[i];
    const b = i + 1 < n ? bytes[i + 1] : 0;
    out[o++] = ENC[a >> 2];
    out[o++] = ENC[((a & 3) << 4) | (b >> 4)];
    out[o++] = i + 1 < n ? ENC[(b & 15) << 2] : 61;
    out[o++] = 61;
  }
  return codesToString(out);
}

export function fromBase64(s: string): Uint8Array {
  const out = new Uint8Array(Math.floor((s.length * 3) / 4) + 3);
  let o = 0;
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    const v = ch < 256 ? LOOKUP[ch] : -1;
    if (v < 0) continue; // padding, line breaks
    acc = ((acc << 6) | v) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (acc >> bits) & 255;
    }
  }
  return out.subarray(0, o);
}

type Encoder = { encode(s: string): Uint8Array };
type Decoder = { decode(b: Uint8Array): string };
const g = globalThis as unknown as { TextEncoder?: new () => Encoder; TextDecoder?: new (label?: string) => Decoder };
const encoder: Encoder | null = (() => {
  try {
    return g.TextEncoder ? new g.TextEncoder() : null;
  } catch {
    return null;
  }
})();
const decoder: Decoder | null = (() => {
  try {
    return g.TextDecoder ? new g.TextDecoder('utf-8') : null;
  } catch {
    return null;
  }
})();

export function utf8(s: string): Uint8Array {
  if (encoder) return encoder.encode(s);
  const out = new Uint8Array(s.length * 3);
  let o = 0;
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c < 0x80) {
      out[o++] = c;
      continue;
    }
    if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d < 0xe000) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i++;
      }
    }
    if (c < 0x800) {
      out[o++] = 0xc0 | (c >> 6);
      out[o++] = 0x80 | (c & 63);
    } else if (c < 0x10000) {
      out[o++] = 0xe0 | (c >> 12);
      out[o++] = 0x80 | ((c >> 6) & 63);
      out[o++] = 0x80 | (c & 63);
    } else {
      out[o++] = 0xf0 | (c >> 18);
      out[o++] = 0x80 | ((c >> 12) & 63);
      out[o++] = 0x80 | ((c >> 6) & 63);
      out[o++] = 0x80 | (c & 63);
    }
  }
  return out.slice(0, o);
}

export function fromUtf8(b: Uint8Array): string {
  if (decoder) return decoder.decode(b);
  const codes = new Uint16Array(b.length);
  let o = 0;
  for (let i = 0; i < b.length; ) {
    const x = b[i];
    let c: number;
    if (x < 0x80) {
      codes[o++] = x;
      i += 1;
      continue;
    } else if (x < 0xe0) {
      c = ((x & 31) << 6) | (b[i + 1] & 63);
      i += 2;
    } else if (x < 0xf0) {
      c = ((x & 15) << 12) | ((b[i + 1] & 63) << 6) | (b[i + 2] & 63);
      i += 3;
    } else {
      c = ((x & 7) << 18) | ((b[i + 1] & 63) << 12) | ((b[i + 2] & 63) << 6) | (b[i + 3] & 63);
      i += 4;
    }
    if (c >= 0x10000) {
      c -= 0x10000;
      codes[o++] = 0xd800 + (c >> 10);
      codes[o++] = 0xdc00 + (c & 1023);
    } else codes[o++] = c;
  }
  return codesToString(codes, o);
}

export function concat(...arrays: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrays) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}

export function hex(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}
