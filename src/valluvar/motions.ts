// Valluvar's motions, mirrored from the `.tv` rules in docs/canvas/project/olai.css. Keep the two in step.
// The pose functions run on the UI thread (they are worklets), so they use only plain data.

export type Key = { at: number; rot: number; tx: number; ty: number; sx: number; sy: number; skew: number; alpha: number };

const K = (at: number, p: Partial<Omit<Key, 'at'>> = {}): Key => ({ at, rot: 0, tx: 0, ty: 0, sx: 1, sy: 1, skew: 0, alpha: 1, ...p });

/** A cubic-bezier easing as [x1, y1, x2, y2]. */
export type Easing = [number, number, number, number];
const EASE_IN_OUT: Easing = [0.42, 0, 0.58, 1];
const EASE: Easing = [0.25, 0.1, 0.25, 1];
const EASE_OUT: Easing = [0, 0, 0.58, 1];
const BURST: Easing = [0.2, 0.6, 0.3, 1];
const LINEAR: Easing = [0, 0, 1, 1];

export type Motion = {
  keys: Key[];
  duration: number;
  /** The CSS function order, for example "RT" for rotate() then translateY(). */
  order: string;
  /** Null means the group's own centre (CSS transform-box: fill-box). */
  origin: [number, number] | null;
  easing: Easing;
  phase: number;
  alternate: boolean;
  iterations: number;
};

const M = (keys: Key[], duration: number, order: string, origin: [number, number] | null, more: Partial<Motion> = {}): Motion => ({
  keys,
  duration,
  order,
  origin,
  easing: EASE_IN_OUT,
  phase: 0,
  alternate: false,
  iterations: 0,
  ...more,
});

/** A there-and-back loop: rest at 0 and 1, [mid] at the half. */
const loop = (mid: Partial<Key>, rest: Partial<Key> = {}) => [K(0, rest), K(0.5, mid), K(1, rest)];

export const ONCE = ['tv-bounce', 'tv-confetti', 'tv-armsL', 'tv-armsR'];

const head: [number, number] = [120, 76];
const legLeft = [K(0, { rot: -14 }), K(0.5, { rot: 14 }), K(1, { rot: -14 })];
const legRight = [K(0, { rot: 14 }), K(0.5, { rot: -14 }), K(1, { rot: 14 })];
const twinkle = loop({ sx: 1.2, sy: 1.2, rot: 18 }, { sx: 0.85, sy: 0.85, alpha: 0.65 });
const leafFloat = loop({ ty: -3.5, rot: -2 }, { rot: -5 });

const heads: Record<string, Motion> = {
  'h-scan': M(loop({ rot: 3.2, ty: 2 }, { rot: -2.5 }), 3600, 'RT', head),
  'h-write': M(loop({ rot: 9.5, ty: 3 }, { rot: 6, ty: 1 }), 1400, 'RT', head),
  'h-cont': M(loop({ rot: 2, ty: -3.5 }, { rot: -3, ty: -1 }), 3200, 'RT', head),
  'h-listen': M([K(0, { rot: -6 }), K(0.4, { rot: -2, ty: 3 }), K(0.75, { rot: -5, ty: 1 }), K(1, { rot: -6 })], 2200, 'RT', head),
  'h-rest': M(loop({ rot: 1, ty: 2.5 }, { rot: -1.5, ty: 1 }), 5600, 'RT', head),
};
const nod = M([K(0), K(0.45, { rot: 10, ty: 5 }), K(1)], 550, 'RT', head, { iterations: 2 });

