// Grain shapes (Manan, 2026-10-29). The spec is dna/grain/GRAIN-GUIDE.md and the
// approved study is grain-study.html next to it.
//   - Two tones of one colour, blended ONLY by grain (no smooth gradient, no grey noise), lit from
//     the top left and deepening toward the bottom right.
//   - Lines inside every shape, in its own deep tone, drawn by hand (a steady hand, never perfect).
//   - Motion is stepped at 10 fps, like hand animation (Manan: 8 to 12 fps only), and the grain
//     re-draws on each step ("boils"). Eases only, never a spring.
//   - The sun turns on its own axis while the light stays where it is: the shader is in the
//     canvas's own coordinates, and only the outline is turned.
// Never on anything you tap or read: buttons, chips, cards, the nav, text backgrounds, photos.

import React, { useEffect, useMemo, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Blur, Canvas, Group, Path, Rect, Shader, Skia, vec } from '@shopify/react-native-skia';
import { useReducedMotion } from 'react-native-reanimated';

const EFFECT = Skia.RuntimeEffect.Make(`
uniform float2 box;     // the shape's size
uniform float2 origin;  // its top left in the canvas
uniform float3 light;
uniform float3 deep;
uniform float from;     // where the deep tone starts creeping in (0 top left ... 1 bottom right)
uniform float seed;     // a new grain per boil
uniform float boost;    // > 0 for the lines: pushed toward the deep tone
uniform float cell;     // grain size

float hash(float2 p) { return fract(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453); }

half4 main(float2 xy) {
  float2 uv = (xy - origin) / box;
  float t = uv.x * 0.45 + uv.y * 0.55;
  float s = smoothstep(from, 1.0, t);
  float r = hash(floor(xy / cell) + seed * 31.7);
  float v = clamp(s + (r - 0.5) * (0.08 + 2.6 * s * (1.0 - s)), 0.0, 1.0);
  v = min(1.0, v + boost * (0.5 + 0.5 * r));
  return half4(half3(mix(light, deep, v)), 1.0);
}`)!;

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

/** Two tones per family, from the Aha palette (light, deep). */
export const TONES = {
  /** Soft, for big surfaces that text sits on. */
  meadow: ['#F1F5E2', '#C5D69A'],
  sun: ['#F1C93F', '#DE561C'],
  blush: ['#F4668E', '#A51D55'],
  sky: ['#7BA6DE', '#3B55C9'],
  leaf: ['#AEC123', '#4F7A2C'],
} as const;
export type Tones = keyof typeof TONES;

/** 10 fps. */
const STEP_MS = 100;
const BOILS = 3;
/** One turn every 24 s. */
const TURN_MS = 24000;
/** Coming into focus. */
const ENTER_MS = 1300;

const out3 = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return 1 - (1 - c) * (1 - c) * (1 - c);
};

/** The 9-scallop sun, turned by `a` around its centre. */
function sunBody(cx: number, cy: number, R: number, a: number) {
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < 180; i++) {
    const g = (i / 180) * 2 * Math.PI, r = R * (1 + 0.07 * Math.cos(9 * (g - a)));
    if (i === 0) b.moveTo(cx + r * Math.cos(g), cy + r * Math.sin(g)); else b.lineTo(cx + r * Math.cos(g), cy + r * Math.sin(g));
  }
  b.close();
  return b.build();
}

// The lines are drawn by hand (Manan, 2026-10-29: "a little not perfect, a little scribbly"): a
// steady hand, not a shaky one, like src/ui/hand.tsx. Each line wanders slowly off its path,
// presses harder in the middle and lifts at the ends, runs a touch past where it should stop, and
// one line is gone over twice. Each is a filled ribbon, so its width can change along it.

const wob = (t: number, seed: number) => {
  return Math.sin(t * 2.1 + seed) * 0.6 + Math.sin(t * 5.3 + seed * 1.7) * 0.4;
};

type Pt = [number, number];
type Builder = ReturnType<typeof Skia.PathBuilder.Make>;

/**
 * One pen stroke through pts, w wide, added to the builder as a filled ribbon: it wanders off the
 * path by up to amp, presses in the middle and lifts at the ends. Plain loops over plain arrays.
 */
