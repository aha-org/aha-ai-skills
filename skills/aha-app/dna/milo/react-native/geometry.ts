// Milo's body, band and arm, ported 1:1 from the approved SwiftUI version
// (aha-prototype/AhaPrototype/Milo/MiloShape.swift and MiloArm.swift).
//
// Units: Milo's base is 100 wide. y points UP from the ground (0 = where he sits).
// The outline is ten cubic curves whose handles line up at every joint, so it is smooth
// everywhere by construction. The darker band is the body's own outline pushed inward.
//
// Functions marked 'worklet' run every frame on the UI thread; the rest run once at start-up.

import { AHA_BODY, AHA_EYES, AHA_H, AHA_PLANE, AHA_SHADOW } from './ahaBody';

export type Pt = { x: number; y: number };
export type Cubic = [Pt, Pt, Pt, Pt];

export type MiloSide = {
  /** Half-width at the bottom (widest point). */
  base: number;
  /** Half-width where the dome starts. */
  shoulder: number;
  shoulderY: number;
  /** Extra outward curve at mid height (negative pinches in). */
  bulge: number;
  /** Bottom corner radius (vertical). */
  corner: number;
  /** Bottom corner radius (horizontal). */
  cornerX?: number;
};

/** Profile knots: position is "segment + t" round the ten outline curves, value in units. */
export type Knot = { at: number; value: number };

export type MiloBand = {
  /** How far in from the body's edge the face starts. Below zero means no band. */
  width: Knot[];
  /** How much the face's edge is rounded off. */
  round: Knot[];
  /** Force the band edge to curve one way only (off for the puddle, whose side curves inward). */
  oneWay: boolean;
};

export type MiloBodyShape = {
  W: number;
  left: MiloSide;
  right: MiloSide;
  humpL: Pt;
  humpR: Pt;
  /** The soft dip of the M. */
  dip: Pt;
  /** Bottom edge sags this much below the corners (weight). */
  belly: number;
  band: MiloBand;
};

/** `aha` is the Milo the animator and illustrator draw (the default); the rest are the earlier studies. */
export type MiloBody = 'aha' | 'clean' | 'tall' | 'flat';

const NONE = -1.5;

// MARK: - Small vector helpers

export function add(a: Pt, b: Pt, k = 1): Pt {
  'worklet';
  return { x: a.x + b.x * k, y: a.y + b.y * k };
}

export function unit(v: Pt): Pt {
  'worklet';
  const l = Math.hypot(v.x, v.y);
  const d = l === 0 ? 1 : l;
  return { x: v.x / d, y: v.y / d };
}

export function cubicPoint(c: Cubic, t: number): Pt {
  'worklet';
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const cc = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * c[0].x + b * c[1].x + cc * c[2].x + d * c[3].x,
    y: a * c[0].y + b * c[1].y + cc * c[2].y + d * c[3].y,
  };
}

export function cubicDerivative(c: Cubic, t: number): Pt {
  'worklet';
  const u = 1 - t;
  const a = 3 * u * u;
  const b = 6 * u * t;
  const d = 3 * t * t;
  return {
    x: a * (c[1].x - c[0].x) + b * (c[2].x - c[1].x) + d * (c[3].x - c[2].x),
    y: a * (c[1].y - c[0].y) + b * (c[2].y - c[1].y) + d * (c[3].y - c[2].y),
  };
}

export function height(s: MiloBodyShape): number {
  'worklet';
  return Math.max(s.humpL.y, s.humpR.y);
}

// MARK: - Outline

/** Circle-like handle length for a quarter turn. */
const K = 0.55;

function arcK(a: Pt, b: Pt): number {
  const turn = Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y)));
  return (4 / 3) * Math.tan(turn / 4);
}