const table: Record<string, Motion> = {
  'tv-breath': M(loop({ sy: 1.028, ty: -2 }), 3600, 'ST', [120, 148]),
  'tv-bun': M(loop({ ty: -2.5, rot: -3 }), 1800, 'TR', [120, 30]),
  'tv-brow': M(loop({ ty: -1.8 }), 3200, 'T', [120, 50]),
  'tv-blink': M(
    [0, 0.44, 0.46, 0.48, 0.92, 0.94, 0.96, 1].map((at, i) => K(at, { sy: i === 2 || i === 5 ? 0.08 : 1 })),
    4000,
    'S',
    [120, 58],
    { easing: EASE },
  ),
  'tv-chant': M(loop({ sy: 1.15 }, { sy: 0.35 }), 650, 'S', head),
  'tv-cloth': M(loop({ skew: -2.2 }), 3000, 'K', [132, 92]),
  'tv-float': M(leafFloat, 3600, 'TR', [120, 128]),
  'tv-float30': M(leafFloat, 3000, 'TR', [120, 122]),
  'tv-twinkle': M(twinkle, 3200, 'SR', null),
  'tv-twinkle2': M(twinkle, 2600, 'SR', null),
  'tv-cloud': M(loop({ sx: 1.07, sy: 1.07, ty: -3 }), 2800, 'ST', null),
  'tv-stylus': M(
    [K(0), K(0.25, { tx: 9, ty: -3, rot: -6 }), K(0.5, { tx: 18, ty: 1, rot: 3 }), K(0.75, { tx: 26, ty: -2, rot: -4 }), K(1)],
    1400,
    'TR',
    [84, 96],
  ),
  'tv-spark': M(loop({ sx: 1.25, sy: 1.25, ty: -6 }, { sx: 0.6, sy: 0.6, alpha: 0.2 }), 700, 'ST', [125, 154]),
  'tv-beard': M(loop({ ty: 4, rot: -4 }), 2400, 'TR', [82, 98]),
  'tv-tamil': M(loop({ ty: -9, tx: 3 }, { alpha: 0.75 }), 2400, 'T', [0, 0]),
  'tv-teach': M(loop({ rot: -14, ty: -4 }), 1800, 'RT', [158, 98]),
  'tv-walk': M([K(0), K(0.25, { ty: -4 }), K(0.5), K(0.75, { ty: -4 }), K(1)], 1600, 'T', [0, 0], { easing: LINEAR }),
  'tv-legL': M(legLeft, 1600, 'R', [104, 154]),
  'tv-legR': M(legRight, 1600, 'R', [132, 154]),
  'tv-billow': M(loop({ rot: -5, skew: -6 }), 1600, 'RK', [120, 132]),
  'tv-staff': M(legLeft, 1600, 'R', [142, 84]),
  'tv-carry': M(legRight, 1600, 'R', [90, 86]),
  'tv-bounce': M(loop({ ty: -6, sy: 1.03 }), 1200, 'TS', [120, 180]),
  'tv-confetti': M(twinkle, 1200, 'SR', null),
  'tv-armsL': M(loop({ rot: -12, ty: -4 }), 1200, 'RT', [80, 100]),
  'tv-armsR': M(loop({ rot: -12, ty: -4 }), 1200, 'RT', [160, 100]),
  // The canvas animates the ring's radius from 36 to 86 on a 42 ring; here that is a scale about its centre.
  'tv-sonar': M([K(0, { sx: 36 / 42, sy: 36 / 42, alpha: 0.75 }), K(1, { sx: 86 / 42, sy: 86 / 42, alpha: 0 })], 2000, 'S', [120, 68], { easing: EASE_OUT }),
  'tv-shimmer': M([K(0, { tx: -45, alpha: 0 }), K(0.5, { alpha: 0.9 }), K(1, { tx: 45, alpha: 0 })], 2400, 'T', [0, 0]),
  'tv-wave': M([K(0, { rot: -8 }), K(1, { rot: 10 })], 900, 'R', [160, 100], { alternate: true }),
  'tv-burst': M([K(0, { sx: 0.6, sy: 0.6, alpha: 0.9 }), K(1, { sx: 2.3, sy: 2.3, alpha: 0 })], 1600, 'S', [120, 126], { easing: BURST }),
};

/** Duration classes from the canvas (d36 = 3.6 s on a head, b24 = 2.4 s on a breath). */
function durationClass(classes: string[], prefix: string): number | null {
  const c = classes.find((x) => x.length === 3 && x[0] === prefix && /\d\d/.test(x.slice(1)));
  return c ? Number(c.slice(1)) * 100 : null;
}