function ribbon(b: Builder, pts: Pt[], w: number, seed: number, amp: number, waves: number) {
  const n = pts.length - 1;
  const A: Pt[] = [], B: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const p = pts[i], q = pts[Math.min(n, i + 1)], r = pts[Math.max(0, i - 1)];
    let tx = q[0] - r[0], ty = q[1] - r[1];
    const l = Math.sqrt(tx * tx + ty * ty) || 1;
    tx /= l; ty /= l;
    const t = i / n, off = amp * wob(t * waves, seed);
    const hw = w * 0.5 * (0.4 + 0.6 * Math.sqrt(Math.max(0, Math.sin(Math.PI * t)))) * (1 + 0.15 * wob(t * 11, seed + 3));
    const x = p[0] - ty * off, y = p[1] + tx * off;
    A.push([x - ty * hw, y + tx * hw]);
    B.push([x + ty * hw, y - tx * hw]);
  }
  b.moveTo(A[0][0], A[0][1]);
  for (let i = 1; i <= n; i++) b.lineTo(A[i][0], A[i][1]);
  for (let i = n; i >= 0; i--) b.lineTo(B[i][0], B[i][1]);
  b.close();
}

/** A pen stroke along fn(u) (u 0..1), running a touch past both ends. JS thread only. */
function handStroke(b: Builder, fn: (u: number) => Pt, w: number, seed: number, o: { from?: number; to?: number; amp?: number; waves?: number; over?: number } = {}) {
  const from = o.from ?? 0, to = o.to ?? 1, over = o.over ?? 0.035, n = 48;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(fn(from - over + ((to - from + 2 * over) * i) / n));
  ribbon(b, pts, w, seed, o.amp ?? w * 0.9, o.waves ?? 6);
}

/**
 * His wavy arcs: they stay on the shadow side (bottom right) and follow the scallops as he turns.
 * `j` nudges the hand a little on each boil, so the lines redraw like hand animation.
 */
function sunArcs(cx: number, cy: number, R: number, a: number, j: number) {
  const b = Skia.PathBuilder.Make();
  // His scallops already wave, so the hand is gentler here. The third is the second gone over again.
  const ks = [0.62, 0.8, 0.815], froms = [0, 0, 0.15], tos = [1, 1, 0.6], seeds = [1, 4, 9], widths = [1, 1, 0.5];
  const w = Math.max(1.1, R * 0.027), over = 0.035, n = 40;
  for (let line = 0; line < 3; line++) {
    const pts: Pt[] = [];
    const from = froms[line] - over, span = tos[line] - froms[line] + 2 * over;
    for (let i = 0; i <= n; i++) {
      const u = from + (span * i) / n;
      const g = ((-10 + 110 * u) * Math.PI) / 180, r = R * ks[line] * (1 + 0.07 * Math.cos(9 * (g - a)));
      pts.push([cx + r * Math.cos(g), cy + r * Math.sin(g)]);
    }
    ribbon(b, pts, w * widths[line], seeds[line] + j, R * 0.009, 3);
  }
  return b.build();
}