function side(S: MiloSide, sign: 1 | -1) {
  const rx = S.cornerX ?? S.corner;
  const c0 = { x: sign * (S.base - rx), y: 0 };
  const c1 = { x: sign * S.base, y: S.corner };
  const sh = { x: sign * S.shoulder, y: S.shoulderY };
  const up = unit({ x: sh.x - c1.x, y: sh.y - c1.y });
  // Outward normal of the side (points away from the body).
  const normal = unit({ x: sign === 1 ? up.y : -up.y, y: sign === 1 ? -up.x : up.x });
  const len = Math.hypot(sh.x - c1.x, sh.y - c1.y);
  const h1 = add(add(c1, up, len / 3), normal, S.bulge);
  const h2 = add(add(sh, up, -len / 3), normal, S.bulge);
  const startDir = unit({ x: h1.x - c1.x, y: h1.y - c1.y });
  const endDir = unit({ x: sh.x - h2.x, y: sh.y - h2.y });
  return { rx, c0, c1, sh, h1, h2, startDir, endDir };
}

/**
 * The ten curves of the outline, anticlockwise from the bottom centre:
 * bottom right, right corner, right side, right dome, M right, M left,
 * left dome, left side, left corner, bottom left.
 */
export function segments(s: MiloBodyShape): Cubic[] {
  const R = side(s.right, 1);
  const L = side(s.left, -1);
  const tilt = unit({ x: R.c0.x - L.c0.x, y: R.c0.y - L.c0.y });
  const b0 = { x: 0, y: L.c0.y + (R.c0.y - L.c0.y) * (-L.c0.x / (R.c0.x - L.c0.x)) - s.belly };
  const bottom = (from: Pt, to: Pt, fromIsCentre: boolean): Cubic => {
    const w = (to.x - from.x) / 3;
    const flat = { x: 1, y: 0 };
    const fromDir = fromIsCentre ? tilt : flat;
    const toDir = fromIsCentre ? flat : tilt;
    return [from, add(from, fromDir, w / fromDir.x), add(to, toDir, -w / toDir.x), to];
  };
  const domeR = s.humpR.y - s.right.shoulderY;
  const domeL = s.humpL.y - s.left.shoulderY;
  const waveR = s.humpR.x - s.dip.x;
  const waveL = s.dip.x - s.humpL.x;
  const kR = arcK({ x: 1, y: 0 }, R.startDir);
  const kL = arcK({ x: -1, y: 0 }, L.startDir);

  return [
    bottom(b0, R.c0, true),
    [R.c0, { x: R.c0.x + kR * R.rx, y: R.c0.y }, add(R.c1, R.startDir, -kR * s.right.corner), R.c1],
    [R.c1, R.h1, R.h2, R.sh],
    [R.sh, add(R.sh, R.endDir, (K * domeR) / Math.max(0.3, R.endDir.y)),
      { x: s.humpR.x + K * (s.right.shoulder - s.humpR.x), y: s.humpR.y }, s.humpR],
    [s.humpR, { x: s.humpR.x - 0.42 * waveR, y: s.humpR.y }, { x: s.dip.x + 0.42 * waveR, y: s.dip.y }, s.dip],
    [s.dip, { x: s.dip.x - 0.42 * waveL, y: s.dip.y }, { x: s.humpL.x + 0.42 * waveL, y: s.humpL.y }, s.humpL],
    [s.humpL, { x: s.humpL.x - K * (s.left.shoulder + s.humpL.x), y: s.humpL.y },
      add(L.sh, L.endDir, (K * domeL) / Math.max(0.3, L.endDir.y)), L.sh],
    [L.sh, L.h2, L.h1, L.c1],
    [L.c1, add(L.c1, L.startDir, -kL * s.left.corner), { x: L.c0.x - kL * L.rx, y: L.c0.y }, L.c0],
    bottom(L.c0, b0, false),
  ];
}

// MARK: - Band (face edge), computed once per body

/** How much the width and rounding profiles are blurred, in units of length. */
const PROFILE_BLUR = 5;
/** Sample spacing for the face edge, in units. */
const STEP = 0.5;
/** A last, light averaging of the face edge, in units. */
const FINAL_SMOOTHING = 2;

