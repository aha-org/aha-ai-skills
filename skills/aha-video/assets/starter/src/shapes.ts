// Material 3 Expressive shapes (same set as the Being There Matters deck), as equal-area
// outlines with the same point count, so any two can morph point by point.

const N = 180;
const polar = (n: number, k: number) => (t: number): [number, number] => {
  const r = (1 + k * Math.cos(n * t)) / (1 + k);
  return [r * Math.cos(t), r * Math.sin(t)];
};
const FNS: Record<string, (t: number) => [number, number]> = {
  circle: polar(1, 0),
  squircle: (t) => {
    const c = Math.cos(t), s = Math.sin(t), e = 2 / 4.2;
    return [Math.sign(c) * Math.abs(c) ** e, Math.sign(s) * Math.abs(s) ** e];
  },
  cookie4: polar(4, 0.07),
  cookie6: polar(6, 0.07),
  cookie9: polar(9, 0.055),
  cookie12: polar(12, 0.045),
  sunny: polar(8, 0.09),
  clover4: polar(4, 0.2),
  flower: polar(8, 0.16),
};

const RAW: Record<string, { pts: [number, number][]; area: number }> = {};
for (const [k, fn] of Object.entries(FNS)) {
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) pts.push(fn((i / N) * Math.PI * 2 - Math.PI / 2));
  let a = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % N];
    a += p[0] * q[1] - q[0] * p[1];
  });
  RAW[k] = { pts, area: Math.abs(a) / 2 };
}
const minArea = Math.min(...Object.values(RAW).map((r) => r.area));

export type ShapeName = keyof typeof FNS;

export function shapePoints(name: string): [number, number][] {
  const r = RAW[name], s = Math.sqrt(minArea / r.area);
  return r.pts.map(([x, y]) => [x * s, y * s]);
}

// SVG path for a shape (or a morph between two) of radius R, centred on 0,0, rotated by deg.
export function shapePath(a: string, R: number, deg = 0, b?: string, t = 0): string {
  const A = shapePoints(a), B = b ? shapePoints(b) : A;
  const rad = (deg * Math.PI) / 180, c = Math.cos(rad), s = Math.sin(rad);
  return (
    "M" +
    A.map(([x, y], i) => {
      const px = (x + (B[i][0] - x) * t) * R, py = (y + (B[i][1] - y) * t) * R;
      return `${(px * c - py * s).toFixed(2)} ${(px * s + py * c).toFixed(2)}`;
    }).join(" L") +
    "Z"
  );
}
