/**
 * Milo's body outline.
 *
 * Units: Milo's base is 100 wide. y points UP from the ground (0 = where he sits).
 * The outline is built from a few readable parts, each measured from the
 * reference images: rounded bottom corners, two sides, two round domes, and the
 * soft wave of the M between them. It is sampled into many points and joined by a
 * smooth curve, so every deformation is just "move the points".
 */

export type Pt = { x: number; y: number };

export type Side = {
  /** Half-width at the bottom (widest point). */
  base: number;
  /** Half-width where the dome starts. */
  shoulder: number;
  shoulderY: number;
  /** Extra outward curve at mid height (negative pinches in). */
  bulge: number;
  /** Bottom corner radius (vertical). */
  corner: number;
  /** Bottom corner radius (horizontal). Milo's corners are usually wider than tall. */
  cornerX?: number;
  /** Height the bottom corner starts at (0 = on the ground). Used for the face. */
  floor?: number;
};

export type BodyShape = {
  W: number;
  left: Side;
  right: Side;
  /** Top of each hump. */
  humpL: Pt;
  humpR: Pt;
  /** The soft dip of the M. */
  dip: Pt;
  /** Dome roundness: 2 = elliptical, higher = boxier. */
  dome: number;
  /** Bottom edge sags this much below the corners (weight). */
  belly: number;
  /**
   * Darker thickness band. The face is the same smooth shape, pulled in on the right
   * (side at the base, top at the shoulder), its right corner lifted off the ground
   * (lift) and rounder (corner), and its bottom centre raised (center).
   */
  band: { side: number; top: number; lift: number; corner: number; center: number };
};

export const bodyHeight = (s: BodyShape) => Math.max(s.humpL.y, s.humpR.y);

type Cubic = [Pt, Pt, Pt, Pt];

const add = (a: Pt, b: Pt, k = 1): Pt => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const unit = (v: Pt): Pt => {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
};
const sampleCubic = ([a, b, c, d]: Cubic, n: number): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    };
  });

/** Circle-like handle length for a quarter turn. */
const K = 0.55;
/** Handle length factor for an even arc turning between two directions. */
const arcK = (a: Pt, b: Pt) => {
  const turn = Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y)));
  return (4 / 3) * Math.tan(turn / 4);
};

/**
 * Ring of outline points, starting at the bottom centre and going up the right side.
 * Built like a hand-drawn vector shape: cubic curves whose handles line up at every
 * joint, so the outline is smooth everywhere by construction (no corners, ever).
 */
export const outlinePoints = (s: BodyShape): Pt[] => {
  const segs: [Cubic, number][] = [];
  const side = (S: Side, sign: 1 | -1) => {
    const rx = S.cornerX ?? S.corner;
    const c0 = { x: sign * (S.base - rx), y: S.floor ?? 0 };
    const c1 = { x: sign * S.base, y: (S.floor ?? 0) + S.corner };
    const sh = { x: sign * S.shoulder, y: S.shoulderY };
    const up = unit({ x: sh.x - c1.x, y: sh.y - c1.y });
    // Outward normal of the side (points away from the body).
    const normal = unit({ x: sign === 1 ? up.y : -up.y, y: sign === 1 ? -up.x : up.x });
    const len = Math.hypot(sh.x - c1.x, sh.y - c1.y);
    // Side handles (the bulge bends them), and the true tangents at each end,
    // which the corner and dome then reuse so every joint lines up.
    const h1 = add(add(c1, up, len / 3), normal, S.bulge);
    const h2 = add(add(sh, up, -len / 3), normal, S.bulge);
    const startDir = unit({ x: h1.x - c1.x, y: h1.y - c1.y });
    const endDir = unit({ x: sh.x - h2.x, y: sh.y - h2.y });
    return { rx, c0, c1, sh, h1, h2, startDir, endDir };
  };
  const R = side(s.right, 1);
  const L = side(s.left, -1);
  // Bottom edge: one gentle arc from corner to corner. At the centre it follows the
  // line between the two corners (so a tilted bottom stays a single smooth curve).
  const tilt = unit({ x: R.c0.x - L.c0.x, y: R.c0.y - L.c0.y });
  const b0 = { x: 0, y: L.c0.y + (R.c0.y - L.c0.y) * (-L.c0.x / (R.c0.x - L.c0.x)) - s.belly };
  const bottom = (from: Pt, to: Pt): Cubic => {
    const w = (to.x - from.x) / 3;
    const fromDir = from === b0 ? tilt : { x: 1, y: 0 };
    const toDir = to === b0 ? tilt : { x: 1, y: 0 };
    return [from, add(from, fromDir, w / fromDir.x), add(to, toDir, -w / toDir.x), to];
  };
  const domeR = s.humpR.y - s.right.shoulderY;
  const domeL = s.humpL.y - s.left.shoulderY;
  const waveR = s.humpR.x - s.dip.x;
  const waveL = s.dip.x - s.humpL.x;

  // Right half, bottom centre -> right hump.
  segs.push([bottom(b0, R.c0), 3]);
  const kR = arcK({ x: 1, y: 0 }, R.startDir);
  segs.push([[R.c0, { x: R.c0.x + kR * R.rx, y: R.c0.y }, add(R.c1, R.startDir, -kR * s.right.corner), R.c1], 5]);
  segs.push([[R.c1, R.h1, R.h2, R.sh], 7]);
  segs.push([[R.sh, add(R.sh, R.endDir, (K * domeR) / Math.max(0.3, R.endDir.y)), { x: s.humpR.x + K * (s.right.shoulder - s.humpR.x), y: s.humpR.y }, s.humpR], 6]);
  // The M: hump -> dip -> hump, flat tangents at each top and at the dip.
  segs.push([[s.humpR, { x: s.humpR.x - 0.42 * waveR, y: s.humpR.y }, { x: s.dip.x + 0.42 * waveR, y: s.dip.y }, s.dip], 5]);
  segs.push([[s.dip, { x: s.dip.x - 0.42 * waveL, y: s.dip.y }, { x: s.humpL.x + 0.42 * waveL, y: s.humpL.y }, s.humpL], 5]);
  // Left half, left hump -> bottom centre.
  segs.push([[s.humpL, { x: s.humpL.x - K * (s.left.shoulder + s.humpL.x), y: s.humpL.y }, add(L.sh, L.endDir, (K * domeL) / Math.max(0.3, L.endDir.y)), L.sh], 6]);
  segs.push([[L.sh, L.h2, L.h1, L.c1], 7]);
  const kL = arcK({ x: -1, y: 0 }, L.startDir);
  segs.push([[L.c1, add(L.c1, L.startDir, -kL * s.left.corner), { x: L.c0.x - kL * L.rx, y: L.c0.y }, L.c0], 5]);
  segs.push([bottom(L.c0, b0), 3]);

  return segs.flatMap(([c, n]) => sampleCubic(c, n));
};

