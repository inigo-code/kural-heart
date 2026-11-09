// Small byte helpers: UTF-8 and base64 without relying on the JS engine's TextDecoder or atob.

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = (() => {
  const t = new Int16Array(256).fill(-1);
  for (let i = 0; i < B64.length; i++) t[B64.charCodeAt(i)] = i;
  t['-'.charCodeAt(0)] = 62;
  t['_'.charCodeAt(0)] = 63;
  return t;
})();

export function toBase64(bytes: Uint8Array): string {
  const out: string[] = [];
  let chunk = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    chunk +=
      B64[a >> 2] +
      B64[((a & 3) << 4) | (b >> 4)] +
      (i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : '=') +
      (i + 2 < bytes.length ? B64[c & 63] : '=');
    if (chunk.length > 8192) {
      out.push(chunk);
      chunk = '';
    }
  }
  out.push(chunk);
  return out.join('');
}

export function fromBase64(s: string): Uint8Array {
  let len = 0;
  const clean = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const v = LOOKUP[s.charCodeAt(i) & 255];
    if (v >= 0 && s.charCodeAt(i) < 256) clean[len++] = v;
  }
  const out = new Uint8Array(Math.floor((len * 3) / 4));
  let o = 0;
  for (let i = 0; i + 1 < len; i += 4) {
    const a = clean[i];
    const b = clean[i + 1];
    const c = i + 2 < len ? clean[i + 2] : 0;
    const d = i + 3 < len ? clean[i + 3] : 0;
    out[o++] = (a << 2) | (b >> 4);
    if (i + 2 < len) out[o++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < len) out[o++] = ((c & 3) << 6) | d;
  }
  return out.subarray(0, o);
}

export function utf8(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d < 0xe000) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i++;
      }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

export function fromUtf8(b: Uint8Array): string {
  const parts: string[] = [];
  let codes: number[] = [];
  for (let i = 0; i < b.length; ) {
    const x = b[i];
    let c: number;
    if (x < 0x80) {
      c = x;
      i += 1;
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
      codes.push(0xd800 + (c >> 10), 0xdc00 + (c & 1023));
    } else codes.push(c);
    if (codes.length > 4096) {
      parts.push(String.fromCharCode(...codes));
      codes = [];
    }
  }
  parts.push(String.fromCharCode(...codes));
  return parts.join('');
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
