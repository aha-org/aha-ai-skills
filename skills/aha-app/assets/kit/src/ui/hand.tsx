// Hand-drawn pieces (the daily log's look): outlines drawn in one go with a slow, slight wobble,
// their ends running a little past where they began, in ink. Used by the journal's camera and
// gallery buttons, the camera screen, the photos on a page, and the month calendar.
//
// Every path is made from a seed, so the same thing is drawn the same way every time (no jitter).

import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { C } from '../theme';

export const HAND_INK = C.contentPrimary;

/** A little noise that changes slowly along the line (a steady hand, not a shaky one). */
const wob = (t: number, seed: number) => Math.sin(t * 2.1 + seed) * 0.6 + Math.sin(t * 5.3 + seed * 1.7) * 0.4;

/** A rounded rectangle drawn by hand, as an SVG path, inside w x h (the stroke stays inside). */
export function handRect(w: number, h: number, r: number, seed = 1, amount = 1.6) {
  const pts: [number, number][] = [];
  const inset = 2;
  const x0 = inset, y0 = inset, x1 = w - inset, y1 = h - inset;
  const rr = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  // Walk the outline: sides as lines, corners as quarter turns, clockwise from the top left.
  const corner = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 6; k++) {
      const a = a0 + (k / 6) * (Math.PI / 2);
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
  };
  const side = (ax: number, ay: number, bx: number, by: number, n: number) => {
    for (let k = 1; k < n; k++) pts.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  };
  corner(x0 + rr, y0 + rr, Math.PI);
  side(x0 + rr, y0, x1 - rr, y0, 10);
  corner(x1 - rr, y0 + rr, -Math.PI / 2);
  side(x1, y0 + rr, x1, y1 - rr, 14);
  corner(x1 - rr, y1 - rr, 0);
  side(x1 - rr, y1, x0 + rr, y1, 10);
  corner(x0 + rr, y1 - rr, Math.PI / 2);
  side(x0, y1 - rr, x0, y0 + rr, 14);
  const n = pts.length;
  const out = pts.map(([x, y], i) => {
    const t = (i / n) * Math.PI * 2;
    // Push in or out a touch, never past the box.
    const dx = x < w / 2 ? 1 : -1;
    const dy = y < h / 2 ? 1 : -1;
    const k = (wob(t * 3, seed) + 1) * 0.5 * amount;
    return [x + dx * k, y + dy * k];
  });
  // The end runs on a little past the start, the way a pen closes a shape.
  const over = out.slice(0, 3).map(([x, y], i) => [x + 0.6 * (i + 1), y + 0.8 * (i + 1)]);
  return [...out, ...over].map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

