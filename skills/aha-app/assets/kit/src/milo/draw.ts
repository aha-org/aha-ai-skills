// Builds Skia paths for one frame of Milo (runs on the UI thread every frame).
// Ported 1:1 from MiloRenderer.swift.

import { Skia, type SkPath, type SkPathBuilder } from '@shopify/react-native-skia';
import { armOutline, handTipPoints, type BodyData, type Cubic, type Pt } from './geometry';
import type { MiloPose } from './life';

/** Space Milo needs around his ground point, in units (base width = 100). */
export const CANVAS_UNITS = { width: 170, height: 178 };
export const GROUND_UNITS = { x: 85, y: 152 };

export type Frame = {
  silhouette: SkPath;
  /** Drawn over the silhouette, clipped to it: the first version's lighter face (inside its band). */
  face: SkPath;
  /** The Aha body's darker side plane, clipped to the silhouette (fading in mid-morph). */
  plane: SkPath;
  planeOpacity: number;
  /** How far through the morph into the Aha body (0 when not morphing). */
  morph: number;
  arm: SkPath | null;
  marks: SkPath | null;
  marksOpacity: number;
  eyesFill: SkPath;
  eyesStroke: SkPath;
  eyeStrokeWidth: number;
  blush: SkPath | null;
  eyeInk: string;
  shadowRect: { x: number; y: number; width: number; height: number };
  shadowOpacity: number;
  shadowBlur: number;
  bulb: { opacity: number; glass: SkPath; base: SkPath; rays: SkPath };
  rings: { opacity: number; rings: SkPath; dots: SkPath };
  /** The notebook prop (empty paths when it is put away). */
  notebook: {
    opacity: number;
    back: SkPath; spine: SkPath; front: SkPath; label: SkPath;
    pagesL: SkPath; pagesShade: SkPath; pagesR: SkPath;
    cover: SkPath; pageL: SkPath; pageR: SkPath; gutter: SkPath; rules: SkPath; rulesWidth: number;
    ink: SkPath; inkWidth: number;
    lead: SkPath; wood: SkPath; dark: SkPath; mid: SkPath; light: SkPath; eraser: SkPath;
    hand: SkPath;
  };
};

/**
 * Milo's notebook, drawn like the animator's (Rive) one: a blue book with cream pages and a pale
 * label, and a yellow pencil with a cream wooden tip and a pink eraser. Milo units (y up), mapped.
 *
 * Two views: SHUT (the animator's open-at-an-angle book, cover facing out, pages fanned at the top)
 * while it comes in and sits aside, and OPEN for writing: held up open, FACING HIM (Manan: he writes
 * in it and shows it to himself, not to you), so we see the backs of the two covers in a shallow V
 * with the page edges peeking over the top, and the pencil working inside it, only its top end
 * showing above the book. `open` flips between them (the book turns: it narrows, swaps view, widens).
 * `notebook` glides it in and out, `aside` slides it out to his left, and `write` (0...1) moves the
 * pencil along the ruled lines of the right page, its handwriting appearing right under the tip.
 */
const BOOK = {
  front: { x: -24, y: 8, rot: 0, scale: 1 },
  aside: { x: -64, y: -9, rot: -20, scale: 0.86 },
  /** Held up open in front of him for writing, a little higher, so he looks down into it. */
  open: { x: 0, y: 18, rot: 0, scale: 1.04 },
  /** The pencil at rest, relative to the shut book's middle (as in the animator's frames). */
  pencilRest: { x: 30, y: 12 },
  pencilAngle: 41,
  /** The pencil while writing in the held book: upright-ish, leaning out to his left (our right). */
  writeAngle: 62,
};

/**
 * The handwriting: two lines on the right page (open-book units), each written left to right with
 * a loopy wiggle; the pencil slides back between them. Shared with the stage, which times a soft
 * haptic to every stroke from the same numbers.
 */
export const WRITE_LINES = [
  { start: 0, end: 0.46, y: 6.5, from: 3, to: 20, loops: 5 },
  { start: 0.56, end: 1, y: 1, from: 3, to: 15, loops: 4 },
];

