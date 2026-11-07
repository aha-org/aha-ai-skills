// Aha grain deck: the engine + each slide's motion. Built from the masterclass deck "Make it without me".
// Everything moves at 8 frames a second on purpose: one shared clock (FPS) drives the JS motion,
// and the CSS uses stepped easings (--oN / --ioN) generated below, so both land on the same frames.
// → / Space / click: next. ←: back. F: full screen. S: sound.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const stage = $('#stage');
  const NS = 'http://www.w3.org/2000/svg';
  const rnd = (a, b) => a + Math.random() * (b - a);

  const CURSOR_NAME = 'Aha';   // the name tag on the cursor that walks through the deck
  let scale = 1;
  // Fill the window: scale to cover it, so there are no bars, but never trim more than about a seventh of the
  // stage (everything sits at least 96px in from the edges). Only very odd window shapes keep a thin border.
  function fit() {
    const contain = Math.min(innerWidth / 1600, innerHeight / 900), cover = Math.max(innerWidth / 1600, innerHeight / 900);
    scale = Math.min(cover, contain * 1.16);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
  addEventListener('resize', fit);
  fit();

  // ---------- 8 fps ----------
  const FPS = 8, FR = 1000 / FPS;
  const E = {
    lin: (t) => t,
    out: (t) => 1 - Math.pow(1 - t, 4),
    inOut: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
    soft: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  };
  // A CSS easing that holds each of n frames: linear(v1 0%, v1 1/n, v2 1/n, ...).
  function stepped(fn, n) {
    const p = [];
    for (let k = 0; k < n; k++) {
      const v = fn((k + 1) / n).toFixed(4);
      p.push(`${v} ${((k / n) * 100).toFixed(3)}%`, `${v} ${(((k + 1) / n) * 100).toFixed(3)}%`);
    }
    return `linear(${p.join(', ')})`;
  }
  // --oN / --ioN are named by duration in twelfths of a second (CSS pairs --o8 with .667s);
  // the number of held frames inside comes from FPS.
  for (let n = 2; n <= 24; n++) {
    const f = Math.max(1, Math.round((n * FPS) / 12));
    html.style.setProperty(`--o${n}`, stepped(E.out, f));
    html.style.setProperty(`--io${n}`, stepped(E.inOut, f));
  }

  // One clock for everything. Every frame it swaps the grain/line-boil seed, so drawn things shimmer.
  const subs = new Set(), GR = [];
  let frame = 0;
  setInterval(() => {
    frame++;
    html.dataset.b = frame % 3;
    for (const g of GR) if (g.slide.classList.contains('active')) g.tick(frame);
    for (const f of [...subs]) f(frame);
  }, FR);

  // Navigation tokens: any slide or step change cancels the motion that was running.
  let runId = 0, tk = 0, FAST = false;
  const guard = () => { const r = runId, t = tk; return () => r === runId && t === tk; };

  // anim(ms, fn(p, raw)): calls fn once per frame with eased progress. Resolves true when done, false if cancelled.
  function anim(ms, fn, ease = E.inOut, ok = guard()) {
    if (FAST) { fn(1, 1); return Promise.resolve(true); }
    const n = Math.max(1, Math.round(ms / FR));
    let k = 0;
    return new Promise((res) => {
      const f = () => {
        if (!ok()) { subs.delete(f); res(false); return; }
        k++;
        fn(ease(k / n), k / n);
        if (k >= n) { subs.delete(f); res(true); }
      };
      subs.add(f);
    });
  }
  const hold = (ms, ok) => anim(ms, () => {}, E.lin, ok);
  const all = async (...ps) => (await Promise.all(ps)).every(Boolean);
  const after = async (ms, ok, fn) => (await hold(ms, ok)) && fn();

  // Position of an element inside its slide, ignoring transforms (so mid-animation builds don't skew it).
  function at(el) {
    let x = 0, y = 0, e = el;
    while (e && !e.classList.contains('slide')) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }

  // ---------- headings: each word rises one frame after the last ----------
  function split(el) {
    let i = 0;
    const walk = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--w', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && n.namespaceURI !== NS) walk(n);
      }
    };
    walk(el);
    if (el.hasAttribute('data-s')) el.classList.add('gated');
  }
  $$('.split').forEach(split);

  // ---------- sticker icons ----------
  const sticker = (name) => `<span class="stk"><i class="ph-fill ph-${name}"></i><i class="ph-bold ph-${name}"></i></span>`;
  $$('.stk-me').forEach((el) => {
    const i = el.querySelector('i.ph-bold'); if (!i) return;
    const name = [...i.classList].find((k) => k.startsWith('ph-') && k !== 'ph-bold').slice(3);
    el.classList.remove('stk-me'); el.classList.add('stk');
    el.innerHTML = `<i class="ph-fill ph-${name}"></i><i class="ph-bold ph-${name}"></i>`;
  });

  // ---------- grain shapes (grain.js, the approved Aha grain): drawn and floated on the 8 fps clock ----------
  // Soft copies drift and turn slowly; the rest float on their own phase and tilt a little (a turning sun only floats).
  $$('canvas.gr').forEach((cv, i) => {
    const size = +cv.dataset.size, copy = cv.classList.contains('copy'), wave = cv.hasAttribute('data-wave');
    const spin = cv.hasAttribute('data-spin') ? (+cv.dataset.spin || true) : false;   // data-spin="-32": seconds per turn, negative turns the other way
    const draw = Grain.make(cv, cv.dataset.shape, size, { spin, lines: !copy, lite: cv.hasAttribute('data-lite') });
    const phase = i * 1.7, amp = Math.max(2, size * 0.025), dir = i % 2 ? -0.7 : 0.5;
    draw(0, 0);   // painted once up front, so a match cut into a slide that hasn't been shown yet has something to land on
    GR.push({
      slide: cv.closest('.slide'),
      tick(f) {
        const t = f / FPS;
        draw(f, t);
        if (copy) { cv.style.translate = `${(Math.sin(t / 2.6 + phase) * 6).toFixed(1)}px ${(Math.cos(t / 3.1 + phase) * 5).toFixed(1)}px`; cv.style.rotate = `${((t / 24) * 360 * dir).toFixed(1)}deg`; return; }
        cv.style.translate = `0 ${(Math.sin(t / 1.5 + phase) * amp).toFixed(1)}px`;
        if (wave) cv.style.rotate = `${(Math.sin(t * 1.4 + phase) * 9).toFixed(1)}deg`;   // a leaf sways from its stem
        else if (!spin) cv.style.rotate = `${(Math.sin(t / 2.3 + phase) * 3).toFixed(1)}deg`;
      },
    });
  });

  // Whole screens of grain, one per colour family (half size, shown at 2x), painted once and kept.
  const FIELDS = {};
  const fieldOf = (fam) => FIELDS[fam] || (FIELDS[fam] = Array.from({ length: 3 }, () => Grain.field(800, 450, fam, { cell: 1, arcs: [115, 195, 285, 390, 510] })));
  setTimeout(() => ['blush', 'sky', 'lime', 'sun', 'forest'].forEach((f, i) => setTimeout(() => fieldOf(f), 400 * i)), 1500);

  // Grain words: <canvas class="gt" data-text data-fam data-px>, painted at 2x (finer dots) once the serif has loaded.
  $$('canvas.gt').forEach((cv) => {
    const c = cv.getContext('2d');
    let fr = null;
    const paint = () => {
      if (fr || !document.fonts.check('400 40px "Hedvig Letters Serif"')) return fr;
      const [L, D] = Grain.TONES[cv.dataset.fam], px = +cv.dataset.px * 2;
      fr = Array.from({ length: 3 }, () => Grain.text(cv.dataset.text, `400 ${px}px "Hedvig Letters Serif"`, L, D, { pad: 14, from: -0.9 }));   // starts mid-way, so it reads on white
      cv.width = fr[0].width; cv.height = fr[0].height;
      cv.style.width = fr[0].width / 2 + 'px'; cv.style.height = fr[0].height / 2 + 'px';
      return fr;
    };
    cv.frames = paint;   // so a slide can read the painted word (the sort slide's particles land on it)
    GR.push({ slide: cv.closest('.slide'), tick(f) { const F = paint(); if (!F) return; c.clearRect(0, 0, cv.width, cv.height); c.drawImage(F[f % 3], 0, 0); } });
  });

  // ---------- the cursor ----------
  const C = { el: $('#cursor'), x: 1700, y: 1000, label: $('#cursor em') };
  function cursorAt(x, y) { C.x = x; C.y = y; C.el.style.transform = `translate(${x}px, ${y}px)`; }
  cursorAt(1700, 1000);
  // moves on a slight arc, with a little hand shake on every frame
  function cursorTo(x, y, ms = 750, ok) {
    const x0 = C.x, y0 = C.y, d = Math.hypot(x - x0, y - y0), arc = Math.min(120, d * 0.14);
    const nx = d ? -(y - y0) / d : 0, ny = d ? (x - x0) / d : 0;
    C.el.classList.add('on');
    return anim(ms, (p, raw) => {
      const j = raw < 1 ? 1.6 : 0, a = Math.sin(Math.PI * p) * arc;
      cursorAt(x0 + (x - x0) * p + nx * a + rnd(-j, j), y0 + (y - y0) * p + ny * a + rnd(-j, j));
    }, E.inOut, ok);
  }
  async function click(ok) {
    if (FAST) return true;
    C.el.classList.add('down');
    const r = document.createElement('i'); r.className = 'ripple'; C.el.appendChild(r);
    setTimeout(() => r.remove(), 600);
    Sfx.tap();
    const res = await hold(167, ok);
    C.el.classList.remove('down');
    return res;
  }
  const cursorOff = () => C.el.classList.remove('on');
  const cursorName = (name, you) => { C.label.textContent = name; C.el.classList.toggle('you', !!you); };

  // ---------- small DOM helpers ----------
  const svg = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const div = (cls, parent, htmlText = '') => { const e = document.createElement('div'); e.className = cls; e.innerHTML = htmlText; if (parent) parent.appendChild(e); return e; };
  const show = (el) => { if (FAST) el.classList.add('in'); else requestAnimationFrame(() => el.classList.add('in')); };


  // The team: nobody in particular, so everyone is an anonymous grain disc (the Aha grain, lines through it).
  // The boiling frames are painted once per colour family and swapped by CSS on the line-boil beat (html[data-b]).
  // Sun colours are kept for the goal (the thing that matters); the team gets the other three families.
  const FAMS = Grain.FAMILIES;
  const TEAM = FAMS.filter((f) => f !== 'sun');
  const fam = (i) => TEAM[i % TEAM.length];
  {
    const css = FAMS.flatMap((f) => Grain.disc(f, 96).map((u, b) => `html[data-b="${b}"] .av[data-fam="${f}"] { background-image: url(${u}); }`));
    const st = document.createElement('style'); st.textContent = css.join('\n'); document.head.appendChild(st);
  }
  const avatar = (f) => `<i class="av" data-fam="${f}"></i>`;


  const hooks = {};

  // A slide whose steps are "snap to the state of step n, then play step n+1 live".
  // play(n, ok) must also work with FAST on (instant), which is how snap rebuilds any step.
  function stepped_slide(reset, play) {
    let shown = -1;
    async function snap(n) { FAST = true; reset(); for (let k = 0; k <= n; k++) await play(k, () => true); FAST = false; }
    return {
      enter() { shown = -1; },
      async step(n, dir) {
        const live = dir > 0 && n === shown + 1;
        shown = n;
        if (n === 0 && dir > 0) { reset(); play(0, guard()); return; }
        if (!live) { await snap(n); return; }
        await snap(n - 1);
        play(n, guard());
      },
    };
  }

  // ================= SLIDES =================

  // 1. Title: the approved grain entrance (soft copies drift in, the sun comes into focus turning,
  // the title comes into focus line by line, the rest rises), then the cursor underlines "me."
  {
    const s = $('#s-title'), u = $('.u', s), path = $('.scribble path', s);
    const hero = $('.hero', s), lines = $$('.ln', s);
    const copies = [{ el: $('.copy.a', s), alpha: 0.55, blur: 10, from: [-40, -30] }, { el: $('.copy.b', s), alpha: 0.45, blur: 14, from: [40, 34] }];
    const k = (T, start, ms) => (T <= start ? 0 : T >= start + ms ? 1 : 1 - Math.pow(1 - (T - start) / ms, 3));
    function focus(T) {
      copies.forEach((c) => {
        const q = k(T, 200, 1400);
        c.el.style.opacity = c.alpha * q;
        c.el.style.filter = `blur(${(c.blur + 18 * (1 - q)).toFixed(1)}px)`;
        c.el.style.transform = `translate(${c.from[0] * (1 - q)}px, ${c.from[1] * (1 - q)}px)`;
      });
      const q = k(T, 450, 1300);
      hero.style.opacity = Math.min(1, q * 1.6);
      hero.style.filter = q < 1 ? `blur(${(22 * (1 - q)).toFixed(1)}px)` : 'none';
      hero.style.transform = `translateY(${24 * (1 - q)}px) scale(${0.82 + 0.18 * q}) rotate(${-14 * (1 - q)}deg)`;
      lines.forEach((el, i) => {
        const r = k(T, 1000 + i * 250, 700);
        el.style.opacity = r;
        el.style.filter = r < 1 ? `blur(${(8 * (1 - r)).toFixed(1)}px)` : 'none';
        el.style.transform = `translateY(${10 * (1 - r)}px)`;
      });
    }
    hooks['s-title'] = {
      async enter() {
        const ok = guard();
        cursorName(CURSOR_NAME);
        path.style.strokeDashoffset = 1;
        focus(0);
        if (!(await anim(2250, (p) => focus(p * 2250), E.lin, ok))) { focus(1e5); return; }
        if (!(await hold(300, ok))) return;
        const b = at(u);
        if (!(await cursorTo(b.x + b.w * 0.92, b.y + b.h + 4, 1000, ok))) return;
        if (!(await click(ok))) return;
        if (!(await anim(667, (p) => { path.style.strokeDashoffset = 1 - p; }, E.out, ok))) return;
        await cursorTo(1060, 780, 1500, ok);
      },
      leave() { path.style.strokeDashoffset = 0; focus(1e5); },
    };
  }

  // 2. Brief: four grain cards, one per click; the cursor taps each as it arrives.
  {
    const s = $('#s-brief'), cards = $$('.acard', s), ctx = cards.map((c) => $('.fieldc', c).getContext('2d'));
    let shown = 0;
    // a portrait crop from the right of the field, so each card keeps the light top left and the arcs
    const paint = (i, f) => ctx[i].drawImage(fieldOf(cards[i].dataset.fam)[f % 3], 462, 0, 338, 450, 0, 0, 338, 450);
    GR.push({ slide: s, tick(f) { for (let i = 0; i < shown; i++) paint(i, f); } });
    hooks['s-brief'] = {
      async step(n, dir) {
        shown = n; for (let i = 0; i < n; i++) paint(i, frame);
        const ok = guard();
        if (n === 0) { if (dir > 0) cursorTo(1240, 250, 900, ok); return; }
        const b = at(cards[n - 1]);
        if ((await cursorTo(b.x + b.w * 0.7, b.y + 70, 583, ok)) && (await click(ok))) cursorTo(b.x + b.w * 0.85, b.y - 40, 583, ok);
      },
    };
  }

  // 3. Statement: a forest-green grain field with arcs; on the click a hand-drawn line runs under one word.
  {
    const s = $('#s-statement'), fc = $('.fieldc', s).getContext('2d'), line = $('.scribble path', s);
    GR.push({ slide: s, tick(f) { fc.drawImage(fieldOf('forest')[f % 3], 0, 0); } });
    hooks['s-statement'] = {
      enter() { cursorOff(); fc.drawImage(fieldOf('forest')[0], 0, 0); },
      step(n, dir) {
        if (n < 1) { line.style.strokeDashoffset = 1; return; }
        if (dir < 0) { line.style.strokeDashoffset = 0; return; }
        const ok = guard();
        line.style.strokeDashoffset = 1;
        after(625, ok, () => anim(667, (p) => { line.style.strokeDashoffset = 1 - p; }, E.out, ok));
      },
    };

  }

  // 4. The end: the sun stays in focus; the soft copies drift in and the line
  // comes into focus one row at a time (the grain entrance, as on the opening slide).
  {
    const s = $('#s-end'), lines = $$('.ln', s);
    const copies = [{ el: $('.copy.a', s), alpha: 0.55, blur: 10, from: [-40, -30] }, { el: $('.copy.b', s), alpha: 0.45, blur: 14, from: [40, 34] }];
    const k = (T, start, ms) => (T <= start ? 0 : T >= start + ms ? 1 : 1 - Math.pow(1 - (T - start) / ms, 3));
    function focus(T) {
      copies.forEach((c) => {
        const q = k(T, 300, 1400);
        c.el.style.opacity = c.alpha * q;
        c.el.style.filter = `blur(${(c.blur + 18 * (1 - q)).toFixed(1)}px)`;
        c.el.style.transform = `translate(${c.from[0] * (1 - q)}px, ${c.from[1] * (1 - q)}px)`;
      });
      lines.forEach((el, i) => {
        const r = k(T, 700 + i * 250, 700);
        el.style.opacity = r;
        el.style.filter = r < 1 ? `blur(${(8 * (1 - r)).toFixed(1)}px)` : 'none';
        el.style.transform = `translateY(${10 * (1 - r)}px)`;
      });
    }
    hooks['s-end'] = {
      enter() { cursorOff(); const ok = guard(); focus(0); anim(2000, (p) => focus(p * 2000), E.lin, ok).then((done) => { if (!done) focus(1e5); }); },
      leave() { focus(1e5); },
    };
  }

  // ---------- the deck ----------
  const slides = $$('.slide');
  const BG = { forest: '#4A6A3B', lime: '#AEC123', paper: '#EFEFEF' };
  const bgOf = (s) => BG[s.dataset.bg] || '#FFFFFF';
  const prog = $('#progress');
  prog.innerHTML = slides.map(() => '<i></i>').join('');
  let cur = -1, step = 0;
  const steps = (i) => +slides[i].dataset.steps || 0;
  const setVT = (slide, on) => $$('[data-vt]', slide).forEach((e) => { e.style.viewTransitionName = on ? e.dataset.vt : ''; });

  function applyStep(dir) {
    const s = slides[cur];
    $$('[data-s]', s).forEach((e) => e.classList.toggle('on', step >= +e.dataset.s));
    hooks[s.id]?.step?.(step, dir);
  }

  function go(i, st, dir) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === cur) {
      if (st === step) return;
      Sfx.step(dir);
      tk++; step = st; applyStep(dir);
      return;
    }
    const prev = slides[cur], next = slides[i];
    const swap = () => {
      if (prev) { prev.classList.remove('active'); setVT(prev, false); hooks[prev.id]?.leave?.(); }
      runId++; tk++;
      cur = i; step = st;
      document.body.style.background = bgOf(next);
      document.body.classList.toggle('dark', next.dataset.bg === 'forest');
      document.body.classList.toggle('bookend', next.hasAttribute('data-bookend'));
      document.body.classList.toggle('nomark', next.hasAttribute('data-nomark'));
      document.body.classList.toggle('noprog', next.hasAttribute('data-noprog'));
      next.classList.add('active');
      setVT(next, true);
      Sfx.setQuiet(!next.hasAttribute('data-sound'));   // sound only on slides marked data-sound
      hooks[next.id]?.enter?.(step, dir);
      Sfx.resetSteps();
      applyStep(dir);
      [...prog.children].forEach((d, k) => { d.className = k === cur ? 'now' : k < cur ? 'past' : ''; });
      history.replaceState(null, '', '#' + (cur + 1));
    };
    if (prev && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      html.classList.toggle('back', dir < 0);
      html.classList.toggle('wipe', bgOf(prev) !== bgOf(next));
      setVT(prev, true);
      Sfx.slide(dir);
      // a transition can be skipped (fast clicking, a hidden tab); the slide still changes, so the rejections are expected
      const vt = document.startViewTransition(swap);
      [vt.ready, vt.finished, vt.updateCallbackDone].forEach((p) => p.catch(() => {}));
    } else {
      if (prev) Sfx.slide(dir);
      swap();
    }
  }

  const deck = {
    next() { if (step < steps(cur)) go(cur, step + 1, 1); else if (cur < slides.length - 1) go(cur + 1, 0, 1); },
    prev() { if (step > 0) go(cur, step - 1, -1); else if (cur > 0) go(cur - 1, steps(cur - 1), -1); },
    step: () => step,
    goto: (i, s = 0) => go(i, s, 1),
    slideId: () => slides[cur]?.id,
  };
  window.deck = deck;

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); deck.next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); deck.prev(); }
    else if (e.key === 'Home') go(0, 0, -1);
    else if (e.key === 'End') go(slides.length - 1, 0, 1);
    else if (e.key === 's' || e.key === 'S') { const off = Sfx.toggle(); const hint = $('#hint'); hint.textContent = off ? 'Sound off · S to turn on' : 'Sound on'; hint.classList.remove('hide'); clearTimeout(hint._t); hint._t = setTimeout(() => hint.classList.add('hide'), 1800); }
    else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : html.requestFullscreen(); }
  });
  addEventListener('pointerdown', (e) => { if (e.button === 0) deck.next(); });
  // the first key or click turns the sound on (a browser rule); say so, briefly
  {
    const hint = $('#hint');
    const first = () => {
      removeEventListener('keydown', first, true); removeEventListener('pointerdown', first, true);
      if (Sfx.muted) return;
      hint.textContent = 'Sound on · S to mute'; hint.classList.remove('hide');
      clearTimeout(hint._t); hint._t = setTimeout(() => hint.classList.add('hide'), 2200);
    };
    addEventListener('keydown', first, true); addEventListener('pointerdown', first, true);
  }

  const start = Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1);
  go(start, 0, 1);
  { const st = +new URLSearchParams(location.search).get('step'); if (st) setTimeout(() => go(cur, st, 1), 200); }
  setTimeout(() => $('#hint').classList.add('hide'), 5000);
})();