/** A circle drawn by hand, centred in a box of size d. */
export function handCircle(d: number, seed = 1) {
  const c = d / 2;
  const n = 40;
  const pts: string[] = [];
  for (let i = 0; i <= n + 3; i++) {
    const a = -Math.PI / 2 + 0.3 + (i / n) * Math.PI * 2;
    const r = (c - 2.5) * (1 + 0.025 * wob(a * 2, seed)) - (i > n ? (i - n) * 0.8 : 0);
    pts.push(`${i ? 'L' : 'M'}${(c + r * Math.cos(a)).toFixed(1)} ${(c + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** A filled-in-by-pen disc: the circle, then quick zigzag hatching across it. */
export function scribbleDisc(d: number, seed = 1, steps = 16, lean = 5) {
  const c = d / 2;
  const r = c - 4;
  const lines: string[] = [handCircle(d, seed)];
  let path = '';
  for (let k = 0; k <= steps; k++) {
    // Strokes leaning to the right, going up and down across the disc.
    const u = -1 + (2 * k) / steps;
    const half = Math.sqrt(Math.max(0, 1 - u * u)) * r;
    const x = c + u * r;
    const top = c - half + 1;
    const bottom = c + half - 1;
    const a = k % 2 === 0 ? [x - lean, bottom] : [x + lean, top];
    path += `${k ? 'L' : 'M'}${a[0].toFixed(1)} ${a[1].toFixed(1)} `;
  }
  lines.push(path);
  return lines;
}

type IconP = { size?: number; color?: string; stroke?: number };

function HandIcon({ size = 32, color = HAND_INK, stroke = 2.2, d, box = 32 }: IconP & { d: string[]; box?: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${box} ${box}`} pointerEvents="none">
      {d.map((p, i) => <Path key={i} d={p} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
    </Svg>
  );
}

export const HandX = (p: IconP) => <HandIcon {...p} d={['M8 8.5 C 13 13, 19 19.5, 24.5 24', 'M24 8 C 19 13, 13.5 19, 8.5 24.5']} />;

/** A lightning bolt; struck through when the flash is off. */
export const HandFlash = ({ off, ...p }: IconP & { off: boolean }) => (
  <HandIcon {...p} d={['M18.5 4 L 10 17.5 L 16.5 17 L 13 28 L 22.5 13.5 L 16 14 Z', ...(off ? ['M5 7 C 12 13, 20 20, 28 26'] : [])]} />
);

/** Two arrows chasing each other round: flip the camera. */
export const HandFlip = (p: IconP) => (
  <HandIcon {...p} d={[
    'M6.5 14 C 7.5 8.5, 12 6, 16.5 6 C 20.5 6, 24 8.5, 25.5 12', 'M26 7.5 L 25.6 12.4 L 21 11.6',
    'M25.5 18 C 24.5 23.5, 20 26, 15.5 26 C 11.5 26, 8 23.5, 6.5 20', 'M6 24.5 L 6.4 19.6 L 11 20.4',
  ]} />
);

/** A camera: the body, the bump on top and the lens. */
export const HandCameraIcon = (p: IconP) => (
  <HandIcon {...p} d={[
    'M5 11 C 5 9.5, 6 8.8, 7.5 8.8 L 11 8.6 L 13 5.8 L 19.5 5.9 L 21.3 8.7 L 25 8.8 C 26.5 8.9, 27.2 9.8, 27.1 11.3 L 27 23 C 27 24.6, 26 25.4, 24.6 25.3 L 7.4 25.4 C 6 25.4, 5 24.6, 5.1 23 Z',
    'M16 11.6 C 19.3 11.4, 21.4 13.8, 21.2 16.6 C 21 19.6, 18.6 21.4, 16 21.3 C 13 21.2, 10.9 19, 11 16.3 C 11.1 13.6, 13.2 11.7, 16.3 11.8',
  ]} />
);

/** A photo: the frame, a hill and the sun. */
export const HandGalleryIcon = (p: IconP) => (
  <HandIcon {...p} d={[
    'M5.5 7.5 C 5.6 6.4, 6.4 5.8, 7.6 5.8 L 24.6 5.9 C 25.8 5.9, 26.5 6.7, 26.5 7.9 L 26.4 24.3 C 26.4 25.5, 25.6 26.2, 24.4 26.2 L 7.5 26.1 C 6.3 26.1, 5.6 25.3, 5.6 24.1 Z',
    'M6 21.5 L 12.5 14.8 L 17.5 19.6 L 20.5 16.8 L 26 22',
    'M20.6 9.6 C 22.2 9.5, 23.2 10.6, 23.1 11.9 C 23 13.2, 21.9 14.1, 20.7 14 C 19.4 13.9, 18.5 12.9, 18.6 11.7 C 18.7 10.5, 19.6 9.7, 20.9 9.7',
  ]} />
);

export const HandTick = (p: IconP) => <HandIcon {...p} d={['M7 16.5 C 9.5 18.5, 11.5 21, 13.5 24 C 17 17, 21 11.5, 26 7.5']} />;

/** A small heart, the way you'd sign off a note. */
export const HandHeart = (p: IconP) => (
  <HandIcon {...p} d={['M15.2 26.6 C 11.5 23.4, 6.2 19.6, 4.9 14.2 C 3.9 10, 6.4 6.3, 10 6.1 C 13 5.9, 15 8.4, 15.9 11.6 C 16.6 8.1, 19.1 5.4, 22.4 5.7 C 26 6, 28 9.6, 27.1 13.4 C 26 18.4, 21.2 22.6, 16.6 26.9 C 16.1 27.4, 15.5 27.3, 14.6 26.4 L 13.4 25.1']} />
);

/** A hand-drawn outline sized to its box (for buttons and frames). */
export function HandOutline({ w, h, r = 16, seed = 1, color = HAND_INK, stroke = 2 }: { w: number; h: number; r?: number; seed?: number; color?: string; stroke?: number }) {
  return (
    <Svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <Path d={handRect(w, h, r, seed)} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