function blurredProfile(knotsIn: [number, number][], total: number, n: number, sigma: number): number[] {
  const k = [...knotsIn].sort((a, b) => a[0] - b[0]);
  const step = total / n;
  const linear: number[] = [];
  for (let i = 0; i < n; i++) {
    const s = i * step;
    let j = k.length - 1;
    for (let idx = 0; idx < k.length; idx++) if (k[idx][0] <= s) j = idx;
    const a = k[j];
    const b = k[(j + 1) % k.length];
    let span = b[0] - a[0];
    let off = s - a[0];
    if (span <= 0) span += total;
    if (off < 0) off += total;
    linear.push(a[1] + (b[1] - a[1]) * Math.min(1, Math.max(0, off / span)));
  }
  const sg = sigma / step;
  const r = Math.ceil(sg * 3);
  const w: number[] = [];
  for (let x = -r; x <= r; x++) w.push(Math.exp(-(x * x) / (2 * sg * sg)));
  const sum = w.reduce((a, b) => a + b, 0);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (let kk = -r; kk <= r; kk++) v += linear[(((i + kk) % n) + n) % n] * w[kk + r];
    out.push(v / sum);
  }
  return out;
}

function smoothed(p: Pt[], sigma: number): Pt[] {
  const n = p.length;
  const r = Math.ceil(sigma * 3);
  const w: number[] = [];
  for (let x = -r; x <= r; x++) w.push(Math.exp(-(x * x) / (2 * sigma * sigma)));
  const sum = w.reduce((a, b) => a + b, 0);
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    let x = 0;
    let y = 0;
    for (let k = -r; k <= r; k++) {
      const q = p[(((i + k) % n) + n) % n];
      x += q.x * w[k + r];
      y += q.y * w[k + r];
    }
    out.push({ x: x / sum, y: y / sum });
  }
  return out;
}

/** Where the band shows, its edge only ever curves one way: dents are bridged, then resampled. */
function convexBand(pts: Pt[], width: number[]): Pt[] {
  const n = pts.length;
  let peak = 0;
  for (let i = 1; i < n; i++) if (width[i] > width[peak]) peak = i;
  let lo = peak;
  let hi = peak;
  while (width[(((lo - 1) % n) + n) % n] > -0.5 && hi - lo < n - 2) lo -= 1;
  while (width[(hi + 1) % n] > -0.5 && hi - lo < n - 2) hi += 1;
  const run: Pt[] = [];
  for (let i = lo; i <= hi; i++) run.push(pts[((i % n) + n) % n]);
  const hull: Pt[] = [];
  for (const p of run) {
    while (hull.length >= 2) {
      const a = hull[hull.length - 2];
      const b = hull[hull.length - 1];
      const cross = (b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x);
      if (cross < 0) hull.pop();
      else break;
    }
    hull.push(p);
  }
  const lens = [0];
  for (let i = 1; i < hull.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(hull[i].x - hull[i - 1].x, hull[i].y - hull[i - 1].y));
  }
  const total = lens[lens.length - 1] ?? 0;
  const out = [...pts];
  let j = 0;
  for (let k = 0; k < run.length; k++) {
    const target = (total * k) / Math.max(1, run.length - 1);
    while (j + 1 < hull.length - 1 && lens[j + 1] < target) j += 1;
    const span = Math.max(1e-6, lens[j + 1] - lens[j]);
    const t = Math.min(1, Math.max(0, (target - lens[j]) / span));
    const a = hull[j];
    const b = hull[j + 1];
    out[(((lo + k) % n) + n) % n] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  return out;
}