export function GrainSun({ size, tones = 'sun', blur = 0, opacity = 1, delay = 0, phase = 0, lines = true, settle = false, from = 0.22, style }: {
  size: number;
  tones?: Tones;
  /** Out of focus, for the copies further back. */
  blur?: number;
  opacity?: number;
  /** When it starts coming into focus (ms after mounting). */
  delay?: number;
  /** Its own float, so two never move together. */
  phase?: number;
  lines?: boolean;
  /**
   * Comes into focus, then holds completely still (no turning, floating or boiling): for places
   * the eye passes all the time, like the nav bar, where anything moving would pull at you.
   */
  settle?: boolean;
  /** Where the deep tone starts (0 top left ... 1 bottom right): later keeps more of the light tone. */
  from?: number;
  style?: ViewStyle;
}) {
  const still = useReducedMotion();
  const pad = Math.ceil(blur * 3 + size * 0.12);
  const W = size + pad * 2, c = W / 2, R = size * 0.44;
  const [light, deep] = TONES[tones].map(rgb);

  // The stepped clock: it only moves ten times a second, so everything drawn from it does too. It
  // runs on the JS thread and the shapes are rebuilt there (Manan's iPhone crashed the moment this
  // was built on the UI thread inside Reanimated worklets, 2026-10-29). Ten small rebuilds a second
  // is nothing for the JS thread.
  const [step, setStep] = useState(still ? 60000 : 0);
  useEffect(() => {
    if (still) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const t = Math.floor((Date.now() - t0) / STEP_MS) * STEP_MS;
      setStep(t);
      if (settle && t >= delay + ENTER_MS) clearInterval(id);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [still, settle, delay]);
  const live = settle ? 0 : 1;

  const enter = out3((step - delay) / ENTER_MS);
  const angle = live * (step / TURN_MS) * 2 * Math.PI - ((14 * Math.PI) / 180) * (1 - enter);
  const boil = live * ((step / STEP_MS) % BOILS);
  const body = useMemo(() => sunBody(c, c, R, angle), [c, R, angle]);
  const arcs = useMemo(() => (lines ? sunArcs(c, c, R, angle, boil * 0.25) : null), [lines, c, R, angle, boil]);
  const transform = [
    { translateY: live * Math.sin(step / 1400 + phase) * size * 0.018 + size * 0.1 * (1 - enter) },
    { scale: 0.82 + 0.18 * enter },
  ];
  const alpha = Math.min(1, enter * 1.6) * opacity;
  const focus = blur + size * 0.1 * (1 - enter);
  const uniforms = (boost: number) => ({
    box: [size, size], origin: [pad, pad], light, deep, from, boost, cell: Math.min(1.5, Math.max(1, size / 80)), seed: boil,
  });
  const fill = uniforms(0);
  const ink = uniforms(0.75);

  return (
    // Skia's canvas on the web ignores pointerEvents, so the View carries it. The blur sits on each
    // drawing: a Group `layer` with a Blur drew nothing at all on the web.
    <View pointerEvents="none" style={[{ width: W, height: W, margin: -pad }, style]}>
      <Canvas style={{ width: W, height: W }}>
        <Group opacity={alpha} origin={vec(c, c)} transform={transform}>
          <Path path={body}><Shader source={EFFECT} uniforms={fill} /><Blur blur={focus} mode="decal" /></Path>
          {arcs ? (
            <Path path={arcs}>
              <Shader source={EFFECT} uniforms={ink} />
              <Blur blur={focus} mode="decal" />
            </Path>
          ) : null}
        </Group>
      </Canvas>
    </View>
  );
}

/**
 * A surface in the grain language (Manan, 2026-10-29: "we use the gradients and lines in the
 * gradient", not only the shapes): two soft tones blended by grain, lit from the top left, with
 * arcs running through the colour from the bottom-right corner. It holds still: text sits on it,
 * so nothing behind the words moves.
 */
export function GrainBlock({ tones = 'meadow', from = 0.4, style, children }: {
  tones?: Tones;
  from?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [light, deep] = TONES[tones].map(rgb);
  const { w, h } = box;
  const arcs = React.useMemo(() => {
    const b = Skia.PathBuilder.Make();
    const arc = (r: number) => (u: number): Pt => {
      const g = Math.PI + (u * Math.PI) / 2;
      return [w + r * Math.cos(g), h * 1.15 + r * Math.sin(g)];
    };
    const big = Math.max(w, h * 1.6);
    [0.34, 0.58, 0.82].forEach((k, i) => handStroke(b, arc(k * big), 2, 2 + i * 3, { amp: 1.4, waves: 5 }));
    handStroke(b, arc(0.835 * big), 1.1, 13, { amp: 1.4, waves: 5, from: 0.2, to: 0.7 }); // gone over twice
    return b.build();
  }, [w, h]);
  const uniforms = (boost: number) => ({ box: [w || 1, h || 1], origin: [0, 0], light, deep, from, seed: 0, boost, cell: 1.5 });
  return (
    <View style={[{ overflow: 'hidden' }, style]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {w ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }}>
          <Canvas style={{ width: w, height: h }}>
            <Rect x={0} y={0} width={w} height={h}><Shader source={EFFECT} uniforms={uniforms(0)} /></Rect>
            <Path path={arcs}><Shader source={EFFECT} uniforms={uniforms(0.55)} /></Path>
          </Canvas>
        </View>
      ) : null}
      {children}
    </View>
  );
}
