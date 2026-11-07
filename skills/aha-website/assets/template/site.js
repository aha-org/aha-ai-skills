// Aha site: one 8 fps clock for everything that moves, the grain entrance on the hero,
// grain cards and fields painted once and boiled, sections that rise in as they scroll into view.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 8 fps: stepped easings for CSS (--oN / --ioN, N = twelfths of a second) ----------
  const FPS = 8, FR = 1000 / FPS;
  const E = {
    lin: (t) => t,
    out: (t) => 1 - Math.pow(1 - t, 4),
    inOut: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
  };
  function stepped(fn, n) {
    const p = [];
    for (let k = 0; k < n; k++) { const v = fn((k + 1) / n).toFixed(4); p.push(`${v} ${((k / n) * 100).toFixed(3)}%`, `${v} ${(((k + 1) / n) * 100).toFixed(3)}%`); }
    return `linear(${p.join(', ')})`;
  }
  for (let n = 2; n <= 24; n++) {
    const f = Math.max(1, Math.round((n * FPS) / 12));
    html.style.setProperty(`--o${n}`, stepped(E.out, f));
    html.style.setProperty(`--io${n}`, stepped(E.inOut, f));
  }

  // ---------- one clock ----------
  // Each tick swaps the line-boil seed and redraws every grain piece that is on screen.
  const GR = [], subs = new Set();
  let frame = 0;
  const seen = new WeakMap();
  const vis = new IntersectionObserver((es) => es.forEach((e) => seen.set(e.target, e.isIntersecting)), { rootMargin: '100px' });
  setInterval(() => {
    frame++;
    html.dataset.b = frame % 3;
    for (const g of GR) if (seen.get(g.el)) g.tick(frame);
    for (const f of [...subs]) f(frame);
  }, FR);
  const track = (el, tick) => { GR.push({ el, tick }); vis.observe(el); };

  // anim(ms, fn(p)): fn once per frame with eased progress; resolves when done
  function anim(ms, fn, ease = E.inOut) {
    if (still) { fn(1); return Promise.resolve(); }
    const n = Math.max(1, Math.round(ms / FR)); let k = 0;
    return new Promise((res) => { const f = () => { k++; fn(ease(k / n)); if (k >= n) { subs.delete(f); res(); } }; subs.add(f); });
  }

  // ---------- grain shapes: <canvas class="gr" data-shape data-size [data-spin] [class="copy"]> ----------
  $$('canvas.gr').forEach((cv, i) => {
    const size = +cv.dataset.size, copy = cv.classList.contains('copy');
    const spin = cv.hasAttribute('data-spin') ? (+cv.dataset.spin || true) : false;
    const draw = Grain.make(cv, cv.dataset.shape, size, { spin, lines: !copy });
    const phase = i * 1.7, amp = Math.max(2, size * 0.025);
    draw(0, 0);
    track(cv, (f) => {
      const t = f / FPS;
      draw(f, t);
      if (copy) { cv.style.translate = `${(Math.sin(t / 2.6 + phase) * 6).toFixed(1)}px ${(Math.cos(t / 3.1 + phase) * 5).toFixed(1)}px`; return; }
      cv.style.translate = `0 ${(Math.sin(t / 1.5 + phase) * amp).toFixed(1)}px`;
    });
  });

  // ---------- grain fields: cards and the statement band ----------
  // Painted at half the element's size (shown at 2x, so each dot is 2px), three frames, boiled on the beat.
  function fieldFor(cv) {
    let frames = null;
    const paint = () => {
      const w = Math.ceil(cv.clientWidth / 2), h = Math.ceil(cv.clientHeight / 2);
      if (!w || !h) return;
      const R = Math.max(w, h);
      const arcs = [0.22, 0.38, 0.56, 0.76, 0.98].map((k) => Math.round(R * k));
      frames = Array.from({ length: 3 }, () => Grain.field(w, h, cv.dataset.fam || cv.closest('[data-fam]').dataset.fam, { cell: 1, arcs }));
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(frames[0], 0, 0);
    };
    paint();
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(paint, 250); });
    track(cv, (f) => frames && cv.getContext('2d').drawImage(frames[f % 3], 0, 0));
  }
  $$('.gcard canvas, canvas.field').forEach(fieldFor);

  // ---------- hand-drawn underlines draw themselves once ----------
  const underline = (u) => { const p = $('path', u); if (p && !u._drawn) { u._drawn = true; anim(667, (k) => { p.style.strokeDashoffset = 1 - k; }, E.out); } };

  // ---------- the hero: the grain entrance ----------
  {
    const hero = $('.hero-art .main'), lines = $$('.hero .ln'), late = $$('.hero .focus-late');
    const copies = [{ el: $('.hero-art .copy.a'), alpha: 0.55, blur: 10, from: [-40, -30] }, { el: $('.hero-art .copy.b'), alpha: 0.45, blur: 14, from: [40, 34] }];
    const k = (T, start, ms) => (T <= start ? 0 : T >= start + ms ? 1 : 1 - Math.pow(1 - (T - start) / ms, 3));
    const focusIn = (el, r, blur = 8, rise = 10) => { el.style.opacity = r; el.style.filter = r < 1 ? `blur(${(blur * (1 - r)).toFixed(1)}px)` : 'none'; el.style.transform = `translateY(${rise * (1 - r)}px)`; };
    function focus(T) {
      copies.forEach((c) => {
        if (!c.el) return;
        const q = k(T, 200, 1400);
        c.el.style.opacity = c.alpha * q;
        c.el.style.filter = `blur(${(c.blur + 18 * (1 - q)).toFixed(1)}px)`;
        c.el.style.transform = `translate(${c.from[0] * (1 - q)}px, ${c.from[1] * (1 - q)}px)`;
      });
      if (hero) {
        const q = k(T, 450, 1300);
        hero.style.opacity = Math.min(1, q * 1.6);
        hero.style.filter = q < 1 ? `blur(${(22 * (1 - q)).toFixed(1)}px)` : 'none';
        hero.style.transform = `translateY(${24 * (1 - q)}px) scale(${0.82 + 0.18 * q}) rotate(${-14 * (1 - q)}deg)`;
      }
      lines.forEach((el, i) => focusIn(el, k(T, 1000 + i * 250, 700)));
      late.forEach((el, i) => focusIn(el, k(T, 1600 + i * 200, 700), 6, 16));
    }
    const ms = 2600;
    focus(0);
    anim(ms, (p) => focus(p * ms), E.lin).then(() => { focus(1e5); $$('.hero .u').forEach(underline); });
  }

  // ---------- Milo: one per moment; he hops once when he comes into view ----------
  $$('[data-milo]').forEach((host) => {
    const size = +host.dataset.size || Math.min(220, innerWidth * 0.42);
    const m = new Milo(host, { size, mood: host.dataset.mood || 'green', eyes: host.dataset.eyes || 'oval', touch: true });
    host._milo = m;
  });

  // ---------- sections rise in as they scroll into view ----------
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('in');
    io.unobserve(el);
    setTimeout(() => { $$('.u', el).forEach(underline); if (el._milo) el._milo.hop(1); }, 500);
  }), { threshold: 0.25 });
  $$('.reveal').forEach((el) => io.observe(el));
})();