/** The face edge: outline, rounded off where `band.round` says, pushed inward by `band.width`. */
export function computeFace(s: MiloBodyShape): Pt[] {
  const segs = segments(s);
  const fine: Pt[] = [];
  const fineS: number[] = [];
  let acc = 0;
  for (const c of segs) {
    let prev = c[0];
    for (let i = 0; i < 240; i++) {
      const p = cubicPoint(c, i / 240);
      acc += Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
      fine.push(p);
      fineS.push(acc);
    }
    acc += Math.hypot(c[3].x - prev.x, c[3].y - prev.y);
  }
  const total = acc;
  const arc = (at: number) => {
    const seg = Math.min(segs.length - 1, Math.floor(at));
    const idx = seg * 240 + Math.min(239, Math.floor((at - seg) * 240));
    return fineS[idx];
  };
  const widthKnots = s.band.width.map((k) => [arc(k.at), k.value] as [number, number]);
  const roundKnots = s.band.round.map((k) => [arc(k.at), k.value] as [number, number]);

  const count = Math.floor(total / STEP);
  const body: Pt[] = [];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const target = (k * total) / count;
    while (j + 1 < fine.length && fineS[j + 1] < target) j += 1;
    body.push(fine[j]);
  }
  const n = body.length;
  const at = (arr: Pt[], i: number) => arr[((i % n) + n) % n];
  const width = blurredProfile(widthKnots, total, n, PROFILE_BLUR);
  const round = blurredProfile(roundKnots, total, n, PROFILE_BLUR);

  const rounded: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const sigma = Math.max(0.5, round[i]) / STEP;
    const r = Math.ceil(sigma * 3);
    let x = 0;
    let y = 0;
    let sum = 0;
    for (let k = -r; k <= r; k++) {
      const w = Math.exp(-(k * k) / (2 * sigma * sigma));
      const q = at(body, i + k);
      x += q.x * w;
      y += q.y * w;
      sum += w;
    }
    rounded.push({ x: x / sum, y: y / sum });
  }
  const pushed: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = at(rounded, i - 2);
    const b = at(rounded, i + 2);
    const tan = unit({ x: b.x - a.x, y: b.y - a.y });
    pushed.push(add(rounded[i], { x: -tan.y, y: tan.x }, width[i]));
  }
  return smoothed(s.band.oneWay ? convexBand(pushed, width) : pushed, FINAL_SMOOTHING / STEP);
}

// MARK: - Presets (measured from the reference pixels; base width 100)

/** One band for every body, so Milo reads the same whatever shape he is in (ref 08's profile). */
function standardBand(k = 1, shortSide = false): MiloBand {
  const lower: Knot[] = shortSide
    ? [{ at: 0.5, value: 4.6 }, { at: 0.85, value: 3.6 }, { at: 1.5, value: 2.6 }, { at: 2.0, value: 3.4 }]
    : [{ at: 0.5, value: 5.4 }, { at: 0.85, value: 7.0 }, { at: 1.5, value: 8.0 }, { at: 2.0, value: 8.0 }];
  const upper: Knot[] = shortSide
    ? [{ at: 2.25, value: 4.6 }, { at: 2.5, value: 5.4 }, { at: 2.75, value: 5.8 }, { at: 3.0, value: 5.6 },
      { at: 3.4, value: 4.2 }, { at: 3.7, value: 2.2 }, { at: 3.95, value: 0.4 }]
    : [{ at: 2.25, value: 7.3 }, { at: 2.5, value: 6.4 }, { at: 2.75, value: 5.6 }, { at: 3.0, value: 4.8 },
      { at: 3.5, value: 2.8 }, { at: 3.85, value: 0.8 }];
  return {
    width: [
      { at: 8.4, value: NONE }, { at: 9.0, value: 1.2 }, { at: 9.5, value: 2.8 }, { at: 0.0, value: 4.0 },
      ...lower, ...upper, { at: 4.1, value: NONE }, { at: 5.0, value: NONE },
    ],
    round: [
      { at: 9.0, value: 1 }, { at: 9.6, value: 2 * k }, { at: 0.6, value: 10 * k }, { at: 1.5, value: 15 * k },
      { at: 2.3, value: 10 * k }, { at: 2.7, value: 2 * k }, { at: 3.0, value: 1 }, { at: 5.0, value: 1 },
    ],
    oneWay: !shortSide,
  };
}