function buildNotebook(pose: MiloPose, map: (p: Pt) => Pt, u: number) {
  'worklet';
  const pop = Math.max(0, pose.notebook);
  const easeIO = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const smoothstep = (x: number) => x * x * (3 - 2 * x);
  const ka = easeIO(Math.min(1, Math.max(0, pose.aside)));
  const o = Math.min(1, Math.max(0, pose.open));
  const ko = smoothstep(o);
  // Where the book is: front, slid aside, or lying open (the flip carries it there).
  const lerpA = (p: number, q: number) => p + (q - p) * ka;
  const fx = lerpA(BOOK.front.x, BOOK.aside.x);
  const fy = lerpA(BOOK.front.y, BOOK.aside.y);
  const frot = lerpA(BOOK.front.rot, BOOK.aside.rot);
  const fsc = lerpA(BOOK.front.scale, BOOK.aside.scale);
  const bx = fx + (BOOK.open.x - fx) * ko;
  const by = fy + (BOOK.open.y - fy) * ko - 10 * (1 - Math.min(1, pop));
  const rot = ((frot + (BOOK.open.rot - frot) * ko) * Math.PI) / 180;
  // It glides up into place as it comes in (and back down as it goes), rather than popping.
  const sc = (fsc + (BOOK.open.scale - fsc) * ko) * (0.72 + 0.28 * Math.min(1, pop));
  // The flip: the shut view narrows to nothing, then the open view widens from nothing.
  const showOpen = o >= 0.5;
  const xs = Math.max(0.02, showOpen ? (o - 0.5) * 2 : 1 - o * 2);
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  /** Book-local units to Milo units (before mapping to the screen). */
  const L = (x: number, y: number): Pt => {
    'worklet';
    const X = x * xs;
    return { x: bx + (X * cr - y * sr) * sc, y: by + (X * sr + y * cr) * sc };
  };
  const B = (x: number, y: number): Pt => {
    'worklet';
    return map(L(x, y));
  };
  const empty = () => {
    'worklet';
    return Skia.PathBuilder.Make().build();
  };
  const poly = (pts: [number, number][], r: number) => {
    'worklet';
    // A polygon with softly rounded corners (quadratics through each corner).
    const b = Skia.PathBuilder.Make();
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i + n - 1) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const t1 = Math.min(0.45, r / Math.max(1e-6, d1));
      const t2 = Math.min(0.45, r / Math.max(1e-6, d2));
      const s = B(p1[0] + (p0[0] - p1[0]) * t1, p1[1] + (p0[1] - p1[1]) * t1);
      const e = B(p1[0] + (p2[0] - p1[0]) * t2, p1[1] + (p2[1] - p1[1]) * t2);
      const c = B(p1[0], p1[1]);
      if (i === 0) b.moveTo(s.x, s.y); else b.lineTo(s.x, s.y);
      b.quadTo(c.x, c.y, e.x, e.y);
    }
    b.close();
    return b.build();
  };

  // The shut view (the animator's book).
  const back = showOpen ? empty() : poly([[-21, 15], [-5, 11], [-5, -21], [-20, -16]], 2.2);
  const spine = showOpen ? empty() : poly([[-6, 11], [-1, 9.5], [-1, -24], [-6, -21]], 1.2);
  const front = showOpen ? empty() : poly([[-1, 9.5], [20, 13], [21, -12], [10, -16], [-1, -24]], 2.4);
  const label = showOpen ? empty() : poly([[4, -1], [15, 1.2], [15.6, -3.4], [4.4, -5.8]], 1.2);
  const pagesL = showOpen ? empty() : poly([[-20, 14], [-16, 22.5], [-11, 18], [-8, 21], [-5, 12]], 1.2);
  const pagesShade = showOpen ? empty() : poly([[-14, 15], [-11, 18], [-8, 21], [-5.5, 12.5]], 0.8);
  const pagesR = showOpen ? empty() : poly([[-1.5, 10], [2, 20.5], [6, 17], [12, 19.5], [19.5, 15.5], [19.5, 12.5]], 1.4);

  // The open view, from his side of the table: the backs of the two covers in a shallow V (the
  // spine nearest us, so it reaches lowest and highest; the outer edges further away, so a little
  // shorter), and the cream page block peeking over the top edge on each side. No ruled lines or
  // writing show: the pages face him. `gutter` is the spine.
  const cover = showOpen ? poly([[-23, -11.5], [0, -14.5], [23, -11.5], [22, 10.5], [0, 13], [-22, 10.5]], 2.4) : empty();
  const pageL = showOpen ? poly([[-21, 9.5], [-0.5, 12], [-0.5, 15.8], [-20.5, 12.8]], 1.2) : empty();
  const pageR = showOpen ? poly([[0.5, 12], [21, 9.5], [20.5, 12.8], [0.5, 15.8]], 1.2) : empty();
  const gutter = showOpen ? poly([[-1.4, -14.4], [1.4, -14.4], [1.4, 13.2], [-1.4, 13.2]], 0.8) : empty();
  const rulesB = Skia.PathBuilder.Make();

  // The handwriting so far, and where the pencil tip is (open-book units).
  const w = Math.min(1, Math.max(0, pose.write));
  const ink = Skia.PathBuilder.Make();
  let tipOpen: Pt = { x: WRITE_LINES[0].from, y: WRITE_LINES[0].y };
  for (let j = 0; j < WRITE_LINES.length; j++) {
    const l = WRITE_LINES[j];
    if (w <= l.start) break;
    const q = Math.min(1, (w - l.start) / (l.end - l.start));
    const steps = Math.max(2, Math.ceil(q * 60));
    for (let i = 0; i <= steps; i++) {
      const s = (q * i) / steps;
      // A hand-like loop: forward along the line, curling up and back a little each loop.
      const ph = s * Math.PI * 2 * l.loops;
      const x = l.from + (l.to - l.from) * s - 0.9 * Math.sin(ph);
      const y = l.y + 1.25 * (0.5 - 0.5 * Math.cos(ph)) * (0.85 + 0.15 * Math.sin(ph * 0.37 + j));
      tipOpen = { x, y };
    }
    // Between lines the pencil slides back to the start of the next one.
    const next = WRITE_LINES[j + 1];
    if (next && w > l.end && w < next.start) {
      const k = smoothstep((w - l.end) / (next.start - l.end));
      tipOpen = { x: tipOpen.x + (next.from - tipOpen.x) * k, y: tipOpen.y + (next.y - tipOpen.y) * k };
    }
  }
  // Lifted a touch off the page between lines and when not writing; on the paper while writing.
  const between = WRITE_LINES.some((l, i) => i > 0 && w > WRITE_LINES[i - 1].end && w < l.start);
  const writing = w > 0 && w < 1 && !between;

  // The pencil: beside the shut book at rest, or on the open page. Built in Milo units.
  const restM = L(BOOK.pencilRest.x, BOOK.pencilRest.y);
  // Inside the held book (shifted towards the spine so the pencil stays within the covers); it lifts
  // clear of the page between lines, which shows above the book as a little hop.
  const pageM = L(tipOpen.x - 9, tipOpen.y - 1 + (writing ? 0 : 2.6));
  const onPage = smoothstep(Math.min(1, Math.max(0, (o - 0.35) / 0.4)));
  const tipM = { x: restM.x + (pageM.x - restM.x) * onPage, y: restM.y + (pageM.y - restM.y) * onPage };
  const wobble = writing ? 3 * Math.sin(w * Math.PI * 2 * 9) : 0;
  const angDeg = BOOK.pencilAngle + (BOOK.writeAngle - BOOK.pencilAngle) * onPage + wobble + (rot * 180) / Math.PI * (1 - onPage);
  const ang = (angDeg * Math.PI) / 180;
  const d = { x: Math.cos(ang), y: Math.sin(ang) };
  const nrm = { x: -d.y, y: d.x };
  const ps = sc;
  const P = (along: number, side: number) => map({ x: tipM.x + (d.x * along + nrm.x * side) * ps, y: tipM.y + (d.y * along + nrm.y * side) * ps });
  const quad = (a0: number, a1: number, s0: number, s1: number, s2: number, s3: number) => {
    'worklet';
    const b = Skia.PathBuilder.Make();
    let q = P(a0, s0); b.moveTo(q.x, q.y);
    q = P(a1, s1); b.lineTo(q.x, q.y);
    q = P(a1, s2); b.lineTo(q.x, q.y);
    q = P(a0, s3); b.lineTo(q.x, q.y);
    b.close();
    return b.build();
  };
  const t = 3.1;
  const lead = quad(0, 2.6, 0, t * 0.36, -t * 0.36, 0);
  const wood = quad(2.6, 7, t * 0.36, t, -t, -t * 0.36);
  // The body's three stripes: dark below, mid, light on top (as in the art).
  const dark = quad(7, 29, -t, -t, -t / 3, -t / 3);
  const mid = quad(7, 29, -t / 3, -t / 3, t / 3, t / 3);
  const light = quad(7, 29, t / 3, t / 3, t, t);
  const eraserB = Skia.PathBuilder.Make();
  {
    let q = P(29, t); eraserB.moveTo(q.x, q.y);
    q = P(32.5, t); eraserB.lineTo(q.x, q.y);
    for (let i = 0; i <= 8; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / 8;
      q = P(32.5 + t * Math.cos(a), -t * Math.sin(a)); eraserB.lineTo(q.x, q.y);
    }
    q = P(29, -t); eraserB.lineTo(q.x, q.y);
    eraserB.close();
  }

  return {
    opacity: Math.min(1, pop * 1.6),
    back, spine, front, label, pagesL, pagesShade, pagesR,
    cover, pageL, pageR, gutter, rules: rulesB.build(), rulesWidth: 0.35 * u * sc,
    ink: ink.build(), inkWidth: 0.6 * u * sc,
    lead, wood, dark, mid, light, eraser: eraserB.build(), hand: empty(),
  };
}

