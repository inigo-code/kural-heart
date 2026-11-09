// Parses the generated art (art.ts) once into a flat list of drawing steps, with Skia paths and paints made up front.
// Flat, not a tree, so the per-frame drawing on the UI thread is one loop with no recursion.

import { PaintStyle, Skia, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';
import type { SkPaint, SkPath } from '@shopify/react-native-skia';

import { ART } from './art';

export type GroupOp = { k: 'g'; end: number; classes: string[]; matrix: number[] | null; opacity: number; cx: number; cy: number };
export type ShapeOp = { k: 'p'; path: SkPath; fill: SkPaint | null; stroke: SkPaint | null; fillA: number; strokeA: number };
export type LetterOp = { k: 't'; x: number; y: number; size: number; text: string; paint: SkPaint; a: number };
export type EndOp = { k: 'e' };
export type Op = GroupOp | ShapeOp | LetterOp | EndOp;

function color(hex: string) {
  return Skia.Color(hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex);
}

let parsed: Op[] | null = null;

export function ops(): Op[] {
  if (parsed) return parsed;
  const out: Op[] = [];
  const open: number[] = [];
  const bounds: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const grow = (x0: number, y0: number, x1: number, y1: number) => {
    for (const b of bounds) {
      b.x0 = Math.min(b.x0, x0);
      b.y0 = Math.min(b.y0, y0);
      b.x1 = Math.max(b.x1, x1);
      b.y1 = Math.max(b.y1, y1);
    }
  };
  for (const raw of ART.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const f = line.split('|');
    if (f[0] === 'G') {
      open.push(out.length);
      bounds.push({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
      out.push({
        k: 'g',
        end: -1,
        classes: f[1].split(' ').filter(Boolean),
        matrix: f[2] === '-' ? null : f[2].split(',').map(Number),
        opacity: Number(f[3]),
        cx: 0,
        cy: 0,
      });
    } else if (f[0] === 'E') {
      const i = open.pop()!;
      const b = bounds.pop()!;
      const g = out[i] as GroupOp;
      g.end = out.length;
      if (Number.isFinite(b.x0)) {
        g.cx = (b.x0 + b.x1) / 2;
        g.cy = (b.y0 + b.y1) / 2;
      }
      out.push({ k: 'e' });
    } else if (f[0] === 'P') {
      const path = Skia.Path.MakeFromSVGString(f[1]);
      if (!path) continue;
      const r = path.computeTightBounds();
      grow(r.x, r.y, r.x + r.width, r.y + r.height);
      const opacity = Number(f[7]);
      let fill: SkPaint | null = null;
      let stroke: SkPaint | null = null;
      if (f[2] !== '-') {
        fill = Skia.Paint();
        fill.setAntiAlias(true);
        fill.setColor(color(f[2]));
      }
      if (f[3] !== '-') {
        stroke = Skia.Paint();
        stroke.setAntiAlias(true);
        stroke.setStyle(PaintStyle.Stroke);
        stroke.setColor(color(f[3]));
        stroke.setStrokeWidth(Number(f[4]));
        stroke.setStrokeCap(f[5] === 'round' ? StrokeCap.Round : f[5] === 'square' ? StrokeCap.Square : StrokeCap.Butt);
        stroke.setStrokeJoin(f[6] === 'round' ? StrokeJoin.Round : f[6] === 'bevel' ? StrokeJoin.Bevel : StrokeJoin.Miter);
        if (f[8] !== '-') {
          const d = f[8].split(/[ ,]+/).filter(Boolean).map(Number);
          if (d.length) stroke.setPathEffect(Skia.PathEffect.MakeDash(d.length % 2 ? [...d, ...d] : d, 0));
        }
      }
      out.push({ k: 'p', path, fill, stroke, fillA: opacity, strokeA: opacity });
    } else if (f[0] === 'T') {
      const x = Number(f[1]);
      const y = Number(f[2]);
      const size = Number(f[3]);
      grow(x, y - size, x + size, y);
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      paint.setColor(color(f[5]));
      out.push({ k: 't', x, y, size, text: f[6], paint, a: 1 });
    }
  }
  parsed = out;
  return out;
}