export const BODIES: Record<'clean' | 'tall' | 'flat', MiloBodyShape> = {
  /** Ref 08. Baseline proportions, even humps, broad soft side plane at the lower right. */
  clean: {
    W: 100,
    left: { base: 50, shoulder: 38.3, shoulderY: 91, bulge: 1.5, corner: 16, cornerX: 24 },
    right: { base: 50, shoulder: 38.8, shoulderY: 91, bulge: 1.5, corner: 16, cornerX: 24 },
    humpL: { x: -22.5, y: 107 }, humpR: { x: 23.5, y: 107 }, dip: { x: 0, y: 94.4 },
    belly: 0.6, band: standardBand(),
  },
  /** Ref 01. Taller, left hump higher, broad right shoulder, thin even side band. */
  tall: {
    W: 100,
    left: { base: 50, shoulder: 41, shoulderY: 99, bulge: 1.2, corner: 17, cornerX: 26 },
    right: { base: 50, shoulder: 38.5, shoulderY: 100, bulge: 1.2, corner: 12, cornerX: 16 },
    humpL: { x: -26, y: 117 }, humpR: { x: 23.5, y: 112.5 }, dip: { x: 0, y: 102.2 },
    belly: 0.8, band: standardBand(),
  },
  /** Ref 02. Flattened and widened, bottom spreading like a puddle. */
  flat: {
    W: 100,
    left: { base: 50, shoulder: 38.5, shoulderY: 36, bulge: -2.5, corner: 14, cornerX: 17 },
    right: { base: 50, shoulder: 35.5, shoulderY: 34, bulge: -2.5, corner: 14, cornerX: 17 },
    humpL: { x: -22, y: 50.8 }, humpR: { x: 20, y: 49.3 }, dip: { x: -2, y: 41.5 },
    belly: 0.5, band: standardBand(0.5, true),
  },
};

type EyePlacement = { x: number; y: number; spacing: number; rx: number; ry: number };

/** Eye centre (x offset from the middle, height from the ground), spacing and open-oval size, per body. */
export const EYE_PLACEMENT: Record<MiloBody, EyePlacement> = {
  aha: AHA_EYES,
  clean: { x: -3.5, y: 64, spacing: 30, rx: 3.3, ry: 5.1 },
  tall: { x: -5, y: 60.5, spacing: 36.5, rx: 3.3, ry: 5.1 },
  flat: { x: -2.5, y: 26, spacing: 34, rx: 3.3, ry: 5.1 },
};

export const BODY_LABELS: Record<MiloBody, string> = { aha: 'Default', clean: 'Ref 08', tall: 'Tall', flat: 'Melted' };

/** Everything a frame needs about a body, computed once (plain data, safe to send to the UI thread). */
export type BodyData = {
  /** Base width in units. */
  W: number;
  /** The outline. */
  segs: Cubic[];
  /** Earlier studies: the lighter face inside a darker band (drawn over the side colour). */
  face: Pt[] | null;
  /** The Aha body: the darker side plane (drawn over the body colour, clipped to it). */
  plane: Cubic[] | null;
  H: number;
  eyes: EyePlacement;
  /** The two outline curves the waving arm grows out of (upper right, then the side below it). */
  arm: [Cubic, Cubic];
  /** Contact shadow: half width, half height, and how far its centre sits below the ground. */
  shadow: { rx: number; ry: number; below: number };
  /** The first-version body can morph into the Aha body (on the flight up into the chat). */
  morph?: BodyMorph;
};

/**
 * Matching point lists for a morph: both outlines (and the first version's face) sampled with the
 * same number of points from the same landmarks (bottom middle, left hump, dip, right hump), so
 * every point travels to its twin and the shape reshapes instead of cross-fading.
 */
export type BodyMorph = { out: Pt[]; face: Pt[]; to: Pt[]; plane: Cubic[]; H: number; eyes: EyePlacement };

