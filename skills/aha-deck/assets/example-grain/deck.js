// Make it without me: the deck engine + every slide's motion.
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

  // Voice-note waveforms, measured from the real clips in assets/vn, and what each one says.
  const PEAKS = {"vn1": [0.76, 0.98, 0.71, 0.78, 0.44, 0.6, 0.95, 0.78, 0.55, 0.74, 1.0, 0.8, 0.24, 0.99, 0.88, 0.58, 0.8, 0.85, 0.76, 0.82, 0.74, 0.67, 0.71, 0.69, 0.32, 0.43, 0.87, 0.79, 0.41, 0.16], "vn2": [0.85, 1.0, 0.59, 0.64, 0.57, 0.43, 0.25, 0.25, 0.75, 0.69, 0.3, 0.67, 0.6, 0.38, 0.19, 0.15, 0.12, 0.12, 0.12, 0.24, 0.75, 0.75, 0.57, 0.62, 0.68, 0.66, 0.53, 0.41, 0.28, 0.17], "vn3": [0.89, 1.0, 0.87, 0.69, 0.65, 0.53, 0.29, 0.32, 0.37, 0.86, 0.81, 0.72, 0.7, 0.54, 0.44, 0.27, 0.33, 0.79, 0.84, 0.57, 0.59, 0.75, 0.84, 0.67, 0.19, 0.44, 0.55, 0.48, 0.38, 0.22], "vn4": [0.83, 0.77, 0.94, 0.78, 0.16, 0.32, 0.65, 0.63, 0.68, 1.0, 0.81, 0.79, 0.68, 0.43, 0.64, 0.56, 0.12, 0.33, 0.95, 0.63, 0.21, 0.77, 0.73, 0.51, 0.49, 0.51, 0.47, 0.46, 0.36, 0.12]};
  const DUR = { vn1: 2.2, vn2: 2.0, vn3: 2.0, vn4: 4.6 };
  const SAYS = { vn1: 'Manan, can you change just one word on the website?', vn2: 'Manan, urgent. We need a banner for the event, like, today.', vn3: 'Manan, sorry, one more thing.' };
  const place = (el, { x, y, right }) => { if (right !== undefined) el.style.right = right + 'px'; else el.style.left = x + 'px'; el.style.top = y + 'px'; };

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

  // ---------- chat, like the Aha app: one thread beside each close-up ----------
  function thread(host, f) {
    const t = div('thread', host, `<div class="th-head">${avatar(f)}<b>Someone from the team</b></div><div class="th-body"></div>`);
    show(t);
    t.body = $('.th-body', t);
    return t;
  }
  // a message joins the thread; only the last of a run from one side gets the tail
  function addMsg(t, html, mine, cls = '') {
    const prev = t.body.lastElementChild;
    if (prev && prev.classList.contains(mine ? 'mine' : 'his')) prev.classList.remove('end');
    const b = div(`msg ${mine ? 'mine' : 'his'} end ${cls}`, t.body, html);
    show(b);
    return b;
  }
  // a text: three dots first, then the words
  async function textIn(t, words, ok) {
    const b = addMsg(t, '<span class="dots"><i></i><i></i><i></i></span>', false, 'typing');
    if (!FAST && !(await hold(625, ok))) return false;
    b.classList.remove('typing'); b.innerHTML = words;
    if (!FAST) Sfx.receive();
    return true;
  }
  function reply(t, words) { addMsg(t, words, true); if (!FAST) Sfx.send(); }
  // a voice note with its transcript under the waveform, as the app shows it; .play() lights the bars in time
  function voiceIn(t, name) {
    const bars = PEAKS[name].map((h) => `<i style="height:${Math.round(6 + h * 34)}px"></i>`).join('');
    const b = addMsg(t, `<div class="vrow"><span class="pl"><i class="ph-fill ph-play"></i></span><span class="bars">${bars}</span><span class="t">0:0${Math.round(DUR[name])}</span></div><p class="tx">${SAYS[name]}</p>`, false, 'voice');
    if (!FAST) Sfx.receive();
    const is = $$('.bars i', b), tm = $('.t', b), icon = $('.pl i', b);
    b.play = async (ok, gain = 0.95) => {
      if (FAST) { is.forEach((i) => i.classList.add('lit')); return true; }
      const v = Sfx.voice(name, gain), d = (Sfx.muted ? DUR[name] : Sfx.clipDur(name)) * 1000;
      icon.className = 'ph-fill ph-pause';
      const done = await anim(d, (p) => {
        const k = Math.round(p * is.length);
        is.forEach((i, n) => i.classList.toggle('lit', n < k));
        tm.textContent = `0:0${Math.floor((p * d) / 1000)}`;
      }, E.lin, ok);
      if (!done) v.stop();
      icon.className = 'ph-fill ph-play';
      return done;
    };
    return b;
  }

  // ---------- an incoming call, in the same spot as the thread ----------
  function call(host, f) {
    const c = div('callp ringing', host, `${avatar(f)}<p class="lbl">Incoming call</p><b>Someone from the team</b><small>Ringing</small><div class="btns"><span class="btn no"><i class="ph-fill ph-phone-x"></i></span><span class="btn yes"><i class="ph-fill ph-phone"></i></span></div>`);
    show(c);
    return c;
  }
  // the phone rings (the real ringtone) until it's picked up or the ringing stops
  async function ringFor(c, n, ok) {
    if (!FAST) Sfx.ringStart();
    const done = await hold(1250 * n, ok);
    if (!done) Sfx.ringStop();
    return done;
  }
  // he picks up: the timer runs while they talk
  async function pickUp(c, name, ok) {
    c.classList.remove('ringing'); c.classList.add('live');
    Sfx.ringStop();
    const sm = $('small', c);
    if (FAST) { sm.textContent = `0:0${Math.round(DUR[name])}`; return true; }
    const v = Sfx.voice(name), d = (Sfx.muted ? DUR[name] : Sfx.clipDur(name)) * 1000;
    const done = await anim(d, (p) => { sm.textContent = `0:0${Math.floor((p * d) / 1000)}`; }, E.lin, ok);
    if (!done) v.stop();
    return done;
  }

  // ---------- notifications: when everyone comes at once they stack, newest on top ----------
  function notifs(host) {
    const n = div('notifs', host, '<div class="n-head"><b class="n-count">0</b> unread</div><div class="n-list"></div>');
    show(n);
    n.count = 0; n.list = $('.n-list', n); n.num = $('.n-count', n);
    return n;
  }
  function notify(n, f, title, body, kind = '') {
    const it = document.createElement('div');
    it.className = `nt ${kind}`;
    it.innerHTML = `${avatar(f)}<div><b>${title}</b><p>${body}</p></div>`;
    n.list.prepend(it);
    show(it);
    n.num.textContent = ++n.count;
    [...n.list.children].slice(5).forEach((x) => x.remove());
    if (!FAST) Sfx.receive();
    return it;
  }

  // ---------- a "day" scene: Manan's face on a line, people cutting across, a camera ----------
  function scene(slide, Y) {
    const world = $('.world', slide), me = $('.face.me', slide), trail = $('.trail', slide), plan = $('.plan', slide);
    const others = $('.others', slide), people = $('.people', slide);
    const S = { pts: [], cam: { x: 800, y: 450, s: 1 }, me: { x: 230, y: Y }, people: [] };
    const face = (el, x, y, bob = 0) => { el.style.transform = `translate(${x}px, ${y + bob}px)`; el._x = x; el._y = y; };
    const drawTrail = () => trail.setAttribute('points', S.pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '));
    const camAt = (x, y, s) => {
      S.cam = { x, y, s };
      world.style.transform = `translate(${800 - x * s}px, ${450 - y * s}px) scale(${s})`;
      slide.classList.toggle('zoomed', s > 1.2);
    };
    // walk Manan along a polyline at an even speed; a one-frame bob makes it read as steps
    function sample(path, p) {
      const seg = []; let L = 0;
      for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); seg.push(l); L += l; }
      let d = p * L;
      for (let i = 0; i < seg.length; i++) {
        if (d <= seg[i] || i === seg.length - 1) { const q = seg[i] ? Math.min(1, d / seg[i]) : 1; return [path[i][0] + (path[i + 1][0] - path[i][0]) * q, path[i][1] + (path[i + 1][1] - path[i][1]) * q]; }
        d -= seg[i];
      }
      return path[path.length - 1];
    }
    function walk(el, path, ms, ok, { draw = el === me, ease = E.soft } = {}) {
      if (FAST) { if (draw) { S.pts.push(...path.slice(1)); drawTrail(); } const e = path[path.length - 1]; face(el, e[0], e[1]); return Promise.resolve(true); }
      return anim(ms, (p, raw) => {
        const [x, y] = sample(path, p);
        face(el, x, y, raw < 1 && frame % 2 ? -4 : 0);
        if (draw) { S.pts.push([x, y]); drawTrail(); }
      }, ease, ok);
    }
    function camera(x, y, s, ms, ok) {
      const c0 = { ...S.cam };
      return anim(ms, (p) => camAt(c0.x + (x - c0.x) * p, c0.y + (y - c0.y) * p, c0.s + (s - c0.s) * p), E.inOut, ok);
    }
    // someone from the team arrives along their own dotted path
    function person(from, to, f, ms, ok, delay = 0) {
      const el = div('face p', people, avatar(f));
      face(el, from[0], from[1]);
      const line = svg('path', { d: `M${from[0]} ${from[1]} L${from[0]} ${from[1]}` }, others);
      S.people.push({ el, line });
      const go = after(delay, ok, () => anim(ms, (p) => {
        const x = from[0] + (to[0] - from[0]) * p, y = from[1] + (to[1] - from[1]) * p;
        line.setAttribute('d', `M${from[0]} ${from[1]} L${x.toFixed(1)} ${y.toFixed(1)}`);
        face(el, x, y, frame % 2 && p < 1 ? -3 : 0);
      }, E.soft, ok));
      return { el, go };
    }
    function reset() {
      S.pts = [[230, Y]]; drawTrail();
      others.innerHTML = ''; people.innerHTML = ''; S.people = [];
      face(me, 230, Y); camAt(800, 450, 1);
      plan.setAttribute('d', `M230 ${Y} L1330 ${Y}`);
    }
    return { S, me, plan, face, walk, camera, person, reset, drawTrail };
  }

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
        cursorName('Manan');
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

  // 3. Why: dark slide, no cursor. The full stop becomes Manan on the next slide.
  // The slide is a forest-green grain field with arcs; after "I'll tell you why" rises, a hand-drawn line runs under "why".
  {
    const s = $('#s-why'), fc = $('.fieldc', s).getContext('2d'), line = $('.scribble path', s);
    GR.push({ slide: s, tick(f) { fc.drawImage(fieldOf('forest')[f % 3], 0, 0); } });
    hooks['s-why'] = {
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

  // 4. The path: a normal day. Manan on the left, the goal on the right, the team walking into his line.
  // Nobody in particular: everyone is an anonymous grain disc.
  {
    const s = $('#s-path'), Y = 560, D = scene(s, Y);
    const talk = $('.talk', s), clock = $('.clock', s), cb = $('b', clock), cs = $('small', clock), goal = $('.goal', s), cap = $('.caption', s);
    let mins = 600;
    const clockAt = (m) => { mins = m; const h = Math.floor(m / 60), mm = Math.floor(m % 60); cb.textContent = `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')}`; cs.textContent = h < 12 ? 'am' : 'pm'; };
    const clockTo = (m, ms, ok) => { const m0 = mins; return anim(ms, (p) => clockAt(m0 + (m - m0) * p), E.lin, ok); };
    // every close-up puts the two of them on the left half and the conversation on the right
    const zoomOn = (mx, ok) => D.camera(mx + 172, Y - 20, 2.3, 750, ok);
    const zoomOut = (ok) => D.camera(800, 450, 1, 667, ok);
    const clearTalk = () => {
      const old = $$('.talk > *', s);
      if (FAST) { old.forEach((b) => b.remove()); return; }
      old.forEach((b) => b.classList.remove('in'));
      setTimeout(() => old.forEach((b) => b.remove()), 450);
    };
    // the straight line he planned slowly bends out of shape
    const wave = (amp) => { let d = `M230 ${Y}`; for (let x = 240; x <= 1330; x += 10) d += ` L${x} ${(Y + Math.sin(x / 38) * amp * Math.sin(((x - 230) / 1100) * Math.PI)).toFixed(1)}`; D.plan.setAttribute('d', d); };
    // where the whole team ends up around him, and where each one walks in from
    const RING = Array.from({ length: 10 }, (_, i) => {
      const a = ((50 + i * (260 / 9)) * Math.PI) / 180;   // the right side stays clear: that's where the goal is
      return { to: [930 + 300 * Math.cos(a), 540 + 230 * Math.sin(a)], from: [930 + 900 * Math.cos(a), 540 + 700 * Math.sin(a)] };
    });
    // everything that lands at once: [ms, who, title, preview, kind, voice clip]
    const RUSH = [
      [600, 0, 'New message', 'Manan?'],
      [1000, 1, 'Voice note', SAYS.vn2, 'vn', 'vn2'],
      [1500, 2, 'New message', 'Can you make a quick post for tomorrow?'],
      [1900, 3, 'Missed call', 'Called you for a minute', 'call'],
      [2300, 4, 'New message', 'Need a QR code, fast'],
      [2700, 5, 'Voice note', SAYS.vn3, 'vn', 'vn3'],
      [3050, 6, 'New message', 'That button colour looks off'],
      [3350, 7, 'New message', 'Manan??'],
      [3650, 8, 'Missed call', 'Called you for a minute', 'call'],
      [3950, 9, 'New message', 'Can you send me the deck?'],
      [4250, 1, 'New message', 'Small change on the banner'],
      [4550, 4, 'New message', 'Also, one more thing.'],
    ];
    const P = {};
    function reset() {
      D.reset(); talk.innerHTML = ''; clockAt(600); clock.classList.remove('late');
      goal.classList.remove('failed'); cap.classList.remove('show'); s.classList.remove('ended', 'milo');
    }
    async function play(n, ok) {
      if (n === 0) {
        cursorOff();
        return anim(667, (p) => D.plan.setAttribute('d', `M230 ${Y} L${230 + 1100 * p} ${Y}`), E.out, ok);
      }
      if (n === 1) {
        // he sets off; someone walks into his line and texts
        const a = D.person([640, -90], [640, Y], fam(0), 1000, ok, 750); P.a = a.el;
        if (!(await all(D.walk(D.me, [[230, Y], [470, Y]], 1750, ok), clockTo(640, 1750, ok), a.go))) return false;
        if (!(await zoomOn(470, ok))) return false;
        const t = thread(talk, fam(0));
        if (!(await textIn(t, 'Hey Manan, can you help me with this?', ok))) return false;
        if (!(await hold(900, ok))) return false;
        reply(t, 'All right, what do you need?');
        if (!(await hold(900, ok))) return false;
        return textIn(t, 'Just a small thing, two minutes.', ok);
      }
      if (n === 2) {
        // he follows them off his path, comes back, and the next one is already there with a voice note
        clearTalk();
        if (!(await zoomOut(ok))) return false;
        if (!(await all(
          D.walk(P.a, [[640, Y], [700, 400], [780, 260], [900, 170], [1010, -120]], 2000, ok),
          D.walk(D.me, [[470, Y], [560, 430], [680, 300], [790, 250]], 1500, ok),
          clockTo(730, 1500, ok),
        ))) return false;
        P.a.classList.add('gone');
        if (!(await all(D.walk(D.me, [[790, 250], [730, 420], [690, Y]], 900, ok), clockTo(770, 900, ok)))) return false;
        const b = D.person([990, 1020], [990, Y], fam(1), 1000, ok, 200); P.b = b.el;
        if (!(await all(D.walk(D.me, [[690, Y], [820, Y]], 1000, ok), clockTo(800, 1000, ok), b.go))) return false;
        if (!(await zoomOn(820, ok))) return false;
        const t = thread(talk, fam(1));
        const v = voiceIn(t, 'vn1');
        if (!(await v.play(ok))) return false;
        if (!(await hold(400, ok))) return false;
        reply(t, 'Okay, send it over.');
        return true;
      }
      if (n === 3) {
        // another detour, then a call. He picks up.
        clearTalk();
        if (!(await zoomOut(ok))) return false;
        if (!(await all(
          D.walk(P.b, [[990, Y], [1010, 700], [1100, 800], [1210, 1030]], 1800, ok),
          D.walk(D.me, [[820, Y], [880, 690], [960, 770], [1010, 760]], 1400, ok),
          clockTo(860, 1400, ok),
        ))) return false;
        P.b.classList.add('gone');
        const c = D.person([1070, -90], [1070, Y], fam(2), 1000, ok, 300); P.c = c.el;
        if (!(await all(D.walk(D.me, [[1010, 760], [940, 650], [900, Y]], 900, ok), clockTo(890, 900, ok), c.go))) return false;
        if (!(await zoomOn(900, ok))) return false;
        const card = call(talk, fam(2));
        if (!(await ringFor(card, 2, ok))) return false;
        const btn = $('.yes', card), bx = at(btn);
        if (!FAST) { cursorName('Manan'); cursorAt(1700, 900); }
        if (!(await cursorTo(bx.x + bx.w / 2, bx.y + bx.h / 2, 667, ok))) return false;
        if (!(await click(ok))) return false;
        cursorOff();
        return pickUp(card, 'vn4', ok);
      }
      if (n === 4) {
        // then the whole team, at once
        clearTalk();
        if (!(await zoomOut(ok))) return false;
        if (!(await all(
          D.walk(P.c, [[1070, Y], [1100, 400], [1180, 200], [1260, -120]], 1500, ok),
          D.walk(D.me, [[900, Y], [990, 430], [1030, 330], [990, 450], [970, Y]], 1500, ok),
          clockTo(930, 1500, ok),
        ))) return false;
        P.c.classList.add('gone');
        const N = notifs(talk);
        const ps = RING.map((r, i) => D.person(r.from, r.to, fam(i), 900, ok, i * 180));
        const near = (i) => [930 + 0.5 * (RING[i].to[0] - 930), 540 + 0.5 * (RING[i].to[1] - 540)];
        return all(
          ...ps.map((p) => p.go),
          ...RUSH.map(([ms, who, title, body, kind = '', clip]) => after(ms, ok, () => {
            notify(N, fam(who), title, body, kind);
            if (!FAST && clip) Sfx.voice(clip, 0.7);
            if (!FAST && kind === 'call') { Sfx.ringStart(); after(1500, ok, () => { Sfx.ringStop(); return true; }); }
            return true;
          })),
          after(800, ok, () => D.walk(D.me, [[970, Y], near(0), near(3), near(6), near(8), near(2), near(5), [960, Y]], 4000, ok, { ease: E.lin })),
          clockTo(1060, 5000, ok),
          anim(5000, (p) => wave(26 * p), E.lin, ok),
        );
      }
      if (n === 5) {
        // six o'clock. Nobody reached the thing that mattered.
        Sfx.stopVoices();
        if (!(await clockTo(1080, 500, ok))) return false;
        clock.classList.add('late');
        $$('.face.p', s).forEach((e) => e.classList.add('gone'));
        clearTalk();
        goal.classList.add('failed'); s.classList.add('ended');
        // the camera pushes in on the gap: him on one side, the goal he never reached on the other
        if (!(await D.camera(1145, 560, 1.6, 1000, ok))) return false;
        cap.classList.add('show');
        return true;
      }
      if (n === 6) {
        // he can't do his work, so he texts Milo
        s.classList.add('milo');
        if (!(await hold(500, ok))) return false;
        const t = thread(talk, 'lime'); P.milo = t;
        t.classList.add('milo-chat'); $('.th-head .av', t).remove(); $('.th-head b', t).textContent = 'Milo';
        if (!(await hold(500, ok))) return false;
        reply(t, "Milo, I don't feel like I do much work.");
        if (!(await hold(900, ok))) return false;
        reply(t, "I'm really anxious. I don't know what to do about it.");
        if (!(await hold(1100, ok))) return false;
        if (!(await textIn(t, 'Tell this to your girlfriend.', ok))) return false;
        if (!(await hold(900, ok))) return false;
        return textIn(t, "Oh wait, you don't have one. lol", ok);
      }
      if (n === 7) return textIn(P.milo, "It's okay, I'm there for you.", ok);
      return true;
    }
    hooks['s-path'] = { ...stepped_slide(reset, play), leave() { Sfx.stopVoices(); Sfx.ringStop(); cursorOff(); } };
  }

  // 5. Sort: the requests from the day fall into a pile, then into two columns.
  {
    const s = $('#s-sort'), cards = $$('.req', s);
    cards.forEach((c, i) => c.insertAdjacentHTML('afterbegin', avatar(fam(i))));   // whoever asked
    let pile = null, target = null;
    const put = (c, x, y, o = 1) => { c.style.transform = `translate(${x}px, ${y}px)`; c.style.opacity = o; c._x = x; c._y = y; };
    const flow = (list, x0, x1, y0, rowH, centre) => {
      const out = new Map(); let rows = [[]], w = 0;
      list.forEach((c) => { const cw = c.offsetWidth; if (w + cw > x1 - x0 && rows.at(-1).length) { rows.push([]); w = 0; } rows.at(-1).push(c); w += cw + 20; });
      rows.forEach((r, ri) => {
        const total = r.reduce((a, c) => a + c.offsetWidth, 0) + 20 * (r.length - 1);
        let x = centre ? x0 + (x1 - x0 - total) / 2 : x0;
        r.forEach((c, ci) => { out.set(c, [x, y0 + ri * rowH + (centre ? ((ri * 3 + ci * 5) % 4) * 9 - 13 : 0)]); x += c.offsetWidth + 20; });
      });
      return out;
    };
    const layout = () => {
      pile = flow(cards, 150, 1450, 430, 108, true);
      const L = cards.filter((c) => c.dataset.side === 'l'), R = cards.filter((c) => c.dataset.side === 'r');
      target = new Map([...flow(L, 96, 516, 410, 92, false), ...flow(R, 576, 1504, 410, 92, false)]);   // the short list gets the narrow column
    };
    // the heading change: "Doesn't need me" breaks into dots that fly into "Needs you + Claude", taking its grain colour
    const was = $('.col-h .was', s), nowCv = $('.col-h .now canvas', s), dust = document.createElement('canvas');
    dust.className = 'dust'; dust.width = 1600; dust.height = 900; s.appendChild(dust);
    const dc = dust.getContext('2d');
    function sample() {
      // where the old words are, as dots
      const a = at(was), o = document.createElement('canvas'); o.width = Math.ceil(a.w) + 20; o.height = Math.ceil(a.h) + 20;
      const oc = o.getContext('2d'); oc.font = '400 56px "Hedvig Letters Serif"'; oc.textBaseline = 'top'; oc.fillStyle = '#000';
      oc.fillText(was.textContent, 0, (a.h - 56) / 2);   // the line box is centred on the em box
      const od = oc.getImageData(0, 0, o.width, o.height).data, from = [];
      for (let y = 0; y < o.height; y += 2) for (let x = 0; x < o.width; x += 2) if (od[(y * o.width + x) * 4 + 3] > 120) from.push([a.x + x, a.y + y]);
      // where the new words will be, as dots in their grain colour (the canvas is painted at 2x)
      const F = nowCv.frames && nowCv.frames(); if (!F) return null;
      s.classList.add('swapped'); const b = at(nowCv); s.classList.remove('swapped');
      const t = F[0], td = t.getContext('2d').getImageData(0, 0, t.width, t.height).data, to = [];
      for (let y = 0; y < t.height; y += 4) for (let x = 0; x < t.width; x += 4) { const i = (y * t.width + x) * 4; if (td[i + 3] > 120) to.push([b.x + x / 2, b.y + y / 2, td[i], td[i + 1], td[i + 2]]); }
      for (let i = to.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [to[i], to[j]] = [to[j], to[i]]; }
      const n = Math.max(from.length, to.length);
      return Array.from({ length: n }, (_, i) => {
        const f = from[i % from.length], d = to[i % to.length];
        return { f, d, m: [f[0] + (Math.random() - 0.5) * 220, f[1] - 40 - Math.random() * 120], delay: Math.random() * 0.35 };
      });
    }
    async function morph(ok) {
      const P = sample();
      if (!P) { s.classList.add('swapped'); return true; }
      s.classList.add('morphing');
      const done = await anim(1500, (p) => {
        dc.clearRect(0, 0, 1600, 900);
        for (const q of P) {
          const t = Math.min(1, Math.max(0, (p - q.delay) / 0.65)), e = E.inOut(t), u = 1 - e;
          const x = u * u * q.f[0] + 2 * u * e * q.m[0] + e * e * q.d[0], y = u * u * q.f[1] + 2 * u * e * q.m[1] + e * e * q.d[1];
          dc.fillStyle = `rgb(${32 + (q.d[2] - 32) * e | 0}, ${32 + (q.d[3] - 32) * e | 0}, ${32 + (q.d[4] - 32) * e | 0})`;
          dc.fillRect(x, y, 2, 2);
        }
      }, E.lin, ok);
      dc.clearRect(0, 0, 1600, 900);
      s.classList.remove('morphing'); s.classList.add('swapped');
      return done;
    }
    function reset() { s.classList.remove('swapped', 'morphing'); dc.clearRect(0, 0, 1600, 900); cards.forEach((c) => { const [x, y] = pile.get(c); put(c, x, y, 0); c.classList.remove('mine'); }); }
    async function play(n, ok) {
      if (n === 1) return all(...cards.map((c, i) => { const [x, y] = pile.get(c); return after(i * 2 * FR, ok, () => { if (!FAST) Sfx.paper(); return anim(500, (p) => put(c, x, y - 70 * (1 - p), p), E.out, ok); }); }));
      if (n === 2) return all(...cards.map((c, i) => {
        const [x0, y0] = pile.get(c), [x1, y1] = target.get(c);
        return after(i * FR, ok, () => { c.classList.toggle('mine', c.dataset.side === 'l'); return anim(667, (p) => put(c, x0 + (x1 - x0) * p, y0 + (y1 - y0) * p - Math.sin(Math.PI * p) * 60), E.inOut, ok); });
      }));
      if (n === 3) { if (FAST) { s.classList.add('swapped'); return true; } return morph(ok); }
      return true;
    }
    const base = stepped_slide(reset, play);
    hooks['s-sort'] = { enter() { cursorOff(); layout(); base.enter(); }, step: base.step };
  }

  // 6. How I do it: each kind of thing as a grain object with its parts drawn in; the cursor opens each one.
  {
    const s = $('#s-made'), figs = $$('figure', s);
    hooks['s-made'] = {
      async step(n, dir) {
        figs.forEach((f, i) => f.classList.toggle('back', i < n - 1));
        const ok = guard();
        if (n === 0) { if (dir > 0) cursorTo(1320, 240, 900, ok); return; }
        const b = at(figs[n - 1]);
        if (await cursorTo(b.x + b.w * 0.62, b.y + 170, 583, ok)) click(ok);
      },
    };
  }

  // 7. The workflow: after the intro, each step is a whole grain screen wiping in from the bottom right.
  {
    const s = $('#s-loop'), scr = $$('.scrn', s), ctx = scr.map((e) => $('.fieldc', e).getContext('2d'));
    let shown = 0;
    const paint = (i, f) => ctx[i].drawImage(fieldOf(scr[i].dataset.fam)[f % 3], 0, 0);
    // only the top screen and the one under it (seen during the wipe) need to boil
    GR.push({ slide: s, tick(f) { for (const i of [shown - 2, shown - 1]) if (i >= 0) paint(i, f); } });
    hooks['s-loop'] = {
      enter() { cursorOff(); },
      step(n) { shown = n; scr.forEach((e, i) => { e.classList.toggle('on', i < n); if (i < n) paint(i, frame); }); },
    };
  }

  // 8. Every correction becomes a rule: typed and sent. The send button stretches down into a blush grain card
  // under the input, and every rule sent lands in it as a pill. Then the card folds into one file.
  {
    const s = $('#s-rules'), typed = $('.typed', s), send = $('.send', s), file = $('.file', s), count = $('.n', file);
    const card = $('.xcard', s), cc = $('.fieldc', card).getContext('2d'), pills = $('.pills', card);
    const RULES = ['No bouncy motion. Ever.', 'Colour lives in illustrations only.', 'Light mode. No labels.', 'One review link, always.', 'Nothing under 26px.', 'Plain words. No emojis.', 'Copy the reference frame by frame.', 'Back is a caret in a circle.', 'Price is never the loudest thing.'];
    const CARD = { x: 260, y: 392, w: 1080, h: 320, r: 40 };   // under the input, same width
    let open = false;
    const btn = () => { const b = at(send); return { x: b.x, y: b.y, w: b.w, h: b.h, r: b.h / 2 }; };
    const rect = (q) => Object.assign(card.style, { left: q.x + 'px', top: q.y + 'px', width: q.w + 'px', height: q.h + 'px', borderRadius: q.r + 'px' });
    const mix = (a, b, p) => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p, h: a.h + (b.h - a.h) * p, r: a.r + (b.r - a.r) * p });
    const fileRect = () => { const b = at(file); return { x: b.x, y: b.y, w: b.w, h: b.h, r: 28 }; };
    GR.push({ slide: s, tick(f) { if (open) cc.drawImage(fieldOf('blush')[f % 3], 0, 0, 800, 450, 0, 0, 540, 195); } });
    const pill = (t) => { const p = document.createElement('span'); p.className = 'pill'; p.textContent = t; pills.appendChild(p); };
    function type(el, text, ok) {
      let last = 0;
      return anim(text.length * FR, (p) => { const k = Math.round(p * text.length); if (k !== last && k % 2 === 0 && !FAST) Sfx.key(); last = k; el.textContent = text.slice(0, k); }, E.lin, ok);
    }
    // the cursor presses send: the button dips, the words leave the field
    async function press(ok) {
      if (!(await click(ok))) return false;
      send.classList.add('pressed'); setTimeout(() => send.classList.remove('pressed'), 250);
      typed.textContent = '';
      if (!FAST) Sfx.send();
      return true;
    }
    function reset() {
      typed.textContent = ''; pills.innerHTML = ''; open = false;
      card.style.opacity = 0; card.classList.remove('folding'); rect({ x: 0, y: 0, w: 0, h: 0, r: 0 });
      file.classList.remove('show'); count.textContent = '0';
    }
    async function play(n, ok) {
      if (n === 1) {
        if (!(await cursorTo(1060, 330, 667, ok))) return false;
        if (!(await type(typed, RULES[0], ok))) return false;
        const b = btn();
        if (!(await cursorTo(b.x + b.w / 2, b.y + b.h / 2, 417, ok))) return false;
        if (!(await press(ok))) return false;
        // the button itself stretches down and becomes the card
        open = true; card.style.opacity = 1; cc.drawImage(fieldOf('blush')[frame % 3], 0, 0, 800, 450, 0, 0, 540, 195);
        if (!(await anim(750, (p) => rect(mix(b, CARD, p)), E.inOut, ok))) return false;
        pill(RULES[0]);
        return true;
      }
      if (n === 2) {
        // the rest, sent one after another
        for (let i = 1; i < RULES.length; i++) {
          typed.textContent = RULES[i];
          if (!(await hold(250, ok))) return false;
          if (!(await press(ok))) return false;
          pill(RULES[i]);
          if (!(await hold(125, ok))) return false;
        }
        return true;
      }
      if (n === 3) {
        // the card folds into one file
        cursorOff();
        card.classList.add('folding');
        if (!(await anim(667, (p) => rect(mix(CARD, fileRect(), p)), E.inOut, ok))) return false;
        card.style.opacity = 0; open = false;
        file.classList.add('show');
        return anim(1000, (p) => { count.textContent = Math.round(40 * p); }, E.out, ok);
      }
      return true;
    }
    hooks['s-rules'] = stepped_slide(reset, play);
  }

  // 9. Skills: the file opens into four.
  {
    const s = $('#s-skills'), cards = $$('.sk', s);
    hooks['s-skills'] = {
      async step(n, dir) {
        cards.forEach((c, i) => c.classList.toggle('back', i < n - 1));
        const ok = guard();
        if (n === 0) { if (dir > 0) cursorTo(1330, 230, 900, ok); return; }
        const b = at(cards[n - 1]);
        if (await cursorTo(b.x + b.w * 0.55, b.y + 90, 583, ok)) click(ok);
      },
    };
  }

  // 10. Your turn: the cursor is theirs now. It drags the skill into an empty composer (the border glows the skill's
  // colour), types, sends; Claude answers; one more line from them; Claude starts making it.
  {
    const s = $('#s-try'), comp = $('.composer2', s), slot = $('.slot', s), typed = $('.typed', s), send = $('.send2', s), chip = $('.att', s), chat = $('.chat', s), gen = $('.gen', s);
    const ring = $('.ring', s), rc = ring.getContext('2d');
    // the glowing border: the input's edge plus a halo, dithered into dots (painted once per size), coloured with blush grain
    const PAD = 40, masks = {};
    function ringMasks(W, H, w, h) {
      const key = W + 'x' + H;
      if (masks[key]) return masks[key];
      const soft = document.createElement('canvas'); soft.width = W; soft.height = H;
      const sc = soft.getContext('2d');
      sc.shadowColor = 'rgba(0, 0, 0, .85)'; sc.shadowBlur = 20; sc.lineWidth = 5; sc.strokeStyle = '#000';
      sc.beginPath(); sc.roundRect(PAD + 1, PAD + 1, w - 2, h - 2, 28); sc.stroke();
      const src = sc.getImageData(0, 0, W, H).data;
      return (masks[key] = Array.from({ length: 3 }, () => {
        const m = document.createElement('canvas'); m.width = W; m.height = H;
        const mc = m.getContext('2d'), img = mc.createImageData(W, H), o = img.data;
        for (let i = 3; i < o.length; i += 4) if (Math.random() < src[i] / 255) o[i] = 255;   // keep a dot where the glow is strong enough
        mc.putImageData(img, 0, 0);
        return m;
      }));
    }
    // the ripple when the skill lands: rings spreading from where it dropped, fading out, dithered into grain
    const spark = $('.sparkle', s), sc2 = spark.getContext('2d');
    let ripple = null, speckle = null;
    function drawRipple(f) {
      if (!ripple) return;
      const b = at(comp), W = Math.round(b.w + PAD * 2), H = Math.round(b.h + PAD * 2), p = (f - ripple.f0) / 12;
      if (spark.width !== W || spark.height !== H) { spark.width = W; spark.height = H; }
      Object.assign(spark.style, { left: b.x - PAD + 'px', top: b.y - PAD + 'px', width: W + 'px', height: H + 'px' });
      sc2.globalCompositeOperation = 'source-over'; sc2.clearRect(0, 0, W, H);
      if (p >= 1) { ripple = null; return; }
      const maxR = Math.hypot(W, H) * 0.75;
      for (let k = 0; k < 3; k++) {
        const q = p - k * 0.14; if (q <= 0) continue;
        sc2.beginPath(); sc2.arc(ripple.x - (b.x - PAD), ripple.y - (b.y - PAD), q * maxR, 0, 2 * Math.PI);
        sc2.lineWidth = 46 * (1 - q) + 6; sc2.strokeStyle = `rgba(0, 0, 0, ${(1 - q) * (k ? 0.6 : 1)})`;
        sc2.shadowColor = 'rgba(0, 0, 0, .8)'; sc2.shadowBlur = 24; sc2.stroke();
      }
      sc2.shadowBlur = 0;
      // a scatter of single dots, different each frame, turns the soft rings into grain
      speckle = speckle || Array.from({ length: 3 }, () => {
        const d = document.createElement('canvas'); d.width = 1400; d.height = 500;
        const x = d.getContext('2d'), img = x.createImageData(1400, 500);
        for (let i = 3; i < img.data.length; i += 4) if (Math.random() < 0.55) img.data[i] = 255;
        x.putImageData(img, 0, 0); return d;
      });
      sc2.globalCompositeOperation = 'destination-in'; sc2.drawImage(speckle[f % 3], 0, 0);
      sc2.globalCompositeOperation = 'source-in'; sc2.drawImage(fieldOf('blush')[f % 3], 0, 0, 800, 450, 0, 0, W, H);
      sc2.globalCompositeOperation = 'source-over';
    }
    let glowing = false;
    function drawRing(f) {
      const b = at(comp), W = Math.round(b.w + PAD * 2), H = Math.round(b.h + PAD * 2);
      if (ring.width !== W || ring.height !== H) { ring.width = W; ring.height = H; }
      Object.assign(ring.style, { left: b.x - PAD + 'px', top: b.y - PAD + 'px', width: W + 'px', height: H + 'px' });
      rc.globalCompositeOperation = 'source-over'; rc.clearRect(0, 0, W, H);
      rc.drawImage(ringMasks(W, H, b.w, b.h)[f % 3], 0, 0);
      rc.globalCompositeOperation = 'source-in'; rc.drawImage(fieldOf('blush')[f % 3], 0, 0, 800, 450, 0, 0, W, H);
      if (reveal) {
        const r = E.inOut(Math.min(1, (f - reveal.f0) / 9));
        if (r >= 1) { reveal = null; comp.classList.add('glow'); }
        else {
          const cx = W / 2, cy = H / 2, a0 = Math.atan2(reveal.y - (b.y - PAD) - cy, reveal.x - (b.x - PAD) - cx);
          rc.globalCompositeOperation = 'destination-in';
          rc.beginPath(); rc.moveTo(cx, cy); rc.arc(cx, cy, W + H, a0 - r * Math.PI - 0.15, a0 + r * Math.PI + 0.15); rc.closePath(); rc.fill();
        }
      }
      rc.globalCompositeOperation = 'source-over';
    }
    // reveal: while it's set, only a growing slice of the ring shows, opening both ways from where the skill sits
    let reveal = null;
    const glow = (on, from) => {
      glowing = on; comp.classList.toggle('glow', on && !from); ring.classList.toggle('on', on);   // the plain border stays until the glow has gone all the way round
      reveal = on && from ? { f0: frame, ...from } : null;
      if (on) drawRing(frame);
    };
    GR.push({ slide: s, tick(f) { if (glowing) drawRing(f); drawRipple(f); } });
    chat.body = chat;   // so the chat helpers (addMsg, textIn) can use it as a thread
    const ASK = 'Turn my townhall PDF into an interactive deck.';
    const MORE = 'Keep the headings word for word, and add a quiz at the end.';
    const HOME = { x: 960, y: 108 };
    const place = (q) => { chip.style.left = q.x + 'px'; chip.style.top = q.y + 'px'; };
    const typeIn = (text, ok) => {
      let last = 0;
      return anim(Math.ceil(text.length / 3) * FR, (p) => { const k = Math.round(p * text.length); if (k !== last && k % 3 === 0 && !FAST) Sfx.key(); last = k; typed.textContent = text.slice(0, k); }, E.lin, ok);
    };
    async function pressSend(ok) {
      const b = at(send);
      if (!(await cursorTo(b.x + b.w / 2, b.y + b.h / 2, 500, ok))) return false;
      if (!(await click(ok))) return false;
      send.classList.add('pressed'); setTimeout(() => send.classList.remove('pressed'), 250);
      if (!FAST) Sfx.send();
      return true;
    }
    // the skill as it appears inside the sent message: a small copy, its shape as a still
    const sentChip = () => `<span class="att"><span class="mark"><img src="${$('canvas', chip).toDataURL()}" width="44" height="44" alt=""></span><span class="lab"><b>aha-interactive-deck</b></span></span>`;
    function reset() {
      chat.innerHTML = ''; gen.classList.remove('done'); s.appendChild(gen); typed.textContent = '';
      comp.classList.remove('has-skill'); glow(false); ripple = null; comp.style.transform = ''; sc2.clearRect(0, 0, spark.width, spark.height);
      chip.classList.remove('lifted', 'in-slot', 'give'); s.insertBefore(chip, chat); chip.style.opacity = 1; place(HOME);
    }
    async function play(n, ok) {
      if (n === 0) { const b = at(comp); return cursorTo(b.x + b.w - 200, b.y - 70, 900, ok); }
      if (n === 1) {
        // pick the skill up, carry it down into the composer, let go
        const from = at(chip);
        if (!(await cursorTo(from.x + 60, from.y + 50, 667, ok))) return false;
        C.el.classList.add('down'); chip.classList.add('lifted');
        if (!FAST) Sfx.tap();
        // where it will land once the input has opened up, measured up front
        comp.classList.add('has-skill');
        const to = at(slot); to.x += comp.clientLeft; to.y += comp.clientTop;
        // the input opens while the skill is in the air, so the two meet in one motion
        if (!FAST) slot.style.height = '0px';
        const flown = await anim(1000, (p, raw) => {
          const x = from.x + (to.x - from.x) * p, y = from.y + (to.y - from.y) * p - Math.sin(Math.PI * p) * 36;
          place({ x, y }); cursorAt(x + 60, y + 50);
          if (!FAST) slot.style.height = (116 * E.out(raw)).toFixed(1) + 'px';
        }, E.inOut, ok);
        slot.style.height = '';
        if (!flown) return false;
        C.el.classList.remove('down'); chip.classList.remove('lifted');
        chip.classList.add('in-slot'); chip.style.left = chip.style.top = ''; slot.appendChild(chip);
        // something landed in it: the whole input is pushed back, springs up past where it was, and settles;
        // then the grain border and its glow come up
        if (!FAST) {
          Sfx.chime();
          const ok2 = ok, sc = (p) => (p < 0.3 ? 1 - 0.05 * E.out(p / 0.3) : p < 0.65 ? 0.95 + 0.075 * E.inOut((p - 0.3) / 0.35) : 1.025 - 0.025 * E.inOut((p - 0.65) / 0.35));
          if (!(await anim(833, (p, raw) => { comp.style.transform = `scale(${sc(raw).toFixed(4)})`; }, E.lin, ok2))) { comp.style.transform = ''; return false; }
          comp.style.transform = '';
        }
        // then the skill gives the input its glow: the pentagon pulses and the grain spreads from it round the rim
        const k = at(chip);
        chip.classList.remove('give'); void chip.offsetWidth; chip.classList.add('give');
        glow(true, FAST ? null : { x: k.x + 50, y: k.y + k.h / 2 });
        return cursorTo(to.x + 640, to.y - 40, 500, ok);
      }
      if (n === 2) {
        // write what you need, send it; Claude answers
        if (!(await typeIn(ASK, ok))) return false;
        if (!(await pressSend(ok))) return false;
        addMsg(chat, `${sentChip()}<span>${ASK}</span>`, true);
        typed.textContent = ''; chip.style.opacity = 0; comp.classList.remove('has-skill'); glow(false);
        if (!(await hold(700, ok))) return false;
        return textIn(chat, `${sticker('sparkle')}On it. Aha colours, one idea per click. Anything you want kept word for word?`, ok);
      }
      if (n === 3) {
        // one more line, and Claude starts making it
        if (!(await typeIn(MORE, ok))) return false;
        if (!(await pressSend(ok))) return false;
        addMsg(chat, MORE, true);
        typed.textContent = '';
        if (!(await hold(600, ok))) return false;
        addMsg(chat, '', false, 'genmsg').appendChild(gen);
        // the bar fills, then the message is just the deck's illustration
        if (!(await hold(2125, ok))) return false;
        gen.classList.add('done');
        return true;
      }
      return true;
    }
    const base = stepped_slide(reset, play);
    hooks['s-try'] = { enter() { cursorName('You', true); base.enter(); }, step: base.step, leave() { cursorName('Manan'); } };
  }

  // Taste, in black and white: every letter of "taste." flips through typefaces on its own, fast at first, then
  // slower and slower until it settles. They land left to right into a mix, like a type specimen,
  // and each landing brings one of the four grain shapes into focus: the only colour on the page.
  {
    const s = $('#s-taste'), letters = $$('.taste span', s), shapes = $$('.tshape', s);
    // a shape comes into focus from a blur, turning a little as it settles (the grain entrance)
    const hide = (el) => { el.style.opacity = 0; el.style.filter = 'blur(18px)'; el.style.transform = 'scale(.8) rotate(-14deg)'; };
    const focus = (el, ok) => anim(625, (p) => {
      el.style.opacity = Math.min(1, p * 1.6);
      el.style.filter = p < 1 ? `blur(${(18 * (1 - p)).toFixed(1)}px)` : 'none';
      el.style.transform = `scale(${0.8 + 0.2 * p}) rotate(${-14 * (1 - p)}deg)`;
    }, E.out, ok);
    let landed = 0, ok = () => false;
    const POOL = [
      ['Fraunces', 'normal', 900], ['Playfair Display', 'italic', 700], ['Syne', 'normal', 800], ['Shrikhand', 'normal', 400],
      ['Space Mono', 'normal', 700], ['Bodoni Moda', 'normal', 800], ['Unbounded', 'normal', 800], ['Caveat', 'normal', 700],
      ['DM Serif Display', 'italic', 400], ['Major Mono Display', 'normal', 400], ['Bricolage Grotesque', 'normal', 800],
      ['Anton', 'normal', 400], ['Pixelify Sans', 'normal', 700], ['Silkscreen', 'normal', 400], ['Instrument Serif', 'italic', 400],
    ];
    // where each letter lands: italic serif, Didone, pixel, condensed, italic display, a round black stop
    const FINAL = [['Instrument Serif', 'italic', 400], ['Bodoni Moda', 'normal', 800], ['Pixelify Sans', 'normal', 700], ['Anton', 'normal', 400], ['Playfair Display', 'italic', 700], ['Fraunces', 'normal', 900]];
    // frames between changes: a burst of quick flips, then easing out to a stop
    const GAPS = [1, 1, 1, 1, 1, 1, 2, 3, 4];
    POOL.forEach(([f, st, w]) => document.fonts.load(`${st} ${w} 100px "${f}"`, 'taste.').catch(() => {}));
    const wear = (el, [f, st, w]) => { el.style.fontFamily = `"${f}", var(--serif)`; el.style.fontStyle = st; el.style.fontWeight = w; };
    let L = [];
    function start(at) {
      // letter i takes one more quick flip than the one before it, so they settle left to right
      L = letters.map((el, i) => ({ el, i, k: 0, flips: GAPS.length + i, next: at, done: false, last: -1 }));
    }
    GR.push({
      slide: s,
      tick(f) {
        for (const l of L) {
          if (l.done || f < l.next) continue;
          if (l.k >= l.flips) { wear(l.el, FINAL[l.i]); l.done = true; Sfx.tap(); if (shapes[landed]) focus(shapes[landed], ok); landed++; continue; }   // each landing brings a shape in
          let p; do { p = (Math.random() * POOL.length) | 0; } while (p === l.last);
          l.last = p; wear(l.el, POOL[p]);
          const g = l.k - (l.flips - GAPS.length);
          l.next = f + (g < 0 ? 1 : GAPS[g]);
          l.k++;
        }
      },
    });
    hooks['s-taste'] = {
      // the word starts flipping as it comes into focus, after the two lines above it
      enter() { cursorOff(); ok = guard(); landed = 0; shapes.forEach(hide); letters.forEach((el, i) => wear(el, POOL[(i * 5) % POOL.length])); start(frame + 3); },
    };
  }

  // 11. Hand-off: the mail with the skills. Manan sends the real one live, comes back and clicks: the mail goes,
  // and all ten on the team get it.
  {
    const s = $('#s-handoff'), zip = $('.zip', s), mail = $('.mail', s), sendBtn = $('.msend', s), sent = $('.sent', s), crew = $('.crew', s);
    crew.innerHTML = Array.from({ length: 10 }, (_, i) => avatar(fam(i))).join('');
    const avs = $$('.av', crew);
    function reset() {
      mail.style.opacity = 1; mail.style.transform = 'none'; sent.style.opacity = 0;
      avs.forEach((a) => a.classList.remove('in'));
    }
    async function play(n, ok) {
      if (n === 0) { cursorOff(); return true; }   // nothing over the mail while it's being read
      if (n === 1) {
        const b = at(sendBtn);
        if (!FAST) cursorAt(1700, 960);   // comes in from the corner, only to press Send
        if (!(await cursorTo(b.x + b.w / 2, b.y + b.h / 2, 667, ok))) return false;
        if (!(await click(ok))) return false;
        if (!FAST) Sfx.send();
        cursorOff();
        // the mail flies off up and to the right
        if (!(await anim(583, (p) => { mail.style.opacity = 1 - p; mail.style.transform = `translate(${160 * p}px, ${-120 * p}px) scale(${1 - 0.25 * p}) rotate(${6 * p}deg)`; }, E.inOut, ok))) return false;
        sent.style.opacity = 1;
        // and lands with everyone, one after another
        for (let i = 0; i < avs.length; i++) { avs[i].classList.add('in'); if (!FAST && i % 3 === 0) Sfx.receive(); if (!(await hold(125, ok))) return false; }
        return true;
      }
      return true;
    }
    hooks['s-handoff'] = stepped_slide(reset, play);
  }

  // Now you just do this: three steps, one per click; the last click clears them for "Make anything."
  {
    const s = $('#s-do'), steps = $$('.stp', s);
    // each card shows the bottom-right of its field at the card's own shape, so the arcs sit in the corner
    const cards = steps.map((el) => {
      const cv = $('.fieldc', el), w = parseInt(el.style.width) / 2, h = parseInt(el.style.height) / 2;
      cv.width = w; cv.height = h;
      const sw = Math.min(800, (450 * w) / h), sh = (sw * h) / w;
      return { el, c: cv.getContext('2d'), w, h, sx: 800 - sw, sy: 450 - sh, sw, sh };
    });
    let shown = 0;
    const paint = (k, f) => k.c.drawImage(fieldOf(k.el.dataset.fam)[f % 3], k.sx, k.sy, k.sw, k.sh, 0, 0, k.w, k.h);
    // "anything" is one variable typeface (Roboto Flex) that never sits still: a wave rolls through the letters,
    // each one widening and narrowing, getting heavier and lighter, its x-height and ascenders rising and falling.
    const letters = $$('.vw i', s), vw = $('.vw', s);
    document.fonts.load('400 100px "Roboto Flex"', 'anything').catch(() => {});
    // its colour: grain clipped into the letters, one family at a time, weighted to the deep tone so it reads on white.
    // Three boiling frames per family become CSS rules swapped on the boil beat; the family turns every 1.5 s.
    const INK = ['blush', 'sky', 'lime', 'sun'];
    {
      const css = INK.flatMap((fam) => Array.from({ length: 3 }, (_, b) => {
        const u = Grain.field(420, 140, fam, { cell: 1, from: -1.4, arcs: [60, 100, 150] }).toDataURL();
        return `html[data-b="${b}"] #s-do .vw[data-fam="${fam}"] { background-image: url(${u}); }`;
      }));
      const st = document.createElement('style'); st.textContent = css.join('\n'); document.head.appendChild(st);
    }
    let inkAt = 0;
    vw.dataset.fam = INK[0];
    const wave = (t, i, sp, ph) => 0.5 + 0.5 * Math.sin(t * sp - i * 0.75 + ph);
    function morph(f) {
      const t = f / FPS;
      if (f - inkAt >= 12) { inkAt = f; vw.dataset.fam = INK[(INK.indexOf(vw.dataset.fam) + 1) % INK.length]; }
      letters.forEach((el, i) => {
        const wd = 25 + 126 * wave(t, i, 2.2, 0), wg = 260 + 720 * wave(t, i, 1.7, 1.3);
        const lc = 416 + 154 * wave(t, i, 1.9, 2.6), as = 649 + 205 * wave(t, i, 1.5, 4);
        el.style.fontVariationSettings = `'wdth' ${wd.toFixed(0)}, 'wght' ${wg.toFixed(0)}, 'YTLC' ${lc.toFixed(0)}, 'YTAS' ${as.toFixed(0)}, 'opsz' 144`;
      });
    }
    GR.push({ slide: s, tick(f) { for (let i = 0; i < Math.min(shown, 3); i++) paint(cards[i], f); if (shown >= 4) morph(f); } });
    hooks['s-do'] = {
      async step(n, dir) {
        shown = n; cards.forEach((k, i) => { if (i < n) paint(k, frame); });
        s.classList.toggle('fin', n >= 4);
        const ok = guard();
        if (n === 0 || n >= 4) { cursorOff(); return; }
        // the cursor climbs: it taps the top of each new step
        const b = at(steps[n - 1]);
        if ((await cursorTo(b.x + b.w * 0.75, b.y + 60, 667, ok)) && (await click(ok))) cursorTo(b.x + b.w * 0.85, b.y - 40, 500, ok);
      },
    };
  }

  // Something broke? One line per click, and the loop it describes lights up piece by piece:
  // you to me, me into the skill, the skill out to everyone.
  {
    const s = $('#s-broke'), lines = $$('.line', s), nodes = $$('.node', s), arrows = $$('.arr', s);
    $('.crew', s).innerHTML = Array.from({ length: 10 }, (_, i) => avatar(fam(i))).join('');
    $$('.crew .av', s).forEach((a) => a.classList.add('in'));
    const draw = (svgEl, p) => { $('path', svgEl).style.strokeDashoffset = 1 - p; svgEl.classList.toggle('drawn', p >= 1); };
    hooks['s-broke'] = {
      enter() { cursorOff(); },
      step(n, dir) {
        lines.forEach((l) => l.classList.toggle('on', +l.dataset.n === n));
        // nodes: step 1 shows you and me, step 2 the skill, step 3 everyone
        nodes.forEach((nd, i) => nd.classList.toggle('on', n >= 1 && i <= n));
        arrows.forEach((a, i) => { if (i + 1 < n || (i + 1 === n && dir < 0)) draw(a, 1); else if (i + 1 > n) draw(a, 0); });
        if (n >= 1 && dir > 0) { const a = arrows[n - 1], ok = guard(); draw(a, 0); after(250, ok, () => anim(583, (p) => draw(a, p), E.out, ok)); }
      },
    };
  }

  // 12. Close: the same day again. The requests go to Claude; Manan walks straight to the goal.
  {
    const s = $('#s-close'), Y = 600, D = scene(s, Y), claude = $('.claude', s), goal = $('.goal', s);
    // the whole team docks round "You + Claude" instead of round him
    const crowd = Array.from({ length: 10 }, (_, i) => {
      const deg = [-150, -120, -90, -60, -30, 30, 60, 90, 120, 150][i], a = (deg * Math.PI) / 180, to = [800 + 390 * Math.cos(a), 300 + 165 * Math.sin(a)];   // five above the card, five below, none doubled up at the sides
      return [fam(i), [800 + 2.2 * (to[0] - 800), -120], to, 300 + i * 180];
    });
    function reset() { D.reset(); claude.classList.remove('show'); goal.classList.remove('won'); }
    async function play(n, ok) {
      if (n === 0) {
        cursorOff();
        if (!(await hold(500, ok))) return false;
        claude.classList.add('show');
        const ps = crowd.map(([f, from, to, delay]) => D.person(from, to, f, 1100, ok, delay));
        if (!(await all(after(300, ok, () => D.walk(D.me, [[230, Y], [1215, Y]], 3300, ok, { ease: E.lin })), ...ps.map((p) => p.go)))) return false;
        goal.classList.add('won');
        if (!FAST) Sfx.chime();
        return true;
      }
      return true;
    }
    hooks['s-close'] = stepped_slide(reset, play);
  }

  // 14. The end: the goal sun arrives by match cut and stays in focus; the soft copies drift in and the line
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

  // The last slide: Manan's video plays, with sound unless the deck is muted.
  {
    const s = $('#s-video'), v = $('video', s);
    // if the browser refuses to start it with sound, it starts on the next click or key instead
    const retry = () => { if (deck.slideId() === 's-video' && v.paused) { v.muted = Sfx.muted; v.play().catch(() => {}); } };
    addEventListener('pointerdown', retry, true); addEventListener('keydown', retry, true);
    hooks['s-video'] = {
      enter() { cursorOff(); v.currentTime = 0; v.volume = 1; v.muted = Sfx.muted; v.play().catch(() => {}); },
      leave() { v.pause(); },
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
      Sfx.setQuiet(next.id !== 's-path');   // sound only where the messages, voice notes and calls happen
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
    else if (e.key === 's' || e.key === 'S') { const off = Sfx.toggle(); const v = $('#s-video video'); if (v) v.muted = off; const hint = $('#hint'); hint.textContent = off ? 'Sound off · S to turn on' : 'Sound on'; hint.classList.remove('hide'); clearTimeout(hint._t); hint._t = setTimeout(() => hint.classList.add('hide'), 1800); }
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