/** A light bulb popping up over his head: glass, screw base and rays. */
function buildBulb(pose: MiloPose, map: (p: Pt) => Pt, H: number) {
  'worklet';
  const b = Math.max(0, pose.bulb);
  const r = 8.5 * b;
  const cx = 8;
  const cy = H + 24;
  const glass = Skia.PathBuilder.Make();
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n;
    // A bulb: round on top, narrowing to the neck.
    const k = Math.sin(a) < 0 ? 1 - 0.35 * Math.pow(-Math.sin(a), 2) : 1;
    const q = map({ x: cx + r * Math.cos(a) * k, y: cy + r * Math.sin(a) * (Math.sin(a) < 0 ? 1.15 : 1) });
    if (i === 0) glass.moveTo(q.x, q.y); else glass.lineTo(q.x, q.y);
  }
  glass.close();
  const base = Skia.PathBuilder.Make();
  for (let k = 0; k < 3; k++) {
    const y = cy - r * 1.18 - k * r * 0.22;
    const a = map({ x: cx - r * 0.42, y });
    const c = map({ x: cx + r * 0.42, y });
    base.moveTo(a.x, a.y);
    base.lineTo(c.x, c.y);
  }
  const rays = Skia.PathBuilder.Make();
  for (let k = 0; k < 5; k++) {
    const a = ((30 + 30 * k) * Math.PI) / 180;
    const p0 = map({ x: cx + r * 1.45 * Math.cos(a), y: cy + r * 1.45 * Math.sin(a) });
    const p1 = map({ x: cx + r * 1.9 * Math.cos(a), y: cy + r * 1.9 * Math.sin(a) });
    rays.moveTo(p0.x, p0.y);
    rays.lineTo(p1.x, p1.y);
  }
  return { opacity: Math.min(1, b * 1.4), glass: glass.build(), base: base.build(), rays: rays.build() };
}

