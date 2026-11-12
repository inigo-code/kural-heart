import { Canvas, Group, ImageFormat, Picture, Skia, useClock, useFont } from '@shopify/react-native-skia';
import type { SkCanvas, SkFont, SkPicture } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useAnimatedReaction, useDerivedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { SharedValue } from 'react-native-reanimated';

import { useUI } from '@/ui/ui';

import { VIEW_HEIGHT, VIEW_WIDTH } from './art';
import { ops } from './model';
import type { Op } from './model';
import { ONCE, mul, pickMotion, poseAt, poseMatrix } from './motions';
import type { Motion, Opts } from './motions';

/** The eleven things Valluvar does. Each one is a separate drawing in the owner's model, not a pose of one rig. */
export type ValluvarState =
  | 'reading'
  | 'writing'
  | 'contemplating'
  | 'teaching'
  | 'walking'
  | 'celebrating'
  | 'listening'
  | 'presenting'
  | 'greeting'
  | 'resting'
  | 'awarding';

/** Faces: an eye mode plus a mouth, as in the canvas. */
const FACES = {
  smile: { eyes: 'e-n', mouth: 'm-smile', focused: false },
  greet: { eyes: 'e-n', mouth: 'm-joy', focused: false },
  talk: { eyes: 'e-n', mouth: 'm-chant', focused: false },
  focused: { eyes: 'e-n', mouth: 'm-smile', focused: true },
  thinking: { eyes: 'e-u', mouth: 'm-smile', focused: false },
  joy: { eyes: 'e-happy', mouth: 'm-joy', focused: false },
  proud: { eyes: 'e-happy', mouth: 'm-smile', focused: false },
  calm: { eyes: 'e-happy', mouth: 'm-smile', focused: false },
};
export type Face = keyof typeof FACES;

export function defaultFace(s: ValluvarState): Face {
  switch (s) {
    case 'writing':
      return 'focused';
    case 'contemplating':
      return 'thinking';
    case 'teaching':
      return 'talk';
    case 'celebrating':
    case 'awarding':
      return 'joy';
    case 'greeting':
      return 'greet';
    case 'resting':
      return 'calm';
    default:
      return 'smile';
  }
}

/** wink[i] is the centre [x, y] of the eye that winks, for the one shape that does. */
type Plan = { visible: boolean[]; motion: (Motion | null)[]; settle: boolean[]; wink: (number[] | null)[] };

function plan(list: Op[], state: ValluvarState, face: Face, typing: boolean, nod: boolean, once: boolean, winks = false): Plan {
  const o: Opts = { face: FACES[face], typing, nod };
  const stateClass = `s-${state}`;
  const visible: boolean[] = [];
  const motion: (Motion | null)[] = [];
  const settle: boolean[] = [];
  const wink: (number[] | null)[] = [];
  // Which groups we are inside, to find the open eyes (class e-n). The viewer's right eye is the one that winks.
  const open: string[][] = [];
  list.forEach((op, i) => {
    wink[i] = null;
    if (op.k === 'e') open.pop();
    if (op.k !== 'g') {
      visible[i] = true;
      motion[i] = null;
      settle[i] = false;
      if (winks && op.k === 'p' && open.some((c) => c.includes('e-n'))) {
        const r = op.path.computeTightBounds();
        const cx = r.x + r.width / 2;
        if (cx > 120 && r.width < 12) wink[i] = [cx, r.y + r.height / 2];
      }
      return;
    }
    open.push(op.classes);
    const c = op.classes;
    visible[i] = !(
      (c.includes('s') && !c.includes(stateClass)) ||
      (c.includes('e') && !c.includes(o.face.eyes)) ||
      (c.includes('m') && !c.includes(o.face.mouth))
    );
    motion[i] = pickMotion(c, o);
    settle[i] = once && c.some((x) => ONCE.includes(x));
  });
  return { visible, motion, settle, wink };
}

/** Draw the art at time [t] ms (or still, when t < 0) into [canvas], scaled by [k]. */
function draw(canvas: SkCanvas, list: Op[], p: Plan, t: number, k: number, font: SkFont | null) {
  'worklet';
  canvas.save();
  canvas.scale(k, k);
  const alphas = [1];
  for (let i = 0; i < list.length; i++) {
    const op = list[i];
    const a0 = alphas[alphas.length - 1];
    if (op.k === 'g') {
      if (!p.visible[i]) {
        i = op.end;
        continue;
      }
      const m = p.motion[i];
      let full = op.matrix ?? [1, 0, 0, 1, 0, 0];
      let poseAlpha = 1;
      if (m && t >= 0) {
        const pose = poseAt(m, t, p.settle[i]);
        const ox = m.origin ? m.origin[0] : op.cx;
        const oy = m.origin ? m.origin[1] : op.cy;
        full = mul(full, poseMatrix(m.order, pose, ox, oy));
        poseAlpha = pose[6];
      }
      const a = a0 * op.opacity * poseAlpha;
      if (a <= 0.001) {
        i = op.end;
        continue;
      }
      canvas.save();
      canvas.concat(Skia.Matrix([full[0], full[2], full[4], full[1], full[3], full[5], 0, 0, 1]));
      alphas.push(a);
    } else if (op.k === 'e') {
      canvas.restore();
      alphas.pop();
    } else if (op.k === 'p') {
      const w = p.wink[i];
      let winked = false;
      if (w && t >= 0) {
        // A wink every 2.6 s: the eye closes in 120 ms, stays shut briefly, and opens.
        const ph = (t % 2600) - 700;
        const shut = ph < 0 || ph > 420 ? 0 : ph < 120 ? ph / 120 : ph < 300 ? 1 : 1 - (ph - 300) / 120;
        if (shut > 0) {
          winked = true;
          canvas.save();
          canvas.translate(w[0], w[1]);
          canvas.scale(1, 1 - 0.88 * shut);
          canvas.translate(-w[0], -w[1]);
        }
      }
      if (op.fill) {
        op.fill.setAlphaf(a0 * op.fillA);
        canvas.drawPath(op.path, op.fill);
      }
      if (op.stroke) {
        op.stroke.setAlphaf(a0 * op.strokeA);
        canvas.drawPath(op.path, op.stroke);
      }
      if (winked) canvas.restore();
    } else if (op.k === 't' && font) {
      op.paint.setAlphaf(a0);
      canvas.save();
      canvas.translate(op.x, op.y);
      const s = op.size / 20;
      canvas.scale(s, s);
      canvas.drawText(op.text, 0, 0, op.paint, font);
      canvas.restore();
    }
  }
  canvas.restore();
}