const STUDY_SHADOW = { rx: 53.5, ry: 6.5, below: -4 };
function study(b: 'clean' | 'tall' | 'flat'): BodyData {
  const segs = segments(BODIES[b]);
  return { W: BODIES[b].W, segs, face: computeFace(BODIES[b]), plane: null, H: height(BODIES[b]), eyes: EYE_PLACEMENT[b], arm: [segs[6], segs[7]], shadow: STUDY_SHADOW };
}

const MORPH_PIECES = [48, 24, 24, 48];

function dense(segs: Cubic[]): Pt[] {
  const out: Pt[] = [];
  for (const c of segs) for (let i = 0; i < 160; i++) out.push(cubicPoint(c, i / 160));
  return out;
}

/** Resamples a closed outline: clockwise (y up), starting at the bottom middle, landmarks aligned. */
function landmarked(pts: Pt[]): Pt[] {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  const p = area > 0 ? pts.slice().reverse() : pts.slice();
  const n = p.length;
  const argBest = (ok: (q: Pt) => boolean, score: (q: Pt) => number) => {
    let best = -1;
    for (let i = 0; i < n; i++) if (ok(p[i]) && (best < 0 || score(p[i]) > score(p[best]))) best = i;
    return best;
  };
  const top = Math.max(...p.map((q) => q.y));
  const b0 = argBest((q) => Math.abs(q.x) < 12, (q) => -q.y - Math.abs(q.x) * 0.01);
  const ring = (i: number) => (i - b0 + n) % n;
  const ordered = Array.from({ length: n }, (_, i) => p[(b0 + i) % n]);
  const iL = ring(argBest((q) => q.x < 0, (q) => q.y));
  const iR = ring(argBest((q) => q.x > 0, (q) => q.y));
  const iD = ring(argBest((q) => Math.abs(q.x) < 10 && q.y > top * 0.6, (q) => -q.y));
  const marks = [0, iL, iD, iR, n];
  const out: Pt[] = [];
  for (let k = 0; k < 4; k++) {
    const seg = ordered.slice(marks[k], marks[k + 1]).concat([ordered[marks[k + 1] % n]]);
    const len: number[] = [0];
    for (let i = 1; i < seg.length; i++) len.push(len[i - 1] + Math.hypot(seg[i].x - seg[i - 1].x, seg[i].y - seg[i - 1].y));
    const total = len[len.length - 1];
    let j = 0;
    for (let i = 0; i < MORPH_PIECES[k]; i++) {
      const target = (total * i) / MORPH_PIECES[k];
      while (j < len.length - 2 && len[j + 1] < target) j++;
      const f = (target - len[j]) / Math.max(1e-6, len[j + 1] - len[j]);
      out.push({ x: seg[j].x + (seg[j + 1].x - seg[j].x) * f, y: seg[j].y + (seg[j + 1].y - seg[j].y) * f });
    }
  }
  return out;
}

const AHA_DATA: BodyData = { W: 100, segs: AHA_BODY, face: null, plane: AHA_PLANE, H: AHA_H, eyes: AHA_EYES, arm: [AHA_BODY[15], AHA_BODY[17]], shadow: AHA_SHADOW };
const CLEAN_DATA = study('clean');
CLEAN_DATA.morph = {
  out: landmarked(dense(CLEAN_DATA.segs)),
  face: landmarked(CLEAN_DATA.face ?? []),
  to: landmarked(dense(AHA_BODY)),
  plane: AHA_PLANE, H: AHA_H, eyes: AHA_EYES,
};

export const BODY_DATA: Record<MiloBody, BodyData> = {
  aha: AHA_DATA,
  clean: CLEAN_DATA,
  tall: study('tall'),
  flat: study('flat'),
};

// MARK: - Hand tip and arm (every frame)

/**
 * Milo's fingerless hand tip: a V with slightly bowed sides and a softly rounded point.
 * Points go from the outer edge (centre + across * w) round the tip to the inner edge.
 */