/** Two rings spinning over his head, like an atom: overthinking. */
function buildRings(pose: MiloPose, map: (p: Pt) => Pt, H: number) {
  'worklet';
  const k = Math.max(0, pose.rings);
  const cx = 0;
  const cy = H + 20;
  const rings = Skia.PathBuilder.Make();
  const dots = Skia.PathBuilder.Make();
  for (let j = 0; j < 2; j++) {
    const tilt = pose.spin + j * (Math.PI / 2);
    const rx = 17 * k;
    const ry = 5 * k;
    for (let i = 0; i <= 36; i++) {
      const a = (2 * Math.PI * i) / 36;
      const x = rx * Math.cos(a);
      const y = ry * Math.sin(a);
      const q = map({ x: cx + x * Math.cos(tilt) - y * Math.sin(tilt), y: cy + x * Math.sin(tilt) + y * Math.cos(tilt) });
      if (i === 0) rings.moveTo(q.x, q.y); else rings.lineTo(q.x, q.y);
    }
    // A little bead travelling round each ring, so the spin reads.
    const a = pose.spin * 3 + j * Math.PI;
    const x = rx * Math.cos(a);
    const y = ry * Math.sin(a);
    const q = map({ x: cx + x * Math.cos(tilt) - y * Math.sin(tilt), y: cy + x * Math.sin(tilt) + y * Math.cos(tilt) });
    dots.addCircle(q.x, q.y, 1.6 * k * (map({ x: 1, y: 0 }).x - map({ x: 0, y: 0 }).x));
  }
  return { opacity: Math.min(1, k * 1.4), rings: rings.build(), dots: dots.build() };
}

/**
 * Milo's waving hand as the illustrator draws his hands: a pill in the side colour (the art's
 * 72.8 x 46.7 rounded rect, so 26.6 x 17.1 units), floating just off his right shoulder. It pops in
 * where it is (scaling up from its middle) and waves by rocking about its lower end.
 */