export type Opts = { face: { eyes: string; mouth: string; focused: boolean }; typing: boolean; nod: boolean };

export function pickMotion(classes: string[], o: Opts): Motion | null {
  if (classes.includes('tv-head')) {
    if (o.nod) return nod;
    const name = Object.keys(heads).find((h) => classes.includes(h));
    if (!name) return null;
    const d = durationClass(classes, 'd');
    return d ? { ...heads[name], duration: d } : heads[name];
  }
  const name = classes.find((x) => table[x]);
  if (!name) return null;
  const base = table[name];
  switch (name) {
    case 'tv-breath': {
      const d = durationClass(classes, 'b');
      return d ? { ...base, duration: d } : base;
    }
    case 'tv-brow':
      return o.face.focused ? { ...base, keys: loop({ ty: -1 }, { ty: 1 }), duration: 1400 } : base;
    case 'tv-stylus':
      return o.typing ? { ...base, duration: 800 } : base;
    case 'tv-burst':
      return classes.includes('b2') ? { ...base, phase: 1600 - 550 } : base;
    case 'tv-sonar':
      return classes.includes('s2') ? { ...base, phase: 2000 - 900 } : base;
    case 'tv-confetti':
      return classes.includes('c2') ? { ...base, duration: 1600 } : base;
    default:
      return base;
  }
}

// --- worklets: sampling a motion at a moment ---

function bezier(e: Easing, x: number): number {
  'worklet';
  const [x1, y1, x2, y2] = e;
  if (x1 === y1 && x2 === y2) return x;
  let lo = 0;
  let hi = 1;
  let t = x;
  for (let i = 0; i < 20; i++) {
    const cx = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
    if (Math.abs(cx - x) < 1e-4) break;
    if (cx < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
}

/** The pose at [t] ms as [rot, tx, ty, sx, sy, skew, alpha]. [settle] stops it after two plays, at its first frame. */
export function poseAt(m: Motion, t: number, settle: boolean): number[] {
  'worklet';
  const plays = settle ? 2 : m.iterations;
  const local = t + m.phase;
  const keys = m.keys;
  let p: number;
  if (plays > 0 && local >= plays * m.duration) p = 0;
  else {
    const cycle = m.alternate ? m.duration * 2 : m.duration;
    p = (local % cycle) / m.duration;
    if (m.alternate && p > 1) p = 2 - p;
  }
  let i = 0;
  for (let j = 0; j < keys.length; j++) if (keys[j].at <= p) i = j;
  if (i > keys.length - 2) i = keys.length - 2;
  const a = keys[i];
  const b = keys[i + 1];
  const span = b.at - a.at;
  const e = span > 0 ? bezier(m.easing, Math.min(1, Math.max(0, (p - a.at) / span))) : 1;
  const l = (x: number, y: number) => x + (y - x) * e;
  return [l(a.rot, b.rot), l(a.tx, b.tx), l(a.ty, b.ty), l(a.sx, b.sx), l(a.sy, b.sy), l(a.skew, b.skew), l(a.alpha, b.alpha)];
}

/** Affine matrices in SVG order [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f. */
export function mul(m: number[], n: number[]): number[] {
  'worklet';
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

export function poseMatrix(order: string, pose: number[], ox: number, oy: number): number[] {
  'worklet';
  let m = [1, 0, 0, 1, ox, oy];
  for (let i = 0; i < order.length; i++) {
    const op = order[i];
    if (op === 'T') m = mul(m, [1, 0, 0, 1, pose[1], pose[2]]);
    else if (op === 'R') {
      const r = (pose[0] * Math.PI) / 180;
      m = mul(m, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]);
    } else if (op === 'S') m = mul(m, [pose[3], 0, 0, pose[4], 0, 0]);
    else if (op === 'K') m = mul(m, [1, 0, Math.tan((pose[5] * Math.PI) / 180), 1, 0, 0]);
  }
  return mul(m, [1, 0, 0, 1, -ox, -oy]);
}