export function handTipPoints(centre: Pt, d: Pt, r: Pt, w: number, count: number, length = 1.3, roundness = 0.5): Pt[] {
  'worklet';
  const h = w * length;
  const e = 0.3;
  const softAbs = (x: number) => (Math.sqrt(x * x + e * e) - e) / (Math.sqrt(1 + e * e) - e);
  const out: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * i) / count;
    const sideW = w * Math.cos(a);
    const reach = h * ((1 - roundness) * (1 - softAbs(Math.cos(a))) + roundness * Math.sin(a));
    out.push({ x: centre.x + r.x * sideW + d.x * reach, y: centre.y + r.y * sideW + d.y * reach });
  }
  return out;
}

export type ArmPose = {
  /** Direction the arm points, in degrees (0 = right, 90 = up). */
  angle: number;
  /** 0 = inside the body, 1 = fully out. */
  extension: number;
  /** 0...1: motion marks beside the hand. */
  marks: number;
};

export const ARM_LENGTH = 30;
export const HAND_RADIUS = 11;

/** The waving arm outline in units (y up), plus the hand centre, direction and radius for the marks. */
export function armOutline(topSeg: Cubic, sideSeg: Cubic, arm: ArmPose): { points: Pt[]; hand: Pt; dir: Pt; radius: number } {
  'worklet';
  const B = cubicPoint(topSeg, 0.55);
  const tanB = unit(cubicDerivative(topSeg, 0.55));
  const A = cubicPoint(sideSeg, 0.55);
  const tanA = unit(cubicDerivative(sideSeg, 0.55));

  const g = Math.max(0, Math.min(1.15, arm.extension));
  const root = { x: (A.x + B.x) / 2 + 10, y: (A.y + B.y) / 2 };
  const rad = (arm.angle * Math.PI) / 180;
  const d = { x: Math.cos(rad), y: Math.sin(rad) };
  const right = { x: d.y, y: -d.x };
  const w = HAND_RADIUS * (0.7 + 0.3 * Math.min(1, g));
  const hand = add(root, d, ARM_LENGTH * g);
  const U = add(hand, right, w);
  const D = add(hand, right, -w);
  const reach = ARM_LENGTH * g;

  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) pts.push(cubicPoint(topSeg, 0.25 + (0.3 * i) / 10));
  const cubic = (p0: Pt, c1: Pt, c2: Pt, p3: Pt, n: number) => {
    for (let i = 0; i < n; i++) pts.push(cubicPoint([p0, c1, c2, p3], i / n));
  };
  // Top edge: leave the dome in its own direction, then sweep out along the arm.
  cubic(B, add(B, tanB, Math.max(4, reach * 0.42)), add(U, d, -reach * 0.55), U, 20);
  // The waving hand starts as a sharp V; the smoothing below softens its point (Manan's pick).
  const tip = handTipPoints(hand, d, right, w, 14, 1.7, 0.15);
  for (let i = 0; i < tip.length; i++) pts.push(tip[i]);
  // Bottom edge: back along the arm, then into the side in the side's own direction.
  cubic(D, add(D, d, -reach * 0.55), add(A, tanA, -Math.max(4, reach * 0.5)), A, 20);
  for (let i = 0; i <= 10; i++) pts.push(cubicPoint(sideSeg, 0.55 + (0.3 * i) / 10));

  // Round the joins (and soften the hand's point): a light moving average along the open line.
  let smooth = pts;
  const r = 3;
  for (let pass = 0; pass < 3; pass++) {
    const next = smooth.slice();
    for (let i = r; i < smooth.length - r; i++) {
      let x = 0;
      let y = 0;
      for (let k = -r; k <= r; k++) {
        x += smooth[i + k].x;
        y += smooth[i + k].y;
      }
      next[i] = { x: x / (2 * r + 1), y: y / (2 * r + 1) };
    }
    smooth = next;
  }
  // Close through the inside of the body (hidden: same colour).
  smooth.push(root);
  return { points: smooth, hand, dir: d, radius: w };
}