const PILL = { long: 26.6, short: 17.1, centre: { x: 58, y: 63 }, tilt: 16 };
function handPill(arm: { angle: number; extension: number }) {
  'worklet';
  const g = Math.max(0, arm.extension);
  // The arm's wave angle swings about 136 degrees; the pill rocks by the same amount.
  const rock = ((PILL.tilt - (arm.angle - 136)) * Math.PI) / 180;
  const up = { x: Math.sin(rock), y: Math.cos(rock) };
  const side = { x: up.y, y: -up.x };
  const r = (PILL.short / 2) * g;
  const half = ((PILL.long - PILL.short) / 2) * g;
  // Rock about the lower end: the middle moves with the swing.
  const base = { x: PILL.centre.x - Math.sin((PILL.tilt * Math.PI) / 180) * (PILL.long / 2), y: PILL.centre.y - Math.cos((PILL.tilt * Math.PI) / 180) * (PILL.long / 2) };
  const mid = { x: base.x + up.x * (PILL.long / 2), y: base.y + up.y * (PILL.long / 2) };
  const top = { x: mid.x + up.x * half, y: mid.y + up.y * half };
  const bot = { x: mid.x - up.x * half, y: mid.y - up.y * half };
  const points: Pt[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    points.push({ x: top.x + side.x * r * Math.cos(a) + up.x * r * Math.sin(a), y: top.y + side.y * r * Math.cos(a) + up.y * r * Math.sin(a) });
  }
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (Math.PI * i) / n;
    points.push({ x: bot.x + side.x * r * Math.cos(a) + up.x * r * Math.sin(a), y: bot.y + side.y * r * Math.cos(a) + up.y * r * Math.sin(a) });
  }
  return { points, hand: top, dir: up, radius: r };
}

function EMPTY_NOTEBOOK() {
  'worklet';
  const e = () => Skia.PathBuilder.Make().build();
  return {
    opacity: 0, back: e(), spine: e(), front: e(), label: e(), pagesL: e(), pagesShade: e(), pagesR: e(),
    cover: e(), pageL: e(), pageR: e(), gutter: e(), rules: e(), rulesWidth: 1,
    ink: e(), inkWidth: 1, lead: e(), wood: e(), dark: e(), mid: e(), light: e(), eraser: e(), hand: e(),
  };
}


/** Milo units (y up) to screen points, with squash, lean and lift. */
function mapper(data: BodyData, pose: MiloPose, gx: number, gy: number, u: number) {
  'worklet';
  const ws = 1 / Math.sqrt(pose.squash);
  const H = data.morph ? data.H + (data.morph.H - data.H) * Math.min(1, Math.max(0, pose.morph)) : data.H;
  return (p: Pt): Pt => {
    'worklet';
    const x = p.x * ws + pose.lean * (p.y / H);
    const y = p.y * pose.squash;
    return { x: gx + x * u, y: gy - (y + pose.lift) * u };
  };
}

