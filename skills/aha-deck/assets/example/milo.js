// Milo for the web. A direct port of the approved SwiftUI Milo (aha-prototype/AhaPrototype/Milo):
// same ten-curve outline, same thickness band, same eye shapes, same timing.
// Units: Milo's base is 100 wide, y points UP from the ground. The SVG canvas is 170 x 160 units
// with the ground point at (85, 152).

(function () {
  const GX = 85, GY = 152;

  // ---------- colours (MiloTokens.swift) ----------
  const MOODS = {
    green: ['#9AB327', '#839A1A'],
    blue: ['#7BA6DE', '#658CBF'],
    pink: ['#F4668E', '#D25075'],
    yellow: ['#F1C93F', '#CFAB2D'],
    orange: ['#F59A3D', '#D3802B'],
    red: ['#E8584B', '#C84438'],
  };
  const INK = '#262525', HEART = '#C11D4A', BLUSH = '#E94F7E';

  // ---------- geometry (MiloShape.swift) ----------
  const P = (x, y) => ({ x, y });
  const add = (a, b, k = 1) => P(a.x + b.x * k, a.y + b.y * k);
  const unit = (v) => { const l = Math.hypot(v.x, v.y) || 1; return P(v.x / l, v.y / l); };
  const K = 0.55;
  const arcK = (a, b) => (4 / 3) * Math.tan(Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y))) / 4);
  function cubicPt(c, t) {
    const u = 1 - t, a = u * u * u, b = 3 * u * u * t, cc = 3 * u * t * t, d = t * t * t;
    return P(a * c[0].x + b * c[1].x + cc * c[2].x + d * c[3].x, a * c[0].y + b * c[1].y + cc * c[2].y + d * c[3].y);
  }

  function side(S, sign) {
    const rx = S.cornerX ?? S.corner;
    const c0 = P(sign * (S.base - rx), 0), c1 = P(sign * S.base, S.corner), sh = P(sign * S.shoulder, S.shoulderY);
    const up = unit(P(sh.x - c1.x, sh.y - c1.y));
    const normal = unit(P(sign === 1 ? up.y : -up.y, sign === 1 ? -up.x : up.x));
    const len = Math.hypot(sh.x - c1.x, sh.y - c1.y);
    const h1 = add(add(c1, up, len / 3), normal, S.bulge), h2 = add(add(sh, up, -len / 3), normal, S.bulge);
    return { rx, c0, c1, sh, h1, h2, startDir: unit(P(h1.x - c1.x, h1.y - c1.y)), endDir: unit(P(sh.x - h2.x, sh.y - h2.y)) };
  }

  function segments(s) {
    const R = side(s.right, 1), L = side(s.left, -1);
    const tilt = unit(P(R.c0.x - L.c0.x, R.c0.y - L.c0.y));
    const b0 = P(0, L.c0.y + (R.c0.y - L.c0.y) * (-L.c0.x / (R.c0.x - L.c0.x)) - s.belly);
    const bottom = (from, to, fromIsCentre) => {
      const w = (to.x - from.x) / 3, flat = P(1, 0);
      const fd = fromIsCentre ? tilt : flat, td = fromIsCentre ? flat : tilt;
      return [from, add(from, fd, w / fd.x), add(to, td, -w / td.x), to];
    };
    const domeR = s.humpR.y - s.right.shoulderY, domeL = s.humpL.y - s.left.shoulderY;
    const waveR = s.humpR.x - s.dip.x, waveL = s.dip.x - s.humpL.x;
    const kR = arcK(P(1, 0), R.startDir), kL = arcK(P(-1, 0), L.startDir);
    return [
      bottom(b0, R.c0, true),
      [R.c0, P(R.c0.x + kR * R.rx, R.c0.y), add(R.c1, R.startDir, -kR * s.right.corner), R.c1],
      [R.c1, R.h1, R.h2, R.sh],
      [R.sh, add(R.sh, R.endDir, (K * domeR) / Math.max(0.3, R.endDir.y)), P(s.humpR.x + K * (s.right.shoulder - s.humpR.x), s.humpR.y), s.humpR],
      [s.humpR, P(s.humpR.x - 0.42 * waveR, s.humpR.y), P(s.dip.x + 0.42 * waveR, s.dip.y), s.dip],
      [s.dip, P(s.dip.x - 0.42 * waveL, s.dip.y), P(s.humpL.x + 0.42 * waveL, s.humpL.y), s.humpL],
      [s.humpL, P(s.humpL.x - K * (s.left.shoulder + s.humpL.x), s.humpL.y), add(L.sh, L.endDir, (K * domeL) / Math.max(0.3, L.endDir.y)), L.sh],
      [L.sh, L.h2, L.h1, L.c1],
      [L.c1, add(L.c1, L.startDir, -kL * s.left.corner), P(L.c0.x - kL * L.rx, L.c0.y), L.c0],
      bottom(L.c0, b0, false),
    ];
  }

  function blurredProfile(knotsIn, total, n, sigma) {
    const k = [...knotsIn].sort((a, b) => a[0] - b[0]);
    const step = total / n;
    const linear = new Array(n);
    for (let i = 0; i < n; i++) {
      const s = i * step;
      let j = k.length - 1;
      k.forEach((kn, idx) => { if (kn[0] <= s) j = idx; });
      const a = k[j], b = k[(j + 1) % k.length];
      let span = b[0] - a[0], off = s - a[0];
      if (span <= 0) span += total;
      if (off < 0) off += total;
      linear[i] = a[1] + (b[1] - a[1]) * Math.min(1, Math.max(0, off / span));
    }
    const sg = sigma / step, r = Math.ceil(sg * 3);
    const w = []; for (let q = -r; q <= r; q++) w.push(Math.exp(-(q * q) / (2 * sg * sg)));
    const sum = w.reduce((x, y) => x + y, 0);
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      let v = 0;
      for (let q = -r, jj = 0; q <= r; q++, jj++) v += linear[(((i + q) % n) + n) % n] * w[jj];
      out[i] = v / sum;
    }
    return out;
  }

  function smoothed(p, sigma) {
    const n = p.length, r = Math.ceil(sigma * 3);
    const w = []; for (let q = -r; q <= r; q++) w.push(Math.exp(-(q * q) / (2 * sigma * sigma)));
    const sum = w.reduce((x, y) => x + y, 0);
    return p.map((_, i) => {
      let x = 0, y = 0;
      for (let q = -r, j = 0; q <= r; q++, j++) { const pt = p[(((i + q) % n) + n) % n]; x += pt.x * w[j]; y += pt.y * w[j]; }
      return P(x / sum, y / sum);
    });
  }

  function convexBand(pts, width) {
    const n = pts.length;
    let peak = 0; width.forEach((v, i) => { if (v > width[peak]) peak = i; });
    let lo = peak, hi = peak;
    while (width[(((lo - 1) % n) + n) % n] > -0.5 && hi - lo < n - 2) lo--;
    while (width[(hi + 1) % n] > -0.5 && hi - lo < n - 2) hi++;
    const run = []; for (let i = lo; i <= hi; i++) run.push(pts[((i % n) + n) % n]);
    const hull = [];
    for (const p of run) {
      while (hull.length >= 2) {
        const a = hull[hull.length - 2], b = hull[hull.length - 1];
        if ((b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x) < 0) hull.pop(); else break;
      }
      hull.push(p);
    }
    const lens = [0];
    for (let i = 1; i < hull.length; i++) lens.push(lens[i - 1] + Math.hypot(hull[i].x - hull[i - 1].x, hull[i].y - hull[i - 1].y));
    const total = lens[lens.length - 1];
    const out = pts.slice();
    let j = 0;
    for (let k = 0; k < run.length; k++) {
      const target = (total * k) / Math.max(1, run.length - 1);
      while (j + 1 < hull.length - 1 && lens[j + 1] < target) j++;
      const span = Math.max(1e-6, lens[j + 1] - lens[j]);
      const t = Math.min(1, Math.max(0, (target - lens[j]) / span));
      const a = hull[j], b = hull[j + 1];
      out[(((lo + k) % n) + n) % n] = P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    }
    return out;
  }

  const STEP = 0.5, FACE_N = 480;
  function computeFace(s) {
    const segs = segments(s);
    const fine = [], fineS = [];
    let acc = 0;
    for (const c of segs) {
      let prev = c[0];
      for (let i = 0; i < 240; i++) {
        const p = cubicPt(c, i / 240);
        acc += Math.hypot(p.x - prev.x, p.y - prev.y); prev = p;
        fine.push(p); fineS.push(acc);
      }
      acc += Math.hypot(c[3].x - prev.x, c[3].y - prev.y);
    }
    const total = acc;
    const arc = (at) => { const seg = Math.min(segs.length - 1, Math.floor(at)); return fineS[seg * 240 + Math.min(239, Math.floor((at - seg) * 240))]; };
    const widthKnots = s.band.width.map(([a, v]) => [arc(a), v]);
    const roundKnots = s.band.round.map(([a, v]) => [arc(a), v]);
    const count = Math.floor(total / STEP);
    const body = [];
    let j = 0;
    for (let k = 0; k < count; k++) {
      const target = (k * total) / count;
      while (j + 1 < fine.length && fineS[j + 1] < target) j++;
      body.push(fine[j]);
    }
    const n = body.length;
    const at = (arr, i) => arr[(((i % n) + n) % n)];
    const width = blurredProfile(widthKnots, total, n, 5);
    const round = blurredProfile(roundKnots, total, n, 5);
    const rounded = body.map((_, i) => {
      const sigma = Math.max(0.5, round[i]) / STEP, r = Math.ceil(sigma * 3);
      let x = 0, y = 0, sum = 0;
      for (let k = -r; k <= r; k++) { const w = Math.exp(-(k * k) / (2 * sigma * sigma)); const q = at(body, i + k); x += q.x * w; y += q.y * w; sum += w; }
      return P(x / sum, y / sum);
    });
    const pushed = rounded.map((p, i) => {
      const a = at(rounded, i - 2), b = at(rounded, i + 2);
      const tan = unit(P(b.x - a.x, b.y - a.y));
      return add(p, P(-tan.y, tan.x), width[i]);
    });
    const face = smoothed(s.band.oneWay ? convexBand(pushed, width) : pushed, 2 / STEP);
    // Resample to a fixed count so different bodies can be blended point by point.
    const L = [0];
    for (let i = 1; i <= face.length; i++) L.push(L[i - 1] + Math.hypot(face[i % face.length].x - face[i - 1].x, face[i % face.length].y - face[i - 1].y));
    const tot = L[L.length - 1], out = [];
    let q = 0;
    for (let k = 0; k < FACE_N; k++) {
      const target = (tot * k) / FACE_N;
      while (q + 1 < L.length - 1 && L[q + 1] < target) q++;
      const t = (target - L[q]) / Math.max(1e-6, L[q + 1] - L[q]);
      const a = face[q], b = face[(q + 1) % face.length];
      out.push(P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
    }
    return out;
  }

  const none = -1.5;
  function band(k = 1, shortSide = false) {
    const lower = shortSide ? [[0.5, 4.6], [0.85, 3.6], [1.5, 2.6], [2.0, 3.4]] : [[0.5, 5.4], [0.85, 7.0], [1.5, 8.0], [2.0, 8.0]];
    const upper = shortSide
      ? [[2.25, 4.6], [2.5, 5.4], [2.75, 5.8], [3.0, 5.6], [3.4, 4.2], [3.7, 2.2], [3.95, 0.4]]
      : [[2.25, 7.3], [2.5, 6.4], [2.75, 5.6], [3.0, 4.8], [3.5, 2.8], [3.85, 0.8]];
    return {
      width: [[8.4, none], [9.0, 1.2], [9.5, 2.8], [0.0, 4.0], ...lower, ...upper, [4.1, none], [5.0, none]],
      round: [[9.0, 1], [9.6, 2 * k], [0.6, 10 * k], [1.5, 15 * k], [2.3, 10 * k], [2.7, 2 * k], [3.0, 1], [5.0, 1]],
      oneWay: !shortSide,
    };
  }

  const BODIES = {
    clean: {
      left: { base: 50, shoulder: 38.3, shoulderY: 91, bulge: 1.5, corner: 16, cornerX: 24 },
      right: { base: 50, shoulder: 38.8, shoulderY: 91, bulge: 1.5, corner: 16, cornerX: 24 },
      humpL: P(-22.5, 107), humpR: P(23.5, 107), dip: P(0, 94.4), belly: 0.6, band: band(),
      eyes: { x: -3.5, y: 64, spacing: 30 },
    },
    tall: {
      left: { base: 50, shoulder: 41, shoulderY: 99, bulge: 1.2, corner: 17, cornerX: 26 },
      right: { base: 50, shoulder: 38.5, shoulderY: 100, bulge: 1.2, corner: 12, cornerX: 16 },
      humpL: P(-26, 117), humpR: P(23.5, 112.5), dip: P(0, 102.2), belly: 0.8, band: band(),
      eyes: { x: -5, y: 60.5, spacing: 36.5 },
    },
    flat: {
      left: { base: 50, shoulder: 38.5, shoulderY: 36, bulge: -2.5, corner: 14, cornerX: 17 },
      right: { base: 50, shoulder: 35.5, shoulderY: 34, bulge: -2.5, corner: 14, cornerX: 17 },
      humpL: P(-22, 50.8), humpR: P(20, 49.3), dip: P(-2, 41.5), belly: 0.5, band: band(0.5, true),
      eyes: { x: -2.5, y: 26, spacing: 34 },
    },
  };
  const GEO = {};
  for (const [name, s] of Object.entries(BODIES)) GEO[name] = { segs: segments(s), face: computeFace(s), eyes: s.eyes, H: Math.max(s.humpL.y, s.humpR.y) };

  // ---------- eyes (MiloRenderer.swift), local coords, y down ----------
  const f = (n) => n.toFixed(2);
  const ellipse = (rx, ry) => `M${f(-rx)} 0 A${f(rx)} ${f(ry)} 0 1 0 ${f(rx)} 0 A${f(rx)} ${f(ry)} 0 1 0 ${f(-rx)} 0Z`;
  const ease2 = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  function eyeShape(type, blink, happiness) {
    if (type === 'oval' && happiness > 0.001) {
      const h = Math.min(1, happiness), stroke = 2.5;
      if (h < 0.5) {
        const s = ease2(h / 0.5), rx = 3.3 + (7.6 + stroke / 2 - 3.3) * s, open = 5.1 * Math.max(0.08, 1 - blink);
        return { d: ellipse(rx, open + (stroke / 2 - open) * s), stroke: 0 };
      }
      const k = ease2((h - 0.5) / 0.5);
      return { d: `M-7.6 ${f(3 * k)} C-7.4 ${f(-5.8 * k)} 7.4 ${f(-5.8 * k)} 7.6 ${f(3 * k)}`, stroke: 2.5 };
    }
    switch (type) {
      case 'happy': return { d: 'M-7.6 3 C-7.4 -5.8 7.4 -5.8 7.6 3', stroke: 2.5 };
      case 'sleep': return { d: 'M-6.6 -0.9 C-3.3 2.9 3.3 2.9 6.6 -0.9', stroke: 2.2 };
      case 'dash': return { d: 'M-3.3 -1.7 H3.3 A1.7 1.7 0 0 1 3.3 1.7 H-3.3 A1.7 1.7 0 0 1 -3.3 -1.7Z', stroke: 0 };
      case 'sad': return { d: 'M6.2 -4.2 C6.6 -0.6 3.4 4.6 -2.2 4.7 C-5.4 4.8 -7.3 3.4 -6.9 1.4 C-6.5 -0.4 -4.2 -0.4 -2 -0.9 C0.6 -1.6 2.4 -2.9 3.9 -4.9 A1.25 1.25 0 0 1 6.2 -4.2Z', stroke: 0, scale: 1.18 };
      case 'heart': return { d: 'M0 5.2 C-0.5 5.2 -1.2 4.8 -1.8 4.3 C-4.2 2.4 -7.2 0.2 -7.2 -2.8 C-7.2 -5.4 -5.2 -6.8 -3.4 -6.8 C-1.9 -6.8 -0.8 -6 -0.3 -5 Q0 -4.5 0.3 -5 C0.8 -6 1.9 -6.8 3.4 -6.8 C5.2 -6.8 7.2 -5.4 7.2 -2.8 C7.2 0.2 4.2 2.4 1.8 4.3 C1.2 4.8 0.5 5.2 0 5.2Z', stroke: 0, scale: 1.4 };
      default: return { d: ellipse(3.3, 5.1 * Math.max(0.08, 1 - blink)), stroke: 0 };
    }
  }

  // ---------- Material-style backdrop shapes, normalised to equal area ----------
  const polar = (n, k) => (t) => { const r = (1 + k * Math.cos(n * t)) / (1 + k); return [r * Math.cos(t), r * Math.sin(t)]; };
  const SHAPES = {
    squircle: (t) => { const c = Math.cos(t), s = Math.sin(t), e = 2 / 4.2; return [Math.sign(c) * Math.abs(c) ** e, Math.sign(s) * Math.abs(s) ** e]; },
    cookie4: polar(4, 0.07), cookie6: polar(6, 0.07), cookie9: polar(9, 0.055), cookie12: polar(12, 0.045),
    sunny: polar(8, 0.09), clover4: polar(4, 0.2), flower: polar(8, 0.16),
  };
  const RAW = {};
  for (const [k, f] of Object.entries(SHAPES)) {
    const pts = []; for (let i = 0; i < 180; i++) pts.push(f((i / 180) * Math.PI * 2 - Math.PI / 2));
    let a = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; });
    RAW[k] = { pts, area: Math.abs(a) / 2 };
  }
  const minArea = Math.min(...Object.values(RAW).map((r) => r.area));
  // Unit-radius outline of a shape, scaled so every shape covers the same area.
  function shapePoints(name) { const r = RAW[name], s = Math.sqrt(minArea / r.area); return r.pts.map(([x, y]) => [x * s, y * s]); }

  // ---------- tweening ----------
  const E = {
    linear: (t) => t,
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  };
  function tween(obj, to, ms, ease = E.inOut) {
    const from = {}; for (const k in to) from[k] = obj[k];
    const start = performance.now();
    const token = {};
    obj._tw = obj._tw || {};
    for (const k in to) obj._tw[k] = token;
    return new Promise((res) => {
      function tick(now) {
        const t = Math.min(1, (now - start) / ms), e = ease(t);
        for (const k in to) if (obj._tw[k] === token) obj[k] = from[k] + (to[k] - from[k]) * e;
        if (t < 1) requestAnimationFrame(tick); else res();
      }
      requestAnimationFrame(tick);
    });
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- the character ----------
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const all = new Set();
  let pointer = null;
  addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY, t: performance.now() }; });

  class Milo {
    constructor(host, o = {}) {
      this.body = o.body || 'clean';
      this.from = this.body; this.blend = 1;
      this.mood = o.mood || 'green';
      this.eyes = o.eyes || 'oval';
      this.squash = 1; this.lean = 0; this.lift = 0; this.sx = 1; this.rot = 0; this.dx = 0;
      this.lookX = 0; this.lookY = 0; this.blink = 0; this.happiness = o.happy ? 1 : 0;
      this.shadow = o.shadow ?? 1; this.eyeScale = o.eyeScale || 1; this.shake = 0;
      this.idle = o.idle ?? true; this.follow = o.follow ?? true; this.breathe = o.breathe ?? 1;
      this.lookAt = null; // {x,y} in units relative to eye centre, overrides pointer
      this.wide = o.wide || 0; // extra canvas width either side, in units (for stretching)

      const w = 170 + this.wide * 2;
      this.svg = el('svg', { viewBox: `${-this.wide} 0 ${w} 160`, class: 'milo', 'aria-hidden': 'true' });
      if (o.size) this.svg.style.width = (o.size * w) / 100 + 'px';
      if (o.backdrop) {
        this.bdScale = 1;
        this.gBack = el('g', {}, this.svg);
        this.gBackScale = el('g', {}, this.gBack);
        this.bdR = (o.backdrop.size || 165) / 2;
        this.bdPts = shapePoints(o.backdrop.shape);
        this.pBack = el('path', { class: 'milo-backdrop' }, this.gBackScale);
        this.drawBackdrop(this.bdPts);
        this.pBack.style.fill = o.backdrop.color;
      }
      // Line backdrops up across bodies: shift the drawing so every backdrop centre sits at the same height.
      if (o.backdrop && o.size) { const H = GEO[this.body].H; this.svg.style.translate = `0 ${f(-(53.5 - H / 2) * o.size / 100)}px`; }
      this.gShadow = el('ellipse', { fill: 'rgb(70,62,44)', 'fill-opacity': 0.17 }, this.svg);
      this.gRot = el('g', {}, this.svg);
      this.gBody = el('g', {}, this.gRot);
      const id = 'm' + Math.random().toString(36).slice(2, 8);
      const clip = el('clipPath', { id }, el('defs', {}, this.svg));
      this.clipPath = el('path', {}, clip);
      this.pBody = el('path', {}, this.gBody);
      this.pFace = el('path', { 'clip-path': `url(#${id})` }, this.gBody);
      this.gEyes = el('g', {}, this.gRot);
      this.blush = [el('ellipse', { rx: 6.6, ry: 2.6, fill: BLUSH, opacity: 0 }, this.gEyes), el('ellipse', { rx: 6.6, ry: 2.6, fill: BLUSH, opacity: 0 }, this.gEyes)];
      this.eyeEls = [el('path', {}, this.gEyes), el('path', {}, this.gEyes)];
      this.setMood(this.mood, true);
      this.buildPaths();
      host.appendChild(this.svg);
      this.nextBlink = performance.now() + 800 + Math.random() * 3000;
      this.nextGlance = performance.now() + 3000 + Math.random() * 4000;
      this.glance = { x: 0, y: 0 };
      this.lx = 0; this.ly = 0;
      all.add(this);
    }

    setMood(m, instant) {
      this.mood = m;
      const [b, s] = MOODS[m];
      for (const p of [this.pBody, this.pFace]) p.style.transition = instant ? 'none' : 'fill 600ms ease';
      this.pBody.setAttribute('fill', s);
      this.pFace.setAttribute('fill', b);
    }
    setEyes(e) { this.eyes = e; }
    setBackdrop(color) { if (this.pBack) this.pBack.style.fill = color; }
    drawBackdrop(pts) { const R = this.bdR; this.pBack.setAttribute('d', 'M' + pts.map(([x, y]) => `${f(x * R)} ${f(y * R)}`).join(' L') + 'Z'); }
    // M3 Expressive shape morph: every shape has the same point count and angles, so points blend one to one.
    async morphBackdrop(name, ms = 650, color) {
      if (!this.pBack) return;
      if (color) this.setBackdrop(color);
      const from = this.bdPts, to = shapePoints(name), st = { t: 0 };
      const tk = this._morphTok = {};
      const run = tween(st, { t: 1 }, ms, E.back);
      const step = () => { if (this._morphTok !== tk) return; const k = st.t; this.drawBackdrop(from.map(([x, y], i) => [x + (to[i][0] - x) * k, y + (to[i][1] - y) * k])); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
      await run; if (this._morphTok === tk) { this.bdPts = to; this.drawBackdrop(to); }
    }

    async morphTo(body, ms = 600, ease = E.inOut) {
      this.from = this.blend < 1 ? this.snapshot() : (this.to || this.body);
      this.to = body; this.blend = 0;
      await tween(this, { blend: 1 }, ms, ease);
      if (this.to === body) { this.body = body; this.from = body; this.to = null; }
    }

    snapshot() {
      const g = this.geo();
      return { segs: g.segs.map((c) => c.map((p) => P(p.x, p.y))), face: g.face.map((p) => P(p.x, p.y)), eyes: { ...g.eyes }, H: g.H };
    }

    geo() {
      const B = GEO[this.to || this.body];
      if (this.blend >= 1) return B;
      const A = typeof this.from === 'string' ? GEO[this.from] : this.from;
      const t = this.blend, l = (a, b) => a + (b - a) * t, lp = (a, b) => P(l(a.x, b.x), l(a.y, b.y));
      return {
        segs: A.segs.map((c, i) => c.map((p, j) => lp(p, B.segs[i][j]))),
        face: A.face.map((p, i) => lp(p, B.face[i])),
        eyes: { x: l(A.eyes.x, B.eyes.x), y: l(A.eyes.y, B.eyes.y), spacing: l(A.eyes.spacing, B.eyes.spacing) },
        H: l(A.H, B.H),
      };
    }

    buildPaths() {
      const g = this.geo();
      this._g = g;
      const m = (p) => `${f(GX + p.x)} ${f(GY - p.y)}`;
      let d = `M${m(g.segs[0][0])}`;
      for (const c of g.segs) d += ` C${m(c[1])} ${m(c[2])} ${m(c[3])}`;
      d += 'Z';
      this.pBody.setAttribute('d', d);
      this.clipPath.setAttribute('d', d);
      const pts = g.face, n = pts.length;
      const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
      let fd = `M${m(mid(pts[n - 1], pts[0]))}`;
      for (let i = 0; i < n; i++) fd += ` Q${m(pts[i])} ${m(mid(pts[i], pts[(i + 1) % n]))}`;
      this.pFace.setAttribute('d', fd + 'Z');
      if (this.gBack) this.gBack.setAttribute('transform', `translate(${GX} ${f(GY - g.H / 2)})`);
      this._builtBlend = this.blend; this._builtBody = this.to || this.body;
    }

    async hop(n = 1, height = 18) {
      if (!this.silent) window.Sfx?.milo('squeak');
      for (let i = 0; i < n; i++) {
        await tween(this, { squash: 0.86 }, 90, E.out);
        await tween(this, { squash: 1.08, lift: height }, 200, E.out);
        await tween(this, { squash: 1.05, lift: 0 }, 170, E.in);
        await tween(this, { squash: 0.89 }, 70, E.out);
        await tween(this, { squash: 1 }, 380, E.back);
      }
    }
    async beHappy(ms = 1600) {
      if (!this.silent) window.Sfx?.milo('happy'); await tween(this, { happiness: 1 }, 160); await wait(ms); await tween(this, { happiness: 0 }, 160); }

    frame(now) {
      if (this.onFrame) this.onFrame(now);
      if (this.blend < 1 || this._builtBlend !== this.blend || this._builtBody !== (this.to || this.body)) this.buildPaths();
      const g = this._g;
      // idle: breathing, blinking, glancing
      let sq = this.squash;
      if (this.idle) sq *= 1 + 0.012 * this.breathe * Math.sin((now / 3800) * Math.PI * 2);
      if (this.idle && now > this.nextBlink && this.eyes === 'oval') {
        this.nextBlink = now + 2500 + Math.random() * 4000;
        const dbl = Math.random() < 0.22;
        (async () => {
          for (let i = 0; i < (dbl ? 2 : 1); i++) { await tween(this, { blink: 1 }, 70, E.in); await wait(30); await tween(this, { blink: 0 }, 100, E.out); if (dbl) await wait(160); }
        })();
      }
      let tx = 0, ty = 0;
      if (this.lookAt) { tx = this.lookAt.x; ty = this.lookAt.y; }
      else if (this.follow && pointer && now - pointer.t < 6000) {
        const r = this.svg.getBoundingClientRect();
        const ppu = r.width / (170 + this.wide * 2);
        const ex = r.left + (this.wide + GX + g.eyes.x) * ppu, ey = r.top + (GY - g.eyes.y * this.squash - this.lift) * ppu;
        const vx = pointer.x - ex, vy = pointer.y - ey, dist = Math.hypot(vx, vy) || 1;
        const k = Math.min(1, dist / (90 * ppu));
        tx = (vx / dist) * 3.4 * k; ty = (vy / dist) * 2.6 * k;
        if (this.rot) { const a = (-this.rot * Math.PI) / 180; [tx, ty] = [tx * Math.cos(a) - ty * Math.sin(a), tx * Math.sin(a) + ty * Math.cos(a)]; }
      } else if (this.idle) {
        if (now > this.nextGlance) {
          this.nextGlance = now + 4000 + Math.random() * 5000;
          this.glance = Math.random() < 0.55 ? { x: (Math.random() < 0.5 ? -1 : 1) * 3.2, y: (Math.random() - 0.6) * 1.5 } : { x: 0, y: 0 };
        }
        tx = this.glance.x; ty = this.glance.y;
      }
      this.lx += (tx - this.lx) * 0.12; this.ly += (ty - this.ly) * 0.12;
      const lookX = this.lookX + this.lx, lookY = this.lookY + this.ly;

      const ws = (1 / Math.sqrt(sq)) * this.sx, H = g.H;
      const shake = this.shake ? Math.sin(now / 28) * this.shake : 0;
      const lean = this.lean + shake * 0.6;
      const e = GX - GX * ws + (lean * GY) / H + this.dx + shake;
      const ff = GY - this.lift - GY * sq;
      this.gBody.setAttribute('transform', `matrix(${f(ws)} 0 ${f(-lean / H)} ${f(sq)} ${f(e)} ${f(ff)})`);
      this.gRot.setAttribute('transform', this.rot ? `rotate(${f(this.rot)} ${GX + this.dx} ${f(GY - this.lift - (H * sq) / 2)})` : '');

      if (this.gBackScale) this.gBackScale.setAttribute('transform', `scale(${f(this.bdScale)})`);
      const air = Math.min(1, this.lift / 40), kk = 1 - 0.35 * air;
      this.gShadow.setAttribute('cx', GX + this.dx); this.gShadow.setAttribute('cy', GY - 4);
      this.gShadow.setAttribute('rx', f(53.5 * ws * kk)); this.gShadow.setAttribute('ry', f(6.5 * kk));
      this.gShadow.setAttribute('opacity', f(this.shadow * (1 - 0.5 * air)));

      const cx = g.eyes.x * ws + lean * (g.eyes.y / H) + this.dx + shake, cy = g.eyes.y * sq;
      const ex = GX + cx + lookX, ey = GY - cy - this.lift + lookY;
      const spacing = g.eyes.spacing * (1 / Math.sqrt(sq));
      const sh = eyeShape(this.eyes, this.blink, this.happiness);
      const s = this.eyeScale * (sh.scale || 1);
      const heart = this.eyes === 'heart';
      [-1, 1].forEach((sd, i) => {
        const p = this.eyeEls[i];
        p.setAttribute('d', sh.d);
        p.setAttribute('transform', `translate(${f(ex + (sd * spacing) / 2)} ${f(ey)}) scale(${f(sd === -1 ? s : -s)} ${f(s)})`);
        if (sh.stroke) { p.setAttribute('fill', 'none'); p.setAttribute('stroke', INK); p.setAttribute('stroke-width', sh.stroke); p.setAttribute('stroke-linecap', 'round'); }
        else { p.setAttribute('fill', heart ? HEART : INK); p.removeAttribute('stroke'); }
        const b = this.blush[i];
        b.setAttribute('cx', f(ex + (sd * spacing) / 2)); b.setAttribute('cy', f(ey + 13.5));
        b.setAttribute('opacity', heart ? 0.9 : 0);
      });
    }

    destroy() { all.delete(this); this.svg.remove(); }
  }

  function loop(now) {
    for (const m of all) {
      if (!m.svg.isConnected) continue;
      const slide = m.svg.closest('.slide');
      if (slide && !slide.classList.contains('active') && !slide.classList.contains('leaving')) continue;
      m.frame(now);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.Milo = Milo;
  window.MiloKit = { tween, wait, E, MOODS, shapePoints };
})();