/** The face's own smooth shape (see BodyShape.band). Drawn clipped to the silhouette. */
export const faceShape = (s: BodyShape): BodyShape => {
  const b = s.band;
  const R = s.right;
  return {
    ...s,
    right: {
      ...R,
      base: R.base - b.side,
      shoulder: R.shoulder - b.top,
      corner: Math.max(R.corner, b.corner),
      cornerX: Math.max(R.cornerX ?? R.corner, b.corner) ,
      floor: b.lift,
    },
    belly: s.belly - b.center,
  };
};

/** Front-face points: same generator as the body, so the band edge is just as smooth. */
export const facePoints = (s: BodyShape): Pt[] => outlinePoints(faceShape(s));

/** Simple whole-body deformations, applied to points (and eyes) before drawing. */
export type Deform = {
  /** Vertical scale from the ground. <1 squashes, >1 stretches. Width compensates. */
  squash?: number;
  /** Shear: positive leans the top to the right, in units at the top of the body. */
  lean?: number;
};

export const deformPoint = (p: Pt, d: Deform, H: number): Pt => {
  const sy = d.squash ?? 1;
  const sx = 1 / Math.sqrt(sy);
  const lean = d.lean ?? 0;
  return { x: p.x * sx + lean * (p.y / H), y: p.y * sy };
};

/** Closed smooth path through points (centripetal Catmull-Rom as cubic Beziers). SVG y = -y. */
export const smoothClosedPath = (pts: Pt[]) => {
  const n = pts.length;
  const P = (i: number) => pts[(i + n) % n];
  const dist = (a: Pt, b: Pt) => Math.max(1e-4, Math.pow(Math.hypot(a.x - b.x, a.y - b.y), 0.5));
  const f = (v: number) => v.toFixed(2);
  let d = `M ${f(P(0).x)} ${f(-P(0).y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    const d1 = dist(p0, p1);
    const d2 = dist(p1, p2);
    const d3 = dist(p2, p3);
    const c1x = (d1 * d1 * p2.x - d2 * d2 * p0.x + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1.x) / (3 * d1 * (d1 + d2));
    const c1y = (d1 * d1 * p2.y - d2 * d2 * p0.y + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1.y) / (3 * d1 * (d1 + d2));
    const c2x = (d3 * d3 * p1.x - d2 * d2 * p3.x + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2.x) / (3 * d3 * (d3 + d2));
    const c2y = (d3 * d3 * p1.y - d2 * d2 * p3.y + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2.y) / (3 * d3 * (d3 + d2));
    d += ` C ${f(c1x)} ${f(-c1y)} ${f(c2x)} ${f(-c2y)} ${f(p2.x)} ${f(-p2.y)}`;
  }
  return d + " Z";
};