/** Eye shapes, drawn for the LEFT eye around (0, 0) in units with y down. */
function addEye(fill: SkPathBuilder, stroke: SkPathBuilder, pose: MiloPose, place: (q: Pt) => Pt, aspect: number, crescent: boolean) {
  'worklet';
  // Angry: the top of the eye is cut by a lid that slants down towards the middle of the face
  // (+x is the inner side for this left eye; the right one is mirrored). Only the top moves.
  const angry = Math.min(1, Math.max(0, pose.anger));
  const lid = (x: number, y: number, rx: number, ry: number) => {
    if (angry <= 0 || y > 0) return y;
    const line = Math.min(ry * 0.5, -ry * 0.2 + ry * 0.62 * (x / rx));
    return Math.max(y, -ry + (line + ry) * angry);
  };
  const ellipse = (rx: number, ry: number) => {
    // Enough points to stay a smooth oval even when the camera is right up close (the splash).
    const n = 72;
    for (let i = 0; i <= n; i++) {
      const a = (2 * Math.PI * i) / n;
      const q = place({ x: rx * Math.cos(a), y: lid(rx * Math.cos(a), ry * Math.sin(a), rx, ry) });
      if (i === 0) fill.moveTo(q.x, q.y);
      else fill.lineTo(q.x, q.y);
    }
    fill.close();
  };
  const curve = (p0: Pt, c1: Pt, c2: Pt, p3: Pt) => {
    const a = place(p0);
    const b = place(c1);
    const c = place(c2);
    const d = place(p3);
    stroke.moveTo(a.x, a.y);
    stroke.cubicTo(b.x, b.y, c.x, c.y, d.x, d.y);
  };
  const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

  // Default and happy are one eye that morphs. Happy is the illustrator's: the oval keeps its top,
  // and its bottom curves up into it (a filled, upturned crescent). Only the bottom edge moves, so
  // every in-between frame is a real eye shape.
  const h = pose.eyes === 'happy' ? 1 : pose.eyes === 'oval' ? Math.min(1, Math.max(0, pose.happiness)) : -1;
  if (h >= 0 && !crescent) {
    // The first version (Manan's favourite on the tall Milo): the oval flattens into a line, then
    // bends into a stroked arc.
    const strokeW = 2.5;
    if (h < 0.5) {
      const s = ease(h / 0.5);
      const rx0 = 3.3 * aspect;
      const rx = rx0 + (7.6 + strokeW / 2 - rx0) * s;
      const open = 5.1 * Math.max(0.08, 1 - pose.blink);
      const ry = open + (strokeW / 2 - open) * s;
      ellipse(rx, ry);
    } else {
      const k = ease((h - 0.5) / 0.5);
      curve({ x: -7.6, y: 3 * k }, { x: -7.4, y: -5.8 * k }, { x: 7.4, y: -5.8 * k }, { x: 7.6, y: 3 * k });
    }
    return;
  }
  if (h >= 0) {
    const e = ease(h);
    const rx = 3.3 * aspect;
    const ry = 5.1 * Math.max(0.08, 1 - pose.blink);
    // Where the bottom edge meets the top, a little below the middle (as drawn in the art).
    const c = 0.245;
    const xc = Math.cos(c);
    const n = 16;
    // Top: over the top of the oval, from the right corner to the left one.
    for (let i = 0; i <= n; i++) {
      const a = c - ((Math.PI + 2 * c) * i) / n;
      const q = place({ x: rx * Math.cos(a), y: lid(rx * Math.cos(a), ry * Math.sin(a), rx, ry) });
      if (i === 0) fill.moveTo(q.x, q.y);
      else fill.lineTo(q.x, q.y);
    }
    // Bottom: back from left to right, the oval's own curve bending up into the crescent.
    for (let i = 1; i < n; i++) {
      const x = -xc + (2 * xc * i) / n;
      const oval = Math.sqrt(Math.max(0, 1 - x * x));
      const happy = -0.23 + (Math.sin(c) + 0.23) * Math.pow(Math.abs(x) / xc, 2.6);
      const q = place({ x: rx * x, y: ry * (oval + (happy - oval) * e) });
      fill.lineTo(q.x, q.y);
    }
    fill.close();
    return;
  }
  switch (pose.eyes) {
    case 'sleep':
      curve({ x: -6.6, y: -0.9 }, { x: -3.3, y: 2.9 }, { x: 3.3, y: 2.9 }, { x: 6.6, y: -0.9 });
      return;
    case 'dash': {
      // Rounded bar 10 x 3.4.
      const n = 10;
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + (Math.PI * i) / n;
        const q = place({ x: 3.3 + 1.7 * Math.cos(a), y: 1.7 * Math.sin(a) });
        if (i === 0) fill.moveTo(q.x, q.y);
        else fill.lineTo(q.x, q.y);
      }
      for (let i = 0; i <= n; i++) {
        const a = Math.PI / 2 + (Math.PI * i) / n;
        const q = place({ x: -3.3 + 1.7 * Math.cos(a), y: 1.7 * Math.sin(a) });
        fill.lineTo(q.x, q.y);
      }
      fill.close();
      return;
    }
    case 'sad': {
      // Crescent: thin end raised toward the middle of the face, heavy end drooping outward.
      const k = 1.18;
      const P = (x: number, y: number) => place({ x: x * k, y: y * k });
      let q = P(6.2, -4.2);
      fill.moveTo(q.x, q.y);
      const cub = (a: [number, number], b: [number, number], c: [number, number]) => {
        const p1 = P(a[0], a[1]);
        const p2 = P(b[0], b[1]);
        const p3 = P(c[0], c[1]);
        fill.cubicTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      };
      cub([6.6, -0.6], [3.4, 4.6], [-2.2, 4.7]);
      cub([-5.4, 4.8], [-7.3, 3.4], [-6.9, 1.4]);
      cub([-6.5, -0.4], [-4.2, -0.4], [-2, -0.9]);
      cub([0.6, -1.6], [2.4, -2.9], [3.9, -4.9]);
      for (let i = 1; i <= 10; i++) {
        const a = ((212.8 + ((361 - 212.8) * i) / 10) * Math.PI) / 180;
        q = P(4.95 + 1.25 * Math.cos(a), -4.222 + 1.25 * Math.sin(a));
        fill.lineTo(q.x, q.y);
      }
      fill.close();
      return;
    }
    case 'heart': {
      const k = 1.4;
      const P = (x: number, y: number) => place({ x: x * k, y: y * k });
      let q = P(0, 5.2);
      fill.moveTo(q.x, q.y);
      const cub = (a: [number, number], b: [number, number], c: [number, number]) => {
        const p1 = P(a[0], a[1]);
        const p2 = P(b[0], b[1]);
        const p3 = P(c[0], c[1]);
        fill.cubicTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      };
      cub([-0.5, 5.2], [-1.2, 4.8], [-1.8, 4.3]);
      cub([-4.2, 2.4], [-7.2, 0.2], [-7.2, -2.8]);
      cub([-7.2, -5.4], [-5.2, -6.8], [-3.4, -6.8]);
      cub([-1.9, -6.8], [-0.8, -6], [-0.3, -5]);
      const c = P(0, -4.5);
      q = P(0.3, -5);
      fill.quadTo(c.x, c.y, q.x, q.y);
      cub([0.8, -6], [1.9, -6.8], [3.4, -6.8]);
      cub([5.2, -6.8], [7.2, -5.4], [7.2, -2.8]);
      cub([7.2, 0.2], [4.2, 2.4], [1.8, 4.3]);
      cub([1.2, 4.8], [0.5, 5.2], [0, 5.2]);
      fill.close();
      return;
    }
    default:
      return;
  }
}

