// Aha grain shapes, approved by Manan on 2026-10-29. Source of truth: dna/grain/GRAIN-GUIDE.md + grain-study.html.
// The grain() and spinner() code below is copied from the study unchanged; only make() at the bottom is new.
// Two tones from one family, blended only by ~1.5px coloured dots, lit from the top left, lines inside every shape.
(() => {
  let DPR = 2, CELL = 3;   // make(..., { lite }) drops to 1x with 2px cells for big moving shapes
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // Shape outlines in a unit box (0..1).
  const SHAPES = {
    pentagon(c, s) {
      c.beginPath();
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; c.lineTo(s * (0.5 + 0.48 * Math.cos(a)), s * (0.54 + 0.48 * Math.sin(a))); }
      c.closePath(); c.lineJoin = 'round'; c.lineWidth = s * 0.08; c.stroke(); c.fill();
    },
    diamond(c, s) {
      c.save(); c.translate(s / 2, s / 2); c.rotate(Math.PI / 4);
      const k = s * 0.6; c.beginPath(); c.roundRect(-k / 2, -k / 2, k, k, s * 0.04); c.fill(); c.restore();
    },
    cookie(c, s) {
      c.beginPath();
      for (let i = 0; i <= 360; i++) { const a = i * Math.PI / 180, r = s * 0.44 * (1 + 0.07 * Math.cos(9 * a)); c.lineTo(s / 2 + r * Math.cos(a), s / 2 + r * Math.sin(a)); }
      c.fill();
    },
    square(c, s) { c.fillRect(0, 0, s, s); },
    leaf(c, s) {
      c.beginPath(); c.moveTo(s * 0.12, s * 0.88);
      c.bezierCurveTo(s * 0.05, s * 0.35, s * 0.4, s * 0.08, s * 0.9, s * 0.1);
      c.bezierCurveTo(s * 0.92, s * 0.6, s * 0.62, s * 0.95, s * 0.12, s * 0.88); c.fill();
    },
  };
  // The lines are drawn by hand (Manan, 2026-10-29: "a little not perfect, a little scribbly"):
  // a steady hand, not a shaky one. Each line wanders slowly off its path, presses harder in the
  // middle and lifts at the ends, runs a touch past where it should stop, and one line per shape is
  // gone over twice. `j` nudges the wobble a little on every boil, so the lines redraw like hand
  // animation instead of sitting there perfect.
  const wob = (t, sd) => Math.sin(t * 2.1 + sd) * 0.6 + Math.sin(t * 5.3 + sd * 1.7) * 0.4;
  const lerp = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
  const quad = (p, m, q, u) => lerp(lerp(p, m, u), lerp(m, q, u), u);
  /** One pen stroke along fn(u), u 0..1, as a filled ribbon. */
  function hand(c, fn, w, sd, { from = 0, to = 1, amp = w * 0.9, waves = 6, over = 0.035, n = 64 } = {}) {
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(fn(from - over + (to - from + 2 * over) * i / n));
    const A = [], B = [];
    for (let i = 0; i <= n; i++) {
      const p = pts[i], q = pts[Math.min(n, i + 1)], o = pts[Math.max(0, i - 1)];
      let tx = q[0] - o[0], ty = q[1] - o[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const t = i / n, off = amp * wob(t * waves, sd);
      const hw = w * 0.5 * (0.4 + 0.6 * Math.sqrt(Math.sin(Math.PI * t))) * (1 + 0.15 * wob(t * 11, sd + 3));
      const x = p[0] - ty * off, y = p[1] + tx * off;
      A.push([x - ty * hw, y + tx * hw]); B.push([x + ty * hw, y - tx * hw]);
    }
    c.beginPath(); A.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    for (let i = n; i >= 0; i--) c.lineTo(B[i][0], B[i][1]);
    c.closePath(); c.fill();
  }
  /** The sun's arcs: on the shadow side, following his scallops (turned by a). */
  const sunArc = (s, k, a = 0) => u => { const g = (-10 + 110 * u) * Math.PI / 180, r = s * 0.44 * k * (1 + 0.07 * Math.cos(9 * (g - a))); return [s / 2 + r * Math.cos(g), s / 2 + r * Math.sin(g)]; };
  function sunLines(c, s, a, j) {
    // His scallops already wave, so the hand is gentler here.
    const o = { amp: s * 0.004, waves: 3 };
    hand(c, sunArc(s, 0.62, a), s * 0.012, 1 + j, o);
    hand(c, sunArc(s, 0.8, a), s * 0.012, 4 + j, o);
    hand(c, sunArc(s, 0.815, a), s * 0.006, 9 + j, { ...o, from: 0.15, to: 0.6 }); // gone over twice
  }
  // Thin lines in the deep tone, like the pentagon reference.
  const LINES = {
    pentagon(c, s, j) {
      const arc = r => u => { const a = Math.PI + u * Math.PI / 2; return [s * 0.95 + s * r * Math.cos(a), s * 0.95 + s * r * Math.sin(a)]; };
      [0.3, 0.5, 0.72].forEach((r, i) => hand(c, arc(r), s * 0.011, 2 + i * 3 + j));
      hand(c, arc(0.735), s * 0.006, 13 + j, { from: 0.2, to: 0.75 });
    },
    diamond(c, s, j) {
      // Two lines running parallel to the top right edge.
      for (const [i, d] of [0.09, 0.17].entries()) {
        const p = [s * (0.5 - d + 0.05), s * (0.08 + d + 0.05)], q = [s * (0.92 - d - 0.05), s * (0.5 + d - 0.05)];
        hand(c, u => lerp(p, q, u), s * 0.014, 5 + i * 4 + j, { amp: s * 0.004, waves: 3 });
      }
    },
    cookie(c, s, j) { sunLines(c, s, 0, j); },
    leaf(c, s, j) {
      hand(c, u => quad([s * 0.12, s * 0.88], [s * 0.45, s * 0.5], [s * 0.82, s * 0.2], u), s * 0.013, 3 + j, { waves: 4 });
      hand(c, u => quad([s * 0.14, s * 0.85], [s * 0.44, s * 0.52], [s * 0.7, s * 0.3], u), s * 0.006, 8 + j, { waves: 4, from: 0.1, to: 0.55 });
      [[0.3, 0.68, 0.52, 0.66], [0.42, 0.55, 0.66, 0.5], [0.55, 0.42, 0.78, 0.34], [0.3, 0.68, 0.24, 0.48], [0.42, 0.55, 0.36, 0.34], [0.55, 0.42, 0.52, 0.22]].forEach(([x, y, ex, ey], i) =>
        hand(c, u => quad([s * x, s * y], [s * (x + ex) / 2 + s * 0.02, s * (y + ey) / 2 + s * 0.02], [s * ex, s * ey], u), s * 0.009, 11 + i * 2.3 + j, { waves: 1.5, amp: s * 0.004, over: 0.06 }));
    },
  };

  /** Paints a shape whose two tones are blended only by grain: flat light tone, deepening toward the bottom right. */
  function grain(size, shape, light, deep, { from = 0.22, lines = true, linesLight = false } = {}) {
    const px = size * DPR, L = hex(light), D = hex(deep);
    const mk = () => { const cv = document.createElement('canvas'); cv.width = cv.height = px; return cv; };
    const mask = mk(), mc = mask.getContext('2d');
    mc.filter = `blur(${DPR * 0.5}px)`; mc.fillStyle = mc.strokeStyle = '#000'; SHAPES[shape](mc, px);
    const lm = mk(), lc = lm.getContext('2d'); lc.fillStyle = '#000';
    if (lines && LINES[shape]) LINES[shape](lc, px, rand() * 0.5);
    const m = mc.getImageData(0, 0, px, px).data, ld = lc.getImageData(0, 0, px, px).data;
    const out = mk(), oc = out.getContext('2d'), img = oc.createImageData(px, px), o = img.data;
    const cells = Math.ceil(px / CELL), n1 = new Float32Array(cells * cells), n2 = new Float32Array(cells * cells);
    for (let i = 0; i < n1.length; i++) { n1[i] = rand(); n2[i] = rand(); }
    for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
      const i = (y * px + x) * 4, a = m[i + 3] / 255;
      if (!a) continue;
      const ci = ((y / CELL) | 0) * cells + ((x / CELL) | 0), r = n1[ci];
      if (a < 1 && a < n2[ci]) continue; // grainy edge
      const t = (x / px) * 0.45 + (y / px) * 0.55;
      let s = smooth(from, 1.0, t);
      const amp = 0.08 + 2.6 * s * (1 - s);
      let v = Math.min(1, Math.max(0, s + (r - 0.5) * amp));
      const line = ld[i + 3] / 255;
      if (line && !linesLight) v = Math.min(1, v + 0.75 * line * (r * 0.5 + 0.5));
      const w = line && linesLight ? 0.45 * line * (r * 0.5 + 0.5) : 0; // light lines lift toward cream
      for (let k = 0; k < 3; k++) { const c = L[k] + (D[k] - L[k]) * v; o[i + k] = c + (253 - c) * w; }
      o[i + 3] = 255;
    }
    oc.putImageData(img, 0, 0);
    return out;
  }

  const BOILS = 3;
  /**
   * The sun turning on its own axis while the light stays where it is (top left): the shading is
   * painted once on a square, each frame the turned outline is cut out of it, and its arcs are
   * drawn where they belong.
   */
  function spinner(size, [, light, deep]) {
    const px = size * DPR;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = cv.height = px; return cv; };
    const shade = Array.from({ length: BOILS }, () => grain(size, 'square', light, deep, { lines: false }));
    const edge = grain(size, 'cookie', '#000000', '#000000', { lines: false });
    // The rings are the earlier arcs on the shadow side (bottom right). They stay there while the
    // scallops turn through them, and they're broken up by grain like the rest of him.
    const dots = mk(), dc = dots.getContext('2d'), img = dc.createImageData(px, px);
    for (let y = 0; y < px; y += CELL) for (let x = 0; x < px; x += CELL) {
      const al = 255 * (0.7 + 0.3 * rand());
      for (let j = 0; j < CELL && y + j < px; j++) for (let i = 0; i < CELL && x + i < px; i++) img.data[((y + j) * px + x + i) * 4 + 3] = al;
    }
    dc.putImageData(img, 0, 0);
    const tmp = mk(), tc = tmp.getContext('2d');
    const turned = (c, src, a) => { c.save(); c.translate(px / 2, px / 2); c.rotate(a); c.drawImage(src, -px / 2, -px / 2); c.restore(); };
    return (c, a, b) => {
      tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, px, px);
      tc.fillStyle = deep; sunLines(tc, px, a, b * 0.25);
      tc.globalCompositeOperation = 'destination-in'; tc.drawImage(dots, 0, 0);
      c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, px, px); c.drawImage(shade[b], 0, 0);
      c.drawImage(tmp, 0, 0);
      c.globalCompositeOperation = 'destination-in'; turned(c, edge, a);
      c.globalCompositeOperation = 'source-over';
    };
  }
  // ---------- for the deck ----------
  // Any shape turning on its own axis with the light fixed, the way spinner() turns the sun: the shading is painted
  // once on a square, the turned outline is cut out of it each frame, and the lines stay on the shadow side.
  function turner(size, shape, light, deep, { linesLight = false } = {}) {
    // the canvas is a quarter bigger than the shape, so its points never leave it at any angle
    const px = size * DPR, big = Math.round(size * 1.25), PX = big * DPR, off = (PX - px) / 2;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = cv.height = PX; return cv; };
    const shade = Array.from({ length: BOILS }, () => grain(big, 'square', light, deep, { lines: false }));
    const edge = grain(size, shape, '#000000', '#000000', { lines: false });
    const ink = linesLight ? 'rgba(253, 251, 247, 0.6)' : deep;
    // hand-drawn lines, a slightly different pass on each boil frame (the shape moves, so its lines redraw)
    const lineFrames = Array.from({ length: BOILS }, (_, b) => { const l = mk(), x = l.getContext('2d'); x.fillStyle = ink; x.save(); x.translate(off, off); LINES[shape](x, px, b * 0.25); x.restore(); return l; });
    const lines = lineFrames[0], lc = lines.getContext('2d');
    const dots = mk(), dc = dots.getContext('2d'), img = dc.createImageData(PX, PX);
    for (let y = 0; y < PX; y += CELL) for (let x = 0; x < PX; x += CELL) {
      const al = 255 * (0.7 + 0.3 * rand());
      for (let j = 0; j < CELL && y + j < PX; j++) for (let i = 0; i < CELL && x + i < PX; i++) img.data[((y + j) * PX + x + i) * 4 + 3] = al;
    }
    dc.putImageData(img, 0, 0);
    lineFrames.forEach((l) => { const x = l.getContext('2d'); x.globalCompositeOperation = 'destination-in'; x.drawImage(dots, 0, 0); });
    // The diamond's lines are tracks set in from its edge that bend round its corners; as it turns one way,
    // the lines slide along their tracks the other way.
    let track = null;
    if (shape === 'diamond') {
      const half = px * 0.3, P = (h, r) => 8 * (h - r) + 2 * Math.PI * r;
      // a point u along a rounded square (half-size h, corner r), starting at the top-right corner's end, clockwise
      const at = (h, r, u) => {
        const e = 2 * (h - r), q = (Math.PI * r) / 2, side = e + q;
        u = ((u % (4 * side)) + 4 * side) % (4 * side);
        const k = Math.floor(u / side), v = u - k * side;
        let x, y;
        if (v < e) { x = h; y = -h + r + v; }
        else { const t = (v - e) / r; x = h - r + r * Math.cos(t); y = h - r + r * Math.sin(t); }
        for (let i = 0; i < k; i++) [x, y] = [-y, x];   // each quarter is the last one turned 90 degrees
        return [x, y];
      };
      const TRACKS = [{ h: half - px * 0.06, r: px * 0.07, len: 0.32 }, { h: half - px * 0.12, r: px * 0.04, len: 0.26 }];
      track = (a, b) => {
        lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, PX, PX);
        lc.save(); lc.translate(PX / 2, PX / 2); lc.rotate(Math.PI / 4 + a);
        lc.fillStyle = 'rgba(253, 251, 247, 0.6)';
        TRACKS.forEach(({ h, r, len }, i) => {
          const per = P(h, r), start = per * (0.86 + i * 0.03) - (a / (2 * Math.PI)) * per * 1.6;   // slides against the turn
          hand(lc, (u) => at(h, r, start + u * per * len), px * 0.014, 5 + i * 4 + b * 0.25, { amp: px * 0.004, waves: 3, n: 96 });
        });
        // gone over twice: a shorter, thinner pass on the outer track
        { const { h, r, len } = TRACKS[0], per = P(h, r), start = per * 0.86 - (a / (2 * Math.PI)) * per * 1.6;
          hand(lc, (u) => at(h, r, start + u * per * len), px * 0.007, 11 + b * 0.25, { amp: px * 0.004, waves: 3, from: 0.2, to: 0.65, n: 64 }); }
        lc.restore();
        lc.globalCompositeOperation = 'destination-in'; lc.drawImage(dots, 0, 0);
      };
    }
    // when the lines don't move, shading and lines are merged once per boil frame, so a frame is two draws, not three
    const merged = track ? null : shade.map((sh, b) => { const m = mk(), x = m.getContext('2d'); x.drawImage(sh, 0, 0); x.drawImage(lineFrames[b], 0, 0); return m; });
    const draw = (c, a, b) => {
      if (track) track(a, b);
      c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, PX, PX);
      if (merged) c.drawImage(merged[b], 0, 0); else { c.drawImage(shade[b], 0, 0); c.drawImage(lines, 0, 0); }
      c.globalCompositeOperation = 'destination-in';
      c.save(); c.translate(PX / 2, PX / 2); c.rotate(a); c.drawImage(edge, -px / 2, -px / 2); c.restore();
      c.globalCompositeOperation = 'source-over';
    };
    draw.big = big;
    return draw;
  }
  // A new form for the deck's people: a disc, with two arcs from the bottom right running through it.
  SHAPES.disc = (c, s) => { c.beginPath(); c.arc(s / 2, s / 2, s * 0.46, 0, 2 * Math.PI); c.fill(); };
  // arcs from a corner, like the pentagon's, drawn by hand
  const cornerArc = (s, cx, cy, r) => (u) => { const a = Math.PI + u * Math.PI / 2; return [s * cx + s * r * Math.cos(a), s * cy + s * r * Math.sin(a)]; };
  const seg = (s, x1, y1, x2, y2) => (u) => lerp([s * x1, s * y1], [s * x2, s * y2], u);
  // a rounded rectangle's outline as a path u 0..1 (for lines that follow a box)
  const box = (s, x, y, w, h) => (u) => { const P = 2 * (w + h), d = u * P; if (d < w) return [s * (x + d), s * y]; if (d < w + h) return [s * (x + w), s * (y + d - w)]; if (d < 2 * w + h) return [s * (x + w - (d - w - h)), s * (y + h)]; return [s * x, s * (y + h - (d - 2 * w - h))]; };
  // steady hand: these are short straight strokes, so they wander only about a pixel off their path
  LINES.disc = (c, s, j = 0) => {
    [0.34, 0.56].forEach((r, i) => hand(c, cornerArc(s, 0.96, 0.96, r), s * 0.014, 2 + i * 3 + j, { amp: s * 0.004, waves: 3 }));
    hand(c, cornerArc(s, 0.96, 0.96, 0.575), s * 0.007, 9 + j, { amp: s * 0.004, from: 0.2, to: 0.7, waves: 3 });
  };
  const rr = (c, s, x, y, w, h, r) => { c.beginPath(); c.roundRect(s * x, s * y, s * w, s * h, s * r); };
  SHAPES.screen = (c, s) => { rr(c, s, 0.05, 0.17, 0.9, 0.62, 0.07); c.fill(); };
  LINES.screen = (c, s, j = 0) => {
    const tri = [[0.44, 0.33], [0.44, 0.55], [0.62, 0.44], [0.44, 0.33]];
    hand(c, (u) => { u = Math.min(1, Math.max(0, u)); const k = Math.min(2, Math.floor(u * 3)), t = u * 3 - k; return lerp([s * tri[k][0], s * tri[k][1]], [s * tri[k + 1][0], s * tri[k + 1][1]], t); }, s * 0.014, 2 + j, { amp: s * 0.004, waves: 3, n: 96 });   // play
    hand(c, seg(s, 0.13, 0.69, 0.87, 0.69), s * 0.012, 5 + j, { amp: s * 0.004, waves: 4 });       // timeline
    hand(c, seg(s, 0.13, 0.69, 0.55, 0.69), s * 0.006, 8 + j, { amp: s * 0.004, from: 0.1, to: 0.9 });   // gone over twice
    hand(c, seg(s, 0.4, 0.63, 0.4, 0.75), s * 0.016, 11 + j, { amp: s * 0.004, waves: 2 });        // playhead
  };
  SHAPES.slide = (c, s) => { rr(c, s, 0.07, 0.2, 0.86, 0.58, 0.05); c.fill(); };
  LINES.slide = (c, s, j = 0) => {
    hand(c, seg(s, 0.17, 0.33, 0.56, 0.33), s * 0.03, 2 + j, { amp: s * 0.004, waves: 3 });        // title
    hand(c, seg(s, 0.17, 0.335, 0.45, 0.335), s * 0.012, 6 + j, { amp: s * 0.004, from: 0.1, to: 0.8 });   // gone over twice
    [0.47, 0.57, 0.67].forEach((y, i) => {
      hand(c, seg(s, 0.185, y, 0.2, y), s * 0.028, 9 + i + j, { amp: s * 0.004, waves: 1, over: 0.2 });          // bullet
      hand(c, seg(s, 0.25, y, 0.7 - (y - 0.47), y), s * 0.012, 13 + i * 2 + j, { amp: s * 0.004, waves: 3 });
    });
  };
  SHAPES.browser = (c, s) => { rr(c, s, 0.06, 0.13, 0.88, 0.74, 0.06); c.fill(); };
  LINES.browser = (c, s, j = 0) => {
    hand(c, seg(s, 0.06, 0.26, 0.94, 0.26), s * 0.012, 2 + j, { amp: s * 0.004, waves: 4 });       // address bar
    [0.13, 0.19, 0.25].forEach((x, i) => hand(c, (u) => [s * x + s * 0.018 * Math.cos(u * 2 * Math.PI), s * 0.195 + s * 0.018 * Math.sin(u * 2 * Math.PI)], s * 0.01, 4 + i + j, { amp: s * 0.004, waves: 1, over: 0.1 }));
    hand(c, box(s, 0.14, 0.35, 0.72, 0.18), s * 0.012, 8 + j, { amp: s * 0.004, waves: 6, n: 128, over: 0.01 });   // hero block
    hand(c, seg(s, 0.14, 0.64, 0.8, 0.64), s * 0.012, 10 + j, { amp: s * 0.004, waves: 4 });
    hand(c, seg(s, 0.14, 0.73, 0.66, 0.73), s * 0.012, 12 + j, { amp: s * 0.004, waves: 4 });
    hand(c, seg(s, 0.14, 0.645, 0.6, 0.645), s * 0.006, 14 + j, { amp: s * 0.004, from: 0.15, to: 0.85 });   // gone over twice
  };
  SHAPES.phone = (c, s) => { rr(c, s, 0.29, 0.05, 0.42, 0.9, 0.09); c.fill(); };
  LINES.phone = (c, s, j = 0) => {
    hand(c, seg(s, 0.44, 0.11, 0.56, 0.11), s * 0.012, 2 + j, { amp: s * 0.004, waves: 2 });       // speaker
    hand(c, box(s, 0.35, 0.19, 0.3, 0.17), s * 0.012, 4 + j, { amp: s * 0.004, waves: 5, n: 112, over: 0.01 });   // card
    [0.45, 0.54, 0.63, 0.72].forEach((y, i) => hand(c, seg(s, 0.36, y, i === 3 ? 0.56 : 0.64, y), s * 0.012, 7 + i * 2 + j, { amp: s * 0.004, waves: 3 }));
    hand(c, seg(s, 0.36, 0.455, 0.6, 0.455), s * 0.006, 16 + j, { amp: s * 0.004, from: 0.1, to: 0.8 });   // gone over twice
    hand(c, seg(s, 0.44, 0.88, 0.56, 0.88), s * 0.012, 18 + j, { amp: s * 0.004, waves: 2 });       // home bar
  };
  const TONES = { sun: ['#F1C93F', '#DE561C'], blush: ['#F4668E', '#A51D55'], sky: ['#7BA6DE', '#3B55C9'], lime: ['#AEC123', '#4F7A2C'], forest: ['#5B7F45', '#2E4524'] };   // forest: the deck's dark green, for slides cream type sits on
  // Three boiling frames of a disc in one family, as image URLs, painted once and shared by every person on screen.
  const discs = {};
  function disc(family, size = 96) {
    const key = family + size;
    if (!discs[key]) discs[key] = Array.from({ length: BOILS }, () => grain(size, 'disc', ...TONES[family]).toDataURL());
    return discs[key];
  }
  const FAMILY = { cookie: TONES.sun, pentagon: TONES.blush, diamond: TONES.sky, leaf: TONES.lime, screen: TONES.sun, slide: TONES.blush, browser: TONES.sky, phone: TONES.lime };
  // Sets up a canvas for one shape and returns draw(frame, seconds): call it once per deck frame (8 fps).
  // The grain boils through three pre-painted frames; a spinning sun turns once every 24 s with the light fixed.
  function make(cv, shape, size, opts = {}) {
    if (!opts.lite) return makeAt(cv, shape, size, opts);
    // lite: a quarter of the pixels, the dots kept crisp; for big shapes that move every frame
    const keep = [DPR, CELL]; DPR = 1; CELL = 2;
    try { const d = makeAt(cv, shape, size, opts); cv.style.imageRendering = 'pixelated'; return d; } finally { [DPR, CELL] = keep; }
  }
  function makeAt(cv, shape, size, { spin = false, lines = true } = {}) {
    const [light, deep] = FAMILY[shape];
    cv.width = cv.height = size * DPR;
    cv.style.width = cv.style.height = size + 'px';
    const c = cv.getContext('2d');
    if (spin) {
      // one turn every |spin| seconds (24 by default, like the sun); a negative number turns the other way
      const secs = spin === true ? 24 : spin;
      const turn = shape === 'cookie' ? spinner(size, [shape, light, deep]) : turner(size, shape, light, deep, { linesLight: shape === 'diamond' });
      if (turn.big) {   // the turning canvas is bigger; pull it back so the shape stays where it was placed
        cv.width = cv.height = turn.big * DPR;
        cv.style.width = cv.style.height = turn.big + 'px';
        cv.style.margin = `${-(turn.big - size) / 2}px`;
      }
      return (f, t) => turn(c, (t / secs) * 2 * Math.PI, f % BOILS);
    }
    const frames = Array.from({ length: BOILS }, () => grain(size, shape, light, deep, { lines, linesLight: shape === 'diamond' }));
    return (f) => { c.clearRect(0, 0, cv.width, cv.height); c.drawImage(frames[f % BOILS], 0, 0); };
  }
  // A whole slide carrying the grain (decks may be bolder than the app): the same blend and light as grain(),
  // at 1x with 2px dots, and arcs running in from the bottom-right corner in the deep tone.
  function field(w, h, family, { cell = 2, from = 0.22, arcs = [] } = {}) {
    const [L, D] = TONES[family].map(hex);
    const lm = document.createElement('canvas'); lm.width = w; lm.height = h;
    const lc = lm.getContext('2d'); lc.fillStyle = '#000';
    const lw = Math.max(1.6, w / 480), j = rand() * 0.5;
    const arcAt = (r) => (u) => { const a = Math.PI + u * Math.PI / 2; return [w + r * Math.cos(a), h + r * Math.sin(a)]; };
    arcs.forEach((r, i) => hand(lc, arcAt(r), lw, 2 + i * 3 + j, { amp: lw * 0.9, waves: 4, n: 96 }));
    if (arcs.length) hand(lc, arcAt(arcs[1] || arcs[0]) , lw * 0.5, 17 + j, { from: 0.2, to: 0.7, waves: 4 });   // gone over twice
    const ld = lc.getImageData(0, 0, w, h).data;
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    const oc = out.getContext('2d'), img = oc.createImageData(w, h), o = img.data;
    const cw = Math.ceil(w / cell), n1 = new Float32Array(cw * Math.ceil(h / cell));
    for (let i = 0; i < n1.length; i++) n1[i] = rand();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, r = n1[((y / cell) | 0) * cw + ((x / cell) | 0)];
      const sm = smooth(from, 1.0, (x / w) * 0.45 + (y / h) * 0.55), amp = 0.08 + 2.6 * sm * (1 - sm);
      let v = Math.min(1, Math.max(0, sm + (r - 0.5) * amp));
      const line = ld[i + 3] / 255;
      if (line) v = Math.min(1, v + 0.75 * line * (r * 0.5 + 0.5));
      for (let k = 0; k < 3; k++) o[i + k] = L[k] + (D[k] - L[k]) * v;
      o[i + 3] = 255;
    }
    oc.putImageData(img, 0, 0);
    return out;
  }
  // Words carrying the grain: the text is the shape. Same blend and light as grain(), lines run in from the bottom right.
  function text(str, font, light, deep, { cell = 2, pad = 24, from = 0.22 } = {}) {
    const L = hex(light), D = hex(deep);
    const probe = document.createElement('canvas').getContext('2d'); probe.font = font;
    const mt = probe.measureText(str);
    const w = Math.ceil(mt.actualBoundingBoxLeft + mt.actualBoundingBoxRight) + 2 * pad;
    const h = Math.ceil(mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent) + 2 * pad;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
    const mask = mk(), mc = mask.getContext('2d'); mc.font = font; mc.fillStyle = '#000';
    mc.fillText(str, pad + mt.actualBoundingBoxLeft, pad + mt.actualBoundingBoxAscent);
    const lm = mk(), lc = lm.getContext('2d'); lc.fillStyle = '#000';
    const j = rand() * 0.5, arcAt = (r) => (u) => { const a = Math.PI + u * Math.PI / 2; return [w + r * Math.cos(a), h + r * Math.sin(a)]; };
    [0.45, 0.75, 1.05].forEach((k, i) => hand(lc, arcAt(h * k), 3, 2 + i * 3 + j, { amp: 2.2, waves: 3, n: 80 }));
    const m = mc.getImageData(0, 0, w, h).data, ld = lc.getImageData(0, 0, w, h).data;
    const out = mk(), oc = out.getContext('2d'), img = oc.createImageData(w, h), o = img.data;
    const cw = Math.ceil(w / cell), cells = cw * Math.ceil(h / cell), n1 = new Float32Array(cells), n2 = new Float32Array(cells);
    for (let i = 0; i < cells; i++) { n1[i] = rand(); n2[i] = rand(); }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = m[i + 3] / 255;
      if (!a) continue;
      const ci = ((y / cell) | 0) * cw + ((x / cell) | 0), r = n1[ci];
      if (a < 1 && a < n2[ci]) continue; // grainy edge
      const sm = smooth(from, 1.0, (x / w) * 0.45 + (y / h) * 0.55), amp = 0.08 + 2.6 * sm * (1 - sm);
      let v = Math.min(1, Math.max(0, sm + (r - 0.5) * amp));
      const line = ld[i + 3] / 255;
      if (line) v = Math.min(1, v + 0.75 * line * (r * 0.5 + 0.5));
      for (let k = 0; k < 3; k++) o[i + k] = L[k] + (D[k] - L[k]) * v;
      o[i + 3] = 255;
    }
    oc.putImageData(img, 0, 0);
    return out;
  }
  // The sun's outline (9 scallops) as a ring of radius R around (cx, cy), turned by a.
  function sunRing(c, cx, cy, R, a, depth = 0.07) {
    c.beginPath();
    for (let i = 0; i <= 360; i++) { const g = (i * Math.PI) / 180, r = R * (1 + depth * Math.cos(9 * (g - a))); c.lineTo(cx + r * Math.cos(g), cy + r * Math.sin(g)); }
    c.stroke();
  }
  // Grain for lines drawn later: an alpha texture of dots to cut strokes with (destination-in), like the spinner's arcs.
  function dots(w, h, cell = 1) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'), img = c.createImageData(w, h);
    for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
      const al = 255 * (0.55 + 0.45 * rand());
      for (let j = 0; j < cell && y + j < h; j++) for (let i = 0; i < cell && x + i < w; i++) img.data[((y + j) * w + x + i) * 4 + 3] = al;
    }
    c.putImageData(img, 0, 0);
    return cv;
  }
  window.Grain = { make, disc, field, text, sunRing, dots, TONES, FAMILIES: ['sun', 'blush', 'sky', 'lime'] };
})();