function record(list: Op[], p: Plan, t: number, k: number, w: number, h: number, font: SkFont | null, top = 0): SkPicture {
  'worklet';
  const rec = Skia.PictureRecorder();
  // [top] is room kept above the art, for poses that rise out of it (the seal held high).
  const canvas = rec.beginRecording(Skia.XYWHRect(0, -top, w, h + top));
  draw(canvas, list, p, t, k, font);
  return rec.finishRecordingAsPicture();
}

const LETTERS = require('../../assets/fonts/NotoSerifTamil-ExtraBold.ttf');

/** Room kept above the art by default: his bun rises past the art's box as he bobs, bows and lifts. */
const DEFAULT_HEADROOM = 0.1;

type Props = {
  state: ValluvarState;
  size?: number;
  face?: Face;
  /** Freeze him (the system's and the app's reduce-motion settings also do). */
  still?: boolean;
  /** Let the celebration play twice and settle, as the seal moment needs. */
  once?: boolean;
  /** Speed the stylus while the person types. */
  typing?: boolean;
  /** One approving nod. */
  nod?: boolean;
  label?: string;
  /** Wink every few seconds (the splash screen). */
  wink?: boolean;
  /** Room above the art, as a share of its height, for poses that rise out of the frame. */
  headroom?: number;
  /** Called once the moving drawing is on screen (the splash hides its still stand-in then). */
  onDrawn?: () => void;
};

/** Valluvar at [size] wide (the art is 240 by 220). */
export function Valluvar(props: Props) {
  const ui = useUI();
  const frozen = props.still || ui.still;
  return frozen ? <StillValluvar {...props} /> : <MovingValluvar {...props} />;
}

function useSetup({ state, size = 240, face, typing = false, nod = false, once = false, wink = false }: Props) {
  const list = ops();
  const p = useMemo(() => plan(list, state, face ?? defaultFace(state), typing, nod, once, wink), [list, state, face, typing, nod, once, wink]);
  const w = size;
  const h = (size * VIEW_HEIGHT) / VIEW_WIDTH;
  return { list, p, w, h, k: size / VIEW_WIDTH };
}

/** The canvas: the art's box plus any headroom, with the picture moved down into it. */
function Frame({ props, w, h, picture }: { props: Props; w: number; h: number; picture: SkPicture | SharedValue<SkPicture> }) {
  const top = Math.round((props.headroom ?? DEFAULT_HEADROOM) * h);
  return (
    <View accessible={!!props.label} accessibilityLabel={props.label} style={{ width: w, height: h + top }}>
      <Canvas style={{ width: w, height: h + top }}>
        <Group transform={[{ translateY: top }]}>
          <Picture picture={picture} />
        </Group>
      </Canvas>
    </View>
  );
}

function MovingValluvar(props: Props) {
  const { list, p, w, h, k } = useSetup(props);
  const font = useFont(LETTERS, 20);
  const clock = useClock();
  const top = Math.round((props.headroom ?? DEFAULT_HEADROOM) * h);
  const picture = useDerivedValue(() => record(list, p, clock.value, k, w, h, font, top));
  // A few frames in, the moving drawing is certainly showing.
  const onDrawn = props.onDrawn;
  useAnimatedReaction(
    () => clock.value > 80,
    (now, before) => {
      if (now && !before && onDrawn) scheduleOnRN(onDrawn);
    },
  );
  return <Frame props={props} w={w} h={h} picture={picture} />;
}

function StillValluvar(props: Props) {
  const { list, p, w, h, k } = useSetup(props);
  const font = useFont(LETTERS, 20);
  const top = Math.round((props.headroom ?? DEFAULT_HEADROOM) * h);
  const picture = useMemo(() => record(list, p, -1, k, w, h, font, top), [list, p, k, w, h, font, top]);
  return <Frame props={props} w={w} h={h} picture={picture} />;
}

/** Valluvar drawn still into a PNG data URI, for share images. Letters (the Teaching state's) are left out. */
export function valluvarImage(state: ValluvarState, width: number): string | null {
  const list = ops();
  const p = plan(list, state, defaultFace(state), false, false, false);
  const h = Math.round((width * VIEW_HEIGHT) / VIEW_WIDTH);
  const surface = Skia.Surface.MakeOffscreen(width, h);
  if (!surface) return null;
  draw(surface.getCanvas(), list, p, -1, width / VIEW_WIDTH, null);
  surface.flush();
  const img = surface.makeImageSnapshot();
  return `data:image/png;base64,${img.encodeToBase64(ImageFormat.PNG, 100)}`;
}