export function buildFrame(data: BodyData, pose: MiloPose, size: number, colorSide: string): Frame {
  'worklet';
  void colorSide;
  const u = size / data.W;
  const gx = GROUND_UNITS.x * u;
  const gy = GROUND_UNITS.y * u;
  const map = mapper(data, pose, gx, gy, u);
  const ws = 1 / Math.sqrt(pose.squash);

  // Morphing from the first-version body into the Aha body (0 = first version, 1 = Aha).
  const mo = data.morph;
  const m = mo ? Math.min(1, Math.max(0, pose.morph)) : 0;
  const mix = (a: Pt[], b: Pt[]) => {
    'worklet';
    const out: Pt[] = [];
    for (let i = 0; i < a.length; i++) out.push({ x: a[i].x + (b[i].x - a[i].x) * m, y: a[i].y + (b[i].y - a[i].y) * m });
    return out;
  };
  /** A smooth closed path through points (midpoint quadratics). */
  const smooth = (b: SkPathBuilder, pts: Pt[]) => {
    'worklet';
    const n = pts.length;
    const m0 = map(pts[n - 1]);
    const m1 = map(pts[0]);
    b.moveTo((m0.x + m1.x) / 2, (m0.y + m1.y) / 2);
    for (let i = 0; i < n; i++) {
      const cur = i === 0 ? m1 : map(pts[i]);
      const nxt = map(pts[(i + 1) % n]);
      b.quadTo(cur.x, cur.y, (cur.x + nxt.x) / 2, (cur.y + nxt.y) / 2);
    }
    b.close();
  };
  const cubics = (b: SkPathBuilder, segs: Cubic[]) => {
    'worklet';
    const s0 = map(segs[0][0]);
    b.moveTo(s0.x, s0.y);
    for (let i = 0; i < segs.length; i++) {
      const a = map(segs[i][1]);
      const c = map(segs[i][2]);
      const d = map(segs[i][3]);
      b.cubicTo(a.x, a.y, c.x, c.y, d.x, d.y);
    }
    b.close();
  };

  // Silhouette: the exact curves (or, mid-morph, the matched points in between).
  const silhouetteB = Skia.PathBuilder.Make();
  const segs = data.segs;
  if (mo && m > 0) smooth(silhouetteB, mix(mo.out, mo.to));
  else cubics(silhouetteB, segs);
  const silhouette = silhouetteB.build();

  // The first version's lighter face inside its darker band; mid-morph it grows to fill the body
  // while the Aha side plane fades in over it.
  const faceB = Skia.PathBuilder.Make();
  if (mo && m > 0) smooth(faceB, mix(mo.face, mo.to));
  else if (data.face) smooth(faceB, data.face);
  const face = faceB.build();
  const planeB = Skia.PathBuilder.Make();
  const planeSegs = data.plane ?? (mo && m > 0 ? mo.plane : null);
  if (planeSegs) cubics(planeB, planeSegs);
  const plane = planeB.build();
  const planeOpacity = data.plane ? 1 : m;

  // Arm and motion marks.
  let arm: SkPath | null = null;
  let marks: SkPath | null = null;
  let marksOpacity = 0;
  if (pose.arm && pose.arm.extension > 0.01) {
    // The Aha body: the illustrator's hand, a floating pill beside him (never an arm out of the body).
    // The studies: the arm that grows out of the outline.
    const geo = data.plane ? handPill(pose.arm) : armOutline(data.arm[0], data.arm[1], pose.arm);
    const armB = Skia.PathBuilder.Make();
    for (let i = 0; i < geo.points.length; i++) {
      const q = map(geo.points[i]);
      if (i === 0) armB.moveTo(q.x, q.y);
      else armB.lineTo(q.x, q.y);
    }
    armB.close();
    arm = armB.build();
    if (pose.arm.marks > 0.01) {
      const marksB = Skia.PathBuilder.Make();
      marksOpacity = pose.arm.marks;
      const base = Math.atan2(geo.dir.y, geo.dir.x);
      const radii = [5.5, 10];
      for (let k = 0; k < 2; k++) {
        const span = k === 0 ? 0.42 : 0.32;
        for (let i = 0; i <= 10; i++) {
          const a = base - span + (2 * span * i) / 10;
          const q = map({ x: geo.hand.x + (geo.radius + radii[k]) * Math.cos(a), y: geo.hand.y + (geo.radius + radii[k]) * Math.sin(a) });
          if (i === 0) marksB.moveTo(q.x, q.y);
          else marksB.lineTo(q.x, q.y);
        }
      }
      marks = marksB.build();
    }
  }

  // Eyes ride with the body's squash and lean.
  const e0 = data.eyes;
  const e1 = mo ? mo.eyes : e0;
  const place0 = {
    x: e0.x + (e1.x - e0.x) * m, y: e0.y + (e1.y - e0.y) * m, spacing: e0.spacing + (e1.spacing - e0.spacing) * m,
    rx: e0.rx + (e1.rx - e0.rx) * m, ry: e0.ry + (e1.ry - e0.ry) * m,
  };
  const Hm = mo ? data.H + (mo.H - data.H) * m : data.H;
  const centre = { x: place0.x * ws + pose.lean * (place0.y / Hm), y: place0.y * pose.squash };
  const ex = centre.x + pose.lookX;
  const ey = -centre.y - pose.lift + pose.lookY;
  const spacing = place0.spacing * ws;
  // Every eye shape is drawn for the earlier 3.3 x 5.1 oval; scale it to this body's eyes.
  const s = pose.eyeScale * (place0.ry / 5.1);
  const aspect = place0.rx / place0.ry / (3.3 / 5.1);
  const eyesFillB = Skia.PathBuilder.Make();
  const eyesStrokeB = Skia.PathBuilder.Make();
  for (const sideSign of [-1, 1]) {
    const cx = ex + (sideSign * spacing) / 2;
    // Left eye drawn as is, right eye mirrored. Local coords are y down around the eye centre.
    const place = (q: Pt): Pt => {
      'worklet';
      const lx = cx + q.x * s * (sideSign === -1 ? 1 : -1);
      const ly = ey + q.y * s;
      return { x: gx + lx * u, y: gy + ly * u };
    };
    addEye(eyesFillB, eyesStrokeB, pose, place, aspect, !!data.plane);
  }
  const eyesFill = eyesFillB.build();
  const eyesStroke = eyesStrokeB.build();
  let blush: SkPath | null = null;
  if (pose.eyes === 'heart') {
    const blushB = Skia.PathBuilder.Make();
    for (const sideSign of [-1, 1]) {
      const cx = ex + (sideSign * spacing) / 2;
      blushB.addOval(Skia.XYWHRect(gx + (cx - 6.6) * u, gy + (ey + 13.5 * s - 2.6) * u, 13.2 * u, 5.2 * u));
    }
    blush = blushB.build();
  }
  const strokeUnits = pose.eyes === 'sleep' ? 2.2 : 2.5;

  // Contact shadow: a flattened oval about Milo's width, shrinking and fading as he lifts.
  const airborne = Math.min(1, pose.lift / 40);
  const k = 1 - 0.35 * airborne;
  const rx = data.shadow.rx * ws * k;
  const ry = data.shadow.ry * k;

  return {
    silhouette, face, plane, planeOpacity, morph: m, arm, marks, marksOpacity,
    eyesFill, eyesStroke, eyeStrokeWidth: strokeUnits * u * s, blush,
    eyeInk: pose.eyes === 'heart' ? '#C11D4A' : '#3A261C',
    shadowRect: { x: gx - rx * u, y: gy + (data.shadow.below - ry) * u, width: 2 * rx * u, height: 2 * ry * u },
    shadowOpacity: pose.shadow * (1 - 0.5 * airborne),
    shadowBlur: 0.5 * u,
    notebook: pose.notebook > 0.01 ? buildNotebook(pose, map, u) : EMPTY_NOTEBOOK(),
    bulb: pose.bulb > 0.01 ? buildBulb(pose, map, data.H) : { opacity: 0, glass: Skia.PathBuilder.Make().build(), base: Skia.PathBuilder.Make().build(), rays: Skia.PathBuilder.Make().build() },
    rings: pose.rings > 0.01 ? buildRings(pose, map, data.H) : { opacity: 0, rings: Skia.PathBuilder.Make().build(), dots: Skia.PathBuilder.Make().build() },
  };
}

export { handTipPoints };
