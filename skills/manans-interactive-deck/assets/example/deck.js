// Save Me a Seat: the presentation engine and every slide's interactions.
// → / Space / PageDown: next build step, then next slide. ← / PageUp: back. F: full screen. S: sound.
(() => {
  const { tween, wait, E } = MiloKit;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#stage');
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const rnd = (a, b) => a + Math.random() * (b - a);

  let scale = 1;
  function fit() {
    scale = Math.min(innerWidth / 1600, innerHeight / 900);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
  addEventListener('resize', fit);
  fit();

  // A run token per slide, so loops stop as soon as the presenter moves on.
  let runId = 0;
  const alive = (id) => id === runId;

  // ---------- headings: wrap each word so it can rise in on its own ----------
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
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      }
    };
    walk(el);
    if (el.hasAttribute('data-s')) el.classList.add('gated');
  }
  $$('.split').forEach(split);

  // ---------- Material 3 Expressive shapes ----------
  const shapeCache = {};
  function shapePoly(name) {
    if (shapeCache[name]) return shapeCache[name];
    const pts = MiloKit.shapePoints(name).map(([x, y]) => `${(50 + 50 * x).toFixed(2)}% ${(50 + 50 * y).toFixed(2)}%`);
    return (shapeCache[name] = `polygon(${pts.join(',')})`);
  }
  const applyShapes = (root = document) => $$('[data-shape]', root).forEach((el) => { el.style.clipPath = shapePoly(el.dataset.shape); });

  // ---------- big numbers that roll in digit by digit ----------
  $$('[data-digits]').forEach((n) => { n.innerHTML = [...n.dataset.digits].map((c, i) => `<span style="--i:${i}">${c}</span>`).join(''); });

  // ---------- confetti ----------
  function confetti(el, n = 34) {
    Sfx.pop();
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const cx = (r.left + r.width / 2 - s.left) / scale, cy = (r.top + r.height / 2 - s.top) / scale;
    const cols = ['#F28C38', '#9AB327', '#F6F0A4', '#DE7020', '#749C49', '#FCDDC2', '#F4668E', '#7BA6DE'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      const a = Math.random() * Math.PI * 2, d = 160 + Math.random() * 260;
      Object.assign(c.style, { left: cx + 'px', top: cy + 'px', background: cols[i % cols.length], animationDuration: 0.9 + Math.random() * 0.8 + 's' });
      c.style.setProperty('--cx', Math.cos(a) * d + 'px');
      c.style.setProperty('--cy', Math.sin(a) * d + 120 + 'px');
      c.style.setProperty('--cr', (Math.random() - 0.5) * 900 + 'deg');
      stage.appendChild(c);
      setTimeout(() => c.remove(), 1900);
    }
  }

  // ---------- sticker icons ----------
  const sticker = (name) => `<span class="stk"><i class="ph-fill ph-${name}"></i><i class="ph-bold ph-${name}"></i></span>`;
  const stickerize = (root = document) => $$('.stk-me', root).forEach((el) => { const i = el.querySelector('i.ph-bold'); if (!i) return; const name = [...i.classList].find((k) => k.startsWith('ph-') && k !== 'ph-bold').slice(3); i.outerHTML = sticker(name); el.classList.remove('stk-me'); });

  // ---------- Milo helpers ----------
  const M = {};
  const mk = (name, o) => (M[name] = new Milo($(`[data-milo="${name}"]`), o));
  // A Milo you place by its feet. The SVG is 1.7 x 1.6 of its size and the ground line sits at 152/160.
  function spawn(host, { x, y, size = 64, mood = 'green', body, eyes, shadow = 1 }) {
    const el = document.createElement('div');
    el.className = 'mw';
    host.appendChild(el);
    const m = new Milo(el, { size, mood, body, eyes, follow: false, shadow });
    const w = { el, m, size, x, y };
    put(w, x, y, true);
    return w;
  }
  function put(w, x, y, instant) {
    w.x = x; w.y = y;
    if (instant) w.el.style.transition = 'none';
    w.el.style.left = x - 0.85 * w.size + 'px';
    w.el.style.top = y - 1.52 * w.size + 'px';
    if (instant) { void w.el.offsetWidth; w.el.style.transition = ''; }
  }
  const go2 = (w, x, y, hop = true) => { put(w, x, y); if (hop) w.m.hop(1, 16 + Math.random() * 10); };
  const MOODS = ['green', 'blue', 'pink', 'yellow', 'orange'];

  // ---------- timers ----------
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  // Shape timers: the M3 cookie outline, drawn as a stroke that runs down.
  {
    const pts = MiloKit.shapePoints('cookie12'), maxR = Math.max(...pts.map(([x, y]) => Math.hypot(x, y)));
    const d = 'M' + pts.map(([x, y]) => `${(60 + (x / maxR) * 55).toFixed(2)} ${(60 + (y / maxR) * 55).toFixed(2)}`).join(' L') + 'Z';
    $$('.shape-timer path').forEach((p) => p.setAttribute('d', d));
  }
  function ring(el) {
    const c = $('.arc', el), len = c.hasAttribute('pathLength') ? 1 : 2 * Math.PI * +c.getAttribute('r');
    c.style.strokeDasharray = len;
    return (frac) => { c.style.strokeDashoffset = len * (1 - frac); };
  }

  const hooks = {};

  // 1. Title: the bench from the workshop deck. Milo saves the seat with a book; someone takes it.
  // Bench art is 1100 x 776 units; these are its seat line, floor line and the book's spot.
  const SEAT = 382, FLOOR = 764;
  {
    const scene = $('[data-bench="title"]'), book = $('.book', scene), note = $('#s-title .note');
    const me = spawn(scene, { x: 293, y: SEAT, size: 268, shadow: 0 });
    const them = spawn(scene, { x: 1560, y: FLOOR, size: 250, mood: 'blue' });
    let tk = 0;
    hooks['s-title'] = {
      enter() { me.m.lookAt = { x: 3.4, y: 0.8 }; },
      async step(n, dir) {
        const t = ++tk;
        if (n === 0) {
          note.classList.remove('gone'); book.classList.remove('gone'); them.m.shadow = 1; me.m.lookAt = { x: 3.4, y: 0.8 };
          put(them, 1560, FLOOR, dir >= 0); return;
        }
        note.classList.add('gone');
        me.m.lookAt = { x: 3.4, y: 0 };
        put(them, 930, FLOOR); them.m.hop(2, 30);
        await wait(900); if (t !== tk) return;
        book.classList.add('gone');
        await wait(250); if (t !== tk) return;
        put(them, 660, SEAT); them.m.shadow = 0; them.m.hop(1, 70);
        await wait(850); if (t !== tk) return;
        me.m.lookAt = { x: 3.4, y: 0.4 }; them.m.lookAt = { x: -3.4, y: 0.4 };
        me.m.beHappy(2200); setTimeout(() => them.m.beHappy(2000), 200);
      },
    };
  }

  // 2. Never have I ever: one card at a time, the room stands up.
  {
    const slide = $('#s-never'), box = $('.never-card', slide), row = $('[data-crowd="never"]', slide);
    const LINES = ['…joined a group where everyone else was already friends.', "…laughed at a joke I didn't get.", "…pretended to text so I didn't look alone.", '…stayed silent in a group chat, or never typed in one.', '…waited for someone else to say hi first.', '…made a friend in the most unexpected place.', '…checked in on someone who seemed low.', '…introduced two people who became friends.'];
    const crowd = Array.from({ length: 10 }, (_, i) => spawn(row, { x: 230 + i * 126, y: 158, size: 62, mood: MOODS[i % 5] }));
    let tk = 0, shown = -1;
    // a "yes" = Milo takes a sip: a sticker cup pops up, tilts to his mouth, he closes his eyes happily
    const stand = (c, up) => {
      if (c.up === up) return;
      c.up = up;
      c.m.setEyes(up ? 'happy' : 'oval');
      c.el.querySelector('.cup')?.remove();
      if (up) {
        c.el.insertAdjacentHTML('beforeend', `<span class="cup">${sticker('coffee')}</span>`);
        c.m.hop(1, 10);
        setTimeout(() => { if (c.up) tween(c.m, { lean: -5 }, 300, E.out).then(() => setTimeout(() => tween(c.m, { lean: 0 }, 400), 900)); }, 450);
      }
    };
    const sitAll = () => crowd.forEach((c) => stand(c, false));
    function render(n, dir) {
      const old = $$('.nc', box);
      old.forEach((o) => { o.classList.add(dir < 0 ? 'out-back' : 'out'); setTimeout(() => o.remove(), 700); });
      const c = document.createElement('div');
      c.className = 'nc in';
      c.innerHTML = `<div class="num">${String(n + 1).padStart(2, '0')}<small>OF 08</small></div><p>${LINES[n]}</p>`;
      box.appendChild(c);
      shown = n;
    }
    hooks['s-never'] = {
      enter(n) { box.innerHTML = ''; shown = -1; render(n, 1); crowd.forEach((c) => { c.up = false; c.m.setEyes('oval'); c.el.querySelector('.cup')?.remove(); }); },
      async step(n, dir) {
        const t = ++tk;
        if (shown !== n) render(n, dir);
        sitAll();
        await wait(1500); if (t !== tk || deck.slideId() !== 's-never') return;
        // a different, random part of the room stands up each time
        const ups = new Set(crowd.filter(() => Math.random() < 0.45));
        if (ups.size < 3) [crowd[(n * 3) % 10], crowd[(n * 7 + 2) % 10], crowd[(n * 5 + 4) % 10]].forEach((c) => ups.add(c));
        for (const c of crowd) {
          if (!ups.has(c)) continue;
          stand(c, true);
          await wait(120); if (t !== tk) return;
        }
      },
    };
  }

  // 3. Hi, we're aha.
  {
    const m = mk('hi', { size: 120, follow: true });
    hooks['s-hi'] = { step(n, dir) { if (n === 1 && dir > 0) { const id = runId; setTimeout(() => { if (alive(id)) { m.hop(2, 22); m.beHappy(1800); } }, 500); } } };
  }

  // 4. What does belonging mean: pick a card, 30 seconds on the clock.
  {
    const slide = $('#s-mean'), cards = $$('.mean-card', slide), wrap = $('.mean-cards', slide);
    const timer = $('[data-timer="mean"]', slide), set = ring(timer), label = $('b', timer);
    let tk = 0;
    const reset = () => { tk++; timer.classList.remove('running', 'done'); label.textContent = '0:30'; set(1); };
    cards.forEach((c) => c.addEventListener('click', () => {
      const on = c.classList.contains('sel');
      cards.forEach((k) => k.classList.remove('sel'));
      wrap.classList.toggle('pick', !on);
      if (!on) { c.classList.add('sel'); Sfx.select(); }
    }));
    async function run() {
      const t = ++tk, start = performance.now(), total = 30;
      timer.classList.add('running');
      while (t === tk) {
        const left = Math.max(0, total - (performance.now() - start) / 1000);
        label.textContent = fmt(Math.ceil(left)); set(left / total);
        if (left <= 0) { timer.classList.add('done'); Sfx.chime(); return; }
        await wait(200);
      }
    }
    hooks['s-mean'] = {
      enter() { reset(); wrap.classList.remove('pick'); cards.forEach((k) => k.classList.remove('sel')); },
      step(n) { if (n === 1) run(); else reset(); },
      leave: reset,
    };
  }

  // 5. Find your match: ten Milos regroup every round.
  {
    const slide = $('#s-match'), field = $('[data-crowd="match"]', slide), round = $('.round', slide);
    const moods = ['green', 'green', 'green', 'blue', 'blue', 'blue', 'pink', 'pink', 'yellow', 'yellow'];
    const START = [[90, 330], [300, 300], [520, 350], [650, 470], [200, 470], [420, 560], [110, 640], [600, 650], [330, 650], [480, 430]];
    const crowd = moods.map((mood, i) => spawn(field, { x: START[i][0], y: START[i][1], size: 60, mood }));
    const labels = Array.from({ length: 5 }, () => { const l = document.createElement('div'); l.className = 'glabel'; field.appendChild(l); return l; });
    const ROUNDS = [
      { k: 'Get ready', p: 'Mingle. Prompts change every round.' },
      { k: 'Round 1', p: 'Same colour you\'re wearing', g: [['Green', [0, 1, 2], 175, 420], ['Blue', [3, 4, 5], 530, 420], ['Pink', [6, 7], 175, 630], ['Yellow', [8, 9], 530, 630]] },
      { k: 'Round 2', p: 'Same birth month', g: [['Jan', [0, 4], 130, 420], ['Mar', [2, 7], 355, 420], ['Jul', [3, 8], 580, 420], ['Oct', [1, 5, 9], 205, 630], ['us', [6], 520, 630]] },
      { k: 'Round 3', p: 'Chai, coffee, or neither?', g: [['Chai', [0, 3, 6, 9], 190, 420], ['Coffee', [1, 4, 7, 2], 520, 420], ['Neither', [5, 8], 355, 630]] },
      { k: 'Round 4', p: 'Same number of siblings', g: [['0', [2, 6, 8], 175, 420], ['1', [0, 3, 5], 530, 420], ['2', [1, 9], 175, 630], ['3+', [4, 7], 530, 630]] },
    ];
    function layout(n, instant) {
      const r = ROUNDS[n];
      if (!r.g) { crowd.forEach((c, i) => (instant ? put(c, ...START[i], true) : go2(c, ...START[i]))); labels.forEach((l) => l.classList.remove('on')); return; }
      r.g.forEach(([name, ids, cx, cy], gi) => {
        ids.forEach((id, j) => { const x = cx + (j - (ids.length - 1) / 2) * 72; instant ? put(crowd[id], x, cy, true) : setTimeout(() => go2(crowd[id], x, cy), j * 90 + gi * 60); });
        const l = labels[gi];
        l.innerHTML = name === 'us' ? '<div class="logo"></div>' : name;
        Object.assign(l.style, { left: cx + 'px', top: cy - 128 + 'px' });
        l.classList.add('on');
      });
      labels.slice(r.g.length).forEach((l) => l.classList.remove('on'));
    }
    hooks['s-match'] = {
      enter(n) { layout(n, true); },
      step(n, dir) {
        const r = ROUNDS[n];
        round.innerHTML = `<span class="eyebrow">${r.k}</span><p>${r.p}</p>`;
        round.classList.remove('swap'); void round.offsetWidth; round.classList.add('swap');
        layout(n);
        if (n === 4 && dir > 0) setTimeout(() => crowd.forEach((c, i) => setTimeout(() => c.m.beHappy(1400), i * 60)), 1400);
      },
    };
  }

  // 6. What we all share: every card, the whole row nods together.
  {
    const slide = $('#s-share'), row = $('[data-crowd="share"]', slide);
    const moods = ['green', 'blue', 'pink', 'yellow', 'orange', 'green', 'blue', 'pink'];
    const crowd = moods.map((mood, i) => spawn(row, { x: 345 + i * 130, y: 158, size: 64, mood }));
    hooks['s-share'] = {
      enter() { crowd.forEach((c, i) => put(c, 345 + i * 130, 158, true)); },
      step(n, dir) {
        if (dir < 0) { crowd.forEach((c, i) => put(c, 345 + i * 130, 158)); return; }
        crowd.forEach((c, i) => setTimeout(() => c.m.hop(1, 18), 400 + i * 45));
        if (n === 4) {
          setTimeout(() => crowd.forEach((c, i) => { put(c, 445 + i * 102, 158); c.m.beHappy(2000); }), 1100);
        }
      },
    };
  }

  // 7. From words to play: a magnifying glass Milo keeps an eye on.
  {
    const slide = $('#s-words'), lens = $('.lens', slide);
    const m = mk('words', { size: 300, follow: false });
    let p = { x: 980, y: 380 }, target = null, lastMove = 0;
    addEventListener('pointermove', (e) => {
      if (deck.slideId() !== 's-words') return;
      const s = stage.getBoundingClientRect();
      target = { x: (e.clientX - s.left) / scale, y: (e.clientY - s.top) / scale }; lastMove = performance.now();
    });
    hooks['s-words'] = {
      enter() {
        const id = runId;
        const tick = (now) => {
          if (!alive(id)) return;
          const t = now / 1000;
          const idle = !target || now - lastMove > 2500;
          const goal = idle ? { x: 1265 + 230 * Math.sin(t * 0.55), y: 520 + 120 * Math.sin(t * 0.9) } : target;
          p.x += (goal.x - p.x) * 0.08; p.y += (goal.y - p.y) * 0.08;
          lens.style.transform = `translate(${p.x - 84}px, ${p.y - 84}px)`;
          // Milo's eyes are about here on the stage
          const ex = 1010 + 0.85 * 300 - 3.5 * 3, ey = 330 + (152 - 64) * 3 * 0.94;
          const vx = p.x - ex, vy = p.y - ey, d = Math.hypot(vx, vy) || 1, k = Math.min(1, d / 200);
          m.lookAt = { x: (vx / d) * 3.4 * k, y: (vy / d) * 2.6 * k };
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        setTimeout(() => { if (alive(id)) m.hop(1, 20); }, 1200);
      },
    };
  }

  // 8 + 10. Teams around tables.
  const TABLE_SHAPES = ['cookie9', 'cookie6', 'sunny'];
  function tables(host, centers, sizes, opts = {}) {
    const ts = centers.map(([cx, cy], ti) => {
      const t = document.createElement('div');
      t.className = 'table'; t.dataset.shape = TABLE_SHAPES[ti % 3];
      Object.assign(t.style, { left: cx + 'px', top: cy + 'px', animationDelay: ti * 0.12 + 's' });
      t.innerHTML = `<span class="tlabel">${opts.label ? 'Team ' + (ti + 1) : ''}</span>`;
      host.appendChild(t);
      return { cx, cy, el: t };
    });
    applyShapes(host);
    const seats = (cx, cy, k, n) => { const a = -Math.PI / 2 + Math.PI * 0.18 + (k / Math.max(1, n - 1)) * Math.PI * 1.64; return [cx + Math.cos(a) * 136, cy + Math.sin(a) * 104 + 44]; };
    const people = [];
    centers.forEach(([cx, cy], ti) => { for (let k = 0; k < sizes[ti]; k++) people.push({ ti, k }); });
    const ws = people.map((p, i) => spawn(host, { x: 0, y: 0, size: opts.size || 52, mood: MOODS[(i * 3 + p.ti) % 5] }));
    const arrange = (assign, instant) => {
      const by = centers.map(() => []);
      assign.forEach((ti, i) => by[ti].push(i));
      by.forEach((ids, ti) => ids.forEach((id, k) => { const [x, y] = seats(centers[ti][0], centers[ti][1], k, ids.length); instant ? put(ws[id], x, y, true) : go2(ws[id], x, y); }));
    };
    return { ts, ws, people, arrange, home: people.map((p) => p.ti) };
  }
  {
    const host = $('[data-tables="challenge"]');
    const T = tables(host, [[1080, 300], [1380, 470], [1090, 660]], [5, 6, 5], { size: 48 });
    hooks['s-challenge'] = {
      enter() {
        const id = runId;
        T.ws.forEach((w, i) => put(w, 760 + (i % 4) * 230, 820 + (i % 2) * 20, true));
        setTimeout(() => { if (alive(id)) T.arrange(T.home); }, 700);
      },
      step(n, dir) { if (n === 1 && dir > 0) { const w = T.ws[2]; w.m.lookAt = { x: -3, y: -2 }; w.m.hop(1, 26); } },
    };
  }
  {
    const host = $('[data-tables="twist"]');
    const T = tables(host, [[460, 640], [810, 640], [1160, 640]], [5, 5, 5], { size: 50 });
    // who moves where: 1 or 2 from each team
    const after = T.home.slice();
    after[0] = 1; after[1] = 2; after[5] = 2; after[11] = 0; after[12] = 1;
    hooks['s-twist'] = {
      enter(n) { T.arrange(n ? after : T.home, true); T.ws.forEach((w) => { w.m.eyeScale = 1; }); },
      step(n, dir) {
        if (n === 1 && dir > 0) {
          T.ws.forEach((w) => { w.m.eyeScale = 1.25; });
          setTimeout(() => { T.arrange(after); T.ws.forEach((w) => { w.m.eyeScale = 1; }); }, 500);
        } else if (n === 0) T.arrange(T.home);
      },
    };
  }

  // 9. Campus fest: a real 7 minute timer with the twist hidden at 2:30.
  const fest = { running: false, start: 0, total: 420, tk: 0 };
  {
    const slide = $('#s-fest'), clock = $('[data-clock]', slide), hint = $('[data-clockhint]', slide);
    const wave = $('.tl-wave', slide), walker = $('.tl-walker', slide), q = $('.mk.q', slide), pitch = $$('.mk', slide)[2];
    const corner = $('#festclock'), cornerB = $('b', corner);
    const walkerMilo = mk('fest', { size: 46, follow: false });
    let d = 'M0 20';
    for (let x = 0; x <= 1408; x += 2) d += ` L${x} ${(20 + 5 * Math.sin((x / 40) * Math.PI * 2)).toFixed(2)}`;
    wave.innerHTML = `<defs><clipPath id="fcl"><rect class="fcr" x="0" y="0" height="40" width="0"/></clipPath></defs><path class="rest" d="${d}" fill="none" stroke-width="7" stroke-linecap="round"/><path class="done" d="${d}" fill="none" stroke-width="7" stroke-linecap="round" clip-path="url(#fcl)"/>`;
    const clip = $('.fcr', wave);
    let flags = {};
    function draw() {
      const el = fest.running ? Math.min(fest.total, (performance.now() - fest.start) / 1000) : 0;
      const left = fest.total - el;
      clock.textContent = fmt(Math.ceil(left));
      cornerB.textContent = fmt(Math.ceil(left));
      const frac = el / fest.total;
      clip.setAttribute('width', frac * 1408);
      walker.style.left = frac * 100 + '%';
      const showCorner = fest.running && deck.slideId() !== 's-fest' && left > 0;
      corner.classList.toggle('show', showCorner); document.body.classList.toggle('festrun', showCorner);
      corner.classList.toggle('warn', el >= 360);
      if (fest.running) {
        if (el >= 150 && !flags.q) { flags.q = true; Sfx.chime(); q.classList.add('hit'); q.innerHTML = '<i>2:30</i>Plot twist'; }
        if (el >= 360 && !flags.p) { flags.p = true; Sfx.chime(); pitch.classList.add('hit'); }
        if (left <= 0 && !flags.end) { flags.end = true; Sfx.chime(); walkerMilo.beHappy(2000); hint.textContent = "time's up"; }
      }
    }
    async function loop() {
      const t = ++fest.tk;
      while (t === fest.tk) { draw(); if (fest.running && (performance.now() - fest.start) / 1000 > fest.total + 3) { fest.running = false; draw(); return; } await wait(250); }
    }
    function reset() { fest.running = false; fest.tk++; flags = {}; q.classList.remove('hit'); pitch.classList.remove('hit'); q.innerHTML = '<i>2:30</i>???'; hint.textContent = 'press → to start the 7 minutes'; draw(); }
    fest.reset = reset;
    hooks['s-fest'] = {
      enter(n) { if (!fest.running) reset(); else { hint.textContent = 'running'; loop(); } },
      step(n, dir) {
        if (n === 5 && dir > 0 && !fest.running) { fest.running = true; fest.start = performance.now(); flags = {}; hint.textContent = 'running'; walkerMilo.hop(1, 20); loop(); }
        if (n === 4 && dir < 0) reset();
      },
      leave() { if (fest.running) loop(); },
    };
    reset();
  }

  // 11. Freeze frame.
  {
    const slide = $('#s-freeze'), flash = $('.flash', slide);
    const a = mk('fz1', { size: 92, mood: 'orange', follow: false }), b = mk('fz2', { size: 92, follow: false }), c = mk('fz3', { size: 92, mood: 'blue', follow: false });
    const freeze = (m, pose) => { m.idle = false; Object.assign(m, pose); };
    hooks['s-freeze'] = {
      enter() {
        flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); Sfx.stamp();
        freeze(a, { lift: 34, lean: 10, squash: 1.06, lookAt: { x: 3.2, y: -1 } });
        freeze(b, { lookAt: { x: -3.2, y: 0.6 } });
        freeze(c, { lookAt: { x: 0, y: -2.6 }, eyeScale: 1.15 });
        $$('.fz', slide).forEach((f) => f.classList.add('paused'));
      },
    };
  }

  // 12. Same team, one new rule: 2 minutes on a ring around a heart-eyed Milo.
  {
    const slide = $('#s-rule'), timer = $('[data-timer="rule"]', slide), set = ring(timer), clock = $('.rule-clock', slide), b = $('b', clock);
    const m = mk('rule', { size: 200, mood: 'pink', eyes: 'heart', follow: false });
    let tk = 0;
    const reset = () => { tk++; clock.classList.remove('running'); b.textContent = '2:00'; set(1); };
    async function run() {
      const t = ++tk, start = performance.now(), total = 120;
      clock.classList.add('running');
      m.hop(1, 20);
      while (t === tk) {
        const left = Math.max(0, total - (performance.now() - start) / 1000);
        b.textContent = fmt(Math.ceil(left)); set(left / total);
        if (left <= 0) { Sfx.chime(); m.hop(2, 24); m.beHappy(1600); return; }
        await wait(250);
      }
    }
    hooks['s-rule'] = {
      enter() { reset(); const id = runId; setTimeout(() => { if (alive(id)) m.beHappy(1200); }, 900); },
      step(n, dir) { if (n === 1 && dir > 0) run(); else reset(); },
      leave: reset,
    };
  }

  // 13. What changed when we made room: Milo hops from "how we work" into "what we become".
  {
    const slide = $('#s-changed'), host = $('.cmp', slide);
    const m = mk('cmp', { size: 92, mood: 'blue', follow: false });
    const box = $('.cmp-milo', slide);
    const at = (x, y, instant) => { if (instant) box.style.transition = 'none'; box.style.left = x + 'px'; box.style.top = y + 'px'; if (instant) { void box.offsetWidth; box.style.transition = ''; } };
    box.style.position = 'absolute';
    box.style.transition = 'left .8s var(--m3-spatial-default), top .8s var(--m3-spatial-default)';
    hooks['s-changed'] = {
      enter(n) { at(n ? 1000 : 252, -142, true); m.setMood(n ? 'green' : 'blue', true); m.lookAt = n ? null : { x: 3, y: 1 }; },
      step(n, dir) {
        if (n === 1 && dir > 0) { at(1000, -142); m.hop(1, 60); setTimeout(() => { m.setMood('green'); m.beHappy(1800); }, 700); }
        if (n === 0) { at(252, -142); m.setMood('blue'); m.lookAt = { x: 3, y: 1 }; }
      },
    };
  }

  // 14. No cards: flip each unwritten rule, then the one standing outside.
  {
    const slide = $('#s-nocards'), flips = $$('.flip', slide);
    const m = mk('outside', { size: 76, mood: 'blue', eyes: 'sad', follow: false });
    flips.forEach((f, i) => f.addEventListener('click', () => { f.classList.toggle('on'); Sfx.select(); }));
    hooks['s-nocards'] = {
      step(n, dir) {
        flips.forEach((f, i) => f.classList.toggle('on', n > i));
        if (dir > 0 && n >= 1 && n <= 4) Sfx.select();
        if (n === 5 && dir > 0) setTimeout(() => m.hop(1, 12), 600);
      },
    };
  }

  // 15. A campus full of people, and one Milo alone in the middle. With the hum of a crowd that drops away.
  {
    const slide = $('#s-full'), host = $('[data-crowd="full"]', slide);
    const W = 1160, H = 380, LX = W / 2, LY = 330, LS = 72;
    const BODY_CY = LY - (107 * LS) / 100 / 2;   // the centre of the lone Milo's body, not his box
    const spot = document.createElement('div'); spot.className = 'spot'; spot.dataset.shape = 'cookie9'; host.appendChild(spot); applyShapes(host);
    Object.assign(spot.style, { left: LX + 'px', top: BODY_CY + 'px' });
    const clear = (x, y) => Math.hypot(x - LX, (y - 30) - BODY_CY) > 175;   // keep the crowd out of the spotlight
    const crowd = [];
    for (let i = 0; i < 22; i++) {
      const x = 60 + (i % 11) * 104 + rnd(-18, 18), y = 140 + Math.floor(i / 11) * 190 + rnd(-18, 18);
      if (!clear(x, y)) continue;
      crowd.push(spawn(host, { x, y, size: 46, mood: ['green', 'pink', 'yellow', 'orange'][i % 4] }));
    }
    const lone = spawn(host, { x: LX, y: LY, size: LS, mood: 'blue', eyes: 'sad' });
    lone.m.breathe = 0.4;
    hooks['s-full'] = {
      enter() {
        const id = runId;
        Sfx.crowd(true);
        const wander = async (c) => {
          await wait(rnd(0, 2500));
          while (alive(id)) {
            const nx = Math.max(40, Math.min(W - 40, c.x + rnd(-140, 140))), ny = Math.max(110, Math.min(H, c.y + rnd(-60, 60)));
            if (!clear(nx, ny)) { await wait(400); continue; }
            put(c, nx, ny); c.m.hop(1, 8);
            await wait(rnd(1600, 3600));
          }
        };
        crowd.forEach(wander);
      },
      step(n) {
        crowd.forEach((c) => c.el.classList.toggle('dim', n >= 1));
        spot.classList.toggle('on', n >= 1);
        Sfx.crowdFar(n >= 1);
      },
      leave() { Sfx.crowd(false); },
    };
  }

  // 16. Fitting in vs belonging.
  {
    const slide = $('#s-fit');
    const fitHost = $('[data-crowd="fit"]', slide), belHost = $('[data-crowd="belong"]', slide);
    const fitters = [0, 1, 2].map((i) => spawn(fitHost, { x: 330 + i * 110, y: 170, size: 66, mood: 'yellow' }));
    const fitMe = spawn(fitHost, { x: 80, y: 170, size: 66, mood: 'green' });
    const belongers = ['pink', 'blue', 'orange'].map((mood, i) => spawn(belHost, { x: 330 + i * 110, y: 170, size: 66, mood }));
    const belMe = spawn(belHost, { x: 80, y: 170, size: 66, mood: 'green' });
    hooks['s-fit'] = {
      enter(n) {
        put(fitMe, n >= 1 ? 220 : 80, 170, true); fitMe.m.setMood(n >= 1 ? 'yellow' : 'green', true); fitMe.m.setEyes(n >= 1 ? 'sleep' : 'oval');
        put(belMe, n >= 2 ? 220 : 80, 170, true); belMe.m.setEyes('oval');
      },
      async step(n, dir) {
        if (n >= 1 && (dir > 0 && n === 1)) {
          fitMe.m.lookAt = { x: 3.4, y: 0 }; go2(fitMe, 220, 170);
          await wait(800); fitMe.m.setMood('yellow'); fitMe.m.squash = 0.9; tween(fitMe.m, { squash: 1 }, 600, E.back); fitMe.m.setEyes('sleep');
        }
        if (n === 0) { put(fitMe, 80, 170); fitMe.m.setMood('green'); fitMe.m.setEyes('oval'); }
        if (n === 2 && dir > 0) {
          belMe.m.lookAt = { x: 3.4, y: 0 }; go2(belMe, 220, 170);
          await wait(800); belMe.m.beHappy(2200); belongers.forEach((b, i) => setTimeout(() => b.m.hop(1, 14), i * 90));
        }
        if (n === 1 && dir < 0) put(belMe, 80, 170);
      },
    };
  }

  // 17. Five tiny ways: a barrel that turns one card to the front per click, then flattens into a row.
  {
    const slide = $('#s-five'), track = $('.barrel', slide), hopper = $('.five-hopper', slide);
    const WAYS = [['eye', 'Notice', "Who's hovering at the edge?"], ['hand-waving', 'Invite', '“Want to join?” No pressure.'], ['lightbulb', 'Explain', 'Share the context and the inside jokes.'], ['puzzle-piece', 'Include', 'Ask for an idea that actually matters.'], ['arrow-clockwise', 'Follow up', 'Invite them the next time too.']];
    WAYS.forEach(([ic, t, q], i) => track.insertAdjacentHTML('beforeend', `<div class="bcard"><div class="bc-top">${sticker(ic)}<span class="no">${i + 1}</span></div><b>${t}</b><p>${q}</p></div>`));
    const cards = $$('.bcard', slide);
    const m = mk('five', { size: 92, follow: false });
    const CW = 320, CH = 380, R = 780, STEP = 32, CY = 590, FS = 0.78, GAP = 272, FLAT = 6;
    const placeMilo = (x, top) => { hopper.style.left = x - 0.85 * 92 + 'px'; hopper.style.top = top - 1.52 * 92 + 'px'; };
    function layout(n, from) {
      const flat = n >= FLAT, focus = Math.max(0, Math.min(4, n - 1));
      cards.forEach((c, i) => {
        let tf, f = 'none', o = 1;
        if (flat) {
          tf = `translate3d(${800 + (i - 2) * GAP - CW / 2}px, ${600 - CH / 2}px, 0) scale(${FS})`;
        } else {
          const k = i - focus, rad = (k * STEP * Math.PI) / 180;
          const x = 800 + R * Math.sin(rad), z = R * Math.cos(rad) - R;
          tf = `translate3d(${(x - CW / 2).toFixed(1)}px, ${CY - CH / 2 + (from ? 300 : 0)}px, ${z.toFixed(1)}px) rotateY(${k * STEP}deg)`;
          f = k ? `blur(${Math.abs(k) * 3}px)` : 'none';
          o = Math.abs(k) >= 2 ? 0 : k ? 0.75 : 1;
        }
        c.style.transform = tf; c.style.filter = f; c.style.opacity = from ? 0 : o;
        c.style.transitionDelay = flat ? i * 50 + 'ms' : '0ms';
        c.classList.toggle('front', !flat && i === focus);
      });
      if (flat) placeMilo(800 + 2 * GAP, 600 - (CH * FS) / 2);
      else placeMilo(800, CY - CH / 2);
      hopper.style.opacity = from ? 0 : 1;
    }
    hooks['s-five'] = {
      enter(n) {
        [...cards, hopper].forEach((c) => (c.style.transition = 'none'));
        layout(n, true); void slide.offsetWidth;
        [...cards, hopper].forEach((c) => (c.style.transition = ''));
        requestAnimationFrame(() => layout(deck.step()));
      },
      step(n, dir) {
        layout(n);
        if (dir > 0 && n < FLAT) { m.lookAt = { x: -3, y: 0 }; m.hop(1, 16); setTimeout(() => (m.lookAt = null), 700); }
        if (dir < 0) { m.lookAt = { x: 3, y: 0 }; setTimeout(() => (m.lookAt = null), 700); }
        if (dir > 0 && n === FLAT) { m.hop(1, 40); setTimeout(() => m.beHappy(1600), 600); }
      },
    };
  }

  // 18. Someone standing alone: one invite at a time; each one brings them a little closer.
  {
    const slide = $('#s-alone'), invs = $$('.inv', slide);
    const me = mk('al-me', { size: 130, follow: false }), them = mk('al-them', { size: 124, mood: 'blue', eyes: 'sad', follow: false });
    const thBox = $('.al-them', slide);
    const THEM_X = [1060, 1000, 940, 860];
    hooks['s-alone'] = {
      enter(n) { me.lookAt = { x: 3.4, y: 0 }; them.lookAt = n ? { x: -3.4, y: 0 } : { x: 3, y: 1.5 }; them.setEyes(n >= 2 ? 'oval' : 'sad'); thBox.style.left = THEM_X[n] + 'px'; },
      step(n, dir) {
        invs.forEach((v) => v.classList.toggle('on', +v.dataset.i === n));
        if (dir > 0 && n) { Sfx.receive(); me.hop(1, 14); }
        them.lookAt = n ? { x: -3.4, y: 0 } : { x: 3, y: 1.5 };
        them.setEyes(n >= 2 ? 'oval' : 'sad');
        thBox.style.left = THEM_X[n] + 'px';
        if (n === 3 && dir > 0) setTimeout(() => { them.hop(1, 20); them.beHappy(1800); me.beHappy(1600); }, 900);
      },
    };
  }

  // 19. Felt left out: private, tappable reflection.
  {
    const slide = $('#s-leftout');
    $$('.lt', slide).forEach((t) => t.addEventListener('click', () => { t.classList.toggle('sel'); Sfx.select(); }));
    hooks['s-leftout'] = { enter() { $$('.lt', slide).forEach((t) => t.classList.remove('sel')); } };
  }

  // 20. Build the Wall of Seats: the room's notes stick up one by one into a tidy wall.
  {
    const slide = $('#s-wall'), wall = $('.wall', slide);
    const cols = ['#DDE9A6', '#FAD3B4', '#F6F0A4'];
    const notes = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
      const n = document.createElement('i'); n.className = 'wn';
      Object.assign(n.style, { left: c * 84 + 'px', top: r * 84 + 'px', background: cols[(r * 2 + c) % 3] });
      wall.appendChild(n); notes.push(n);
    }
    notes.sort(() => Math.random() - 0.5);
    let tk = 0;
    hooks['s-wall'] = {
      enter(n) { notes.forEach((x) => x.classList.toggle('on', n >= 1)); },
      async step(n, dir) {
        const t = ++tk;
        if (n === 0) { notes.forEach((x) => x.classList.remove('on')); return; }
        if (dir < 0) return;
        for (const [i, x] of notes.entries()) { if (t !== tk) return; x.classList.add('on'); if (i % 4 === 0) Sfx.paper(); await wait(90); }
        Sfx.chime();
      },
    };
  }

  // 21. In the next 48 hours.
  {
    const m = mk('m48', { size: 200, mood: 'pink', eyes: 'heart', follow: false, backdrop: { shape: 'flower', color: 'rgba(253,251,247,.14)', size: 185 } });
    hooks['s-48'] = {
      enter() { const id = runId; setTimeout(() => { if (alive(id)) m.hop(1, 22); }, 1100); },
      step(n, dir) { if (n === 1 && dir > 0) setTimeout(() => { m.hop(2, 18); m.morphBackdrop('cookie12', 700); }, 500); },
    };
  }

  // 22. Connect: Milo points everyone at the QR code.
  {
    const m = mk('cn', { size: 110, follow: false });
    hooks['s-connect'] = { enter() { m.lookAt = { x: 3.4, y: -1.4 }; const id = runId; setTimeout(() => { if (alive(id)) m.hop(1, 18); }, 1200); } };
  }

  // 23. Close: back on the same bench, and they make room for one more.
  {
    const scene = $('[data-bench="close"]');
    const a = spawn(scene, { x: 330, y: SEAT, size: 240, shadow: 0 });
    const b = spawn(scene, { x: 640, y: SEAT, size: 230, mood: 'blue', shadow: 0 });
    const c = spawn(scene, { x: 1600, y: FLOOR, size: 220, mood: 'pink' });
    let tk = 0;
    hooks['s-close'] = {
      enter(n) { put(a, n ? 235 : 330, SEAT, true); put(b, n ? 530 : 640, SEAT, true); put(c, n ? 830 : 1600, n ? SEAT : FLOOR, true); c.m.shadow = n ? 0 : 1; a.m.lookAt = { x: 3, y: 0 }; b.m.lookAt = { x: -3, y: 0 }; },
      async step(n, dir) {
        const t = ++tk;
        scene.closest('.slide').classList.toggle('fb', n >= 2);
        if (n === 2) {
          if (c.y !== SEAT) { put(a, 235, SEAT); put(b, 530, SEAT); put(c, 830, SEAT); c.m.shadow = 0; }
          // feedback: everyone on the bench turns to the QR card
          [a, b, c].forEach((w, i) => { w.m.lookAt = { x: 3.4, y: -0.6 }; if (dir > 0) setTimeout(() => w.m.hop(1, 24), 700 + i * 120); });
          return;
        }
        if (n === 1 && dir < 0) { a.m.lookAt = { x: 3.4, y: 0 }; b.m.lookAt = { x: 3.4, y: 0 }; c.m.lookAt = { x: -3.4, y: 0 }; return; }
        if (n === 0) { put(a, 330, SEAT); put(b, 640, SEAT); put(c, 1600, FLOOR); c.m.shadow = 1; return; }
        if (dir < 0) return;
        a.m.lookAt = { x: 3.4, y: 0 }; b.m.lookAt = { x: 3.4, y: 0 };
        put(c, 1150, FLOOR); c.m.hop(2, 26);
        await wait(700); if (t !== tk) return;
        put(a, 235, SEAT); put(b, 530, SEAT); a.m.hop(1, 16); b.m.hop(1, 16);
        await wait(600); if (t !== tk) return;
        put(c, 830, SEAT); c.m.shadow = 0; c.m.hop(1, 70);
        await wait(800); if (t !== tk) return;
        [a, b, c].forEach((w, i) => setTimeout(() => w.m.beHappy(2400), i * 150));
        c.m.lookAt = { x: -3.4, y: 0 };
      },
    };
  }

  // ---------- the deck ----------
  const slides = $$('.slide');
  const BG = { green: '#EAF1CF', forest: '#4A6A3B', peach: '#FAD3B4' };
  const bgOf = (s) => BG[s.dataset.bg] || '#FFFFFF';
  const prog = mk('progress', { size: 26, follow: false });
  prog.silent = true; prog.shadow = 0;
  const wave = $('#progress .wave');
  {
    let dPath = 'M0 20';
    for (let x = 0; x <= 1304 + 40; x += 2) dPath += ` L${x} ${(20 + 5 * Math.sin((x / 40) * Math.PI * 2)).toFixed(2)}`;
    wave.innerHTML = `<defs><clipPath id="wclipA"><rect class="ca" x="0" y="0" height="40" width="0"/></clipPath><clipPath id="wclipB"><rect class="cb" y="0" height="40" width="1400" x="14"/></clipPath></defs>
      <g clip-path="url(#wclipA)"><path class="flow" d="${dPath}" fill="none" stroke-width="7" stroke-linecap="round"/></g>
      <g clip-path="url(#wclipB)"><line class="rest" x1="0" y1="20" x2="1300" y2="20" stroke-width="7" stroke-linecap="round"/></g>`;
  }
  let cur = -1, step = 0;
  const steps = (i) => +slides[i].dataset.steps || 0;

  function applyStep(dir) {
    const s = slides[cur];
    $$('[data-s]', s).forEach((e) => e.classList.toggle('on', step >= +e.dataset.s));
    hooks[s.id]?.step?.(step, dir);
  }

  function go(i, st, dir) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    const prev = slides[cur];
    const next = slides[i];
    if (i !== cur) {
      if (cur !== -1) Sfx.slide(dir);
      runId++;
      document.body.classList.toggle('back', dir < 0);
      if (prev) { prev.classList.remove('active'); prev.classList.add('leaving'); setTimeout(() => prev.classList.remove('leaving'), 700); hooks[prev.id]?.leave?.(); }
      const bg = bgOf(next), fill = $('#bgfill'), wipe = $('#wipe');
      if (cur !== -1 && bg !== fill.dataset.c) {
        wipe.style.background = bg;
        wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go');
        clearTimeout(go._wipe); go._wipe = setTimeout(() => { fill.style.background = bg; fill.dataset.c = bg; wipe.classList.remove('go'); }, 920);
      } else { clearTimeout(go._wipe); wipe.classList.remove('go'); fill.style.background = bg; fill.dataset.c = bg; }
      document.body.classList.toggle('dark', next.dataset.bg === 'forest');
      cur = i;
      step = st;
      document.body.classList.toggle('bookend', next.id === 's-title' || next.id === 's-close');
      document.body.classList.toggle('nomark', next.id === 's-full');
      document.body.classList.toggle('noprog', next.id === 's-fest');
      next.classList.add('active');
      hooks[next.id]?.enter?.(step, dir);
      Sfx.resetSteps();
      if (cur !== -1 && next.querySelector('.milo')) { const id = runId; setTimeout(() => { if (alive(id)) Sfx.milo('hello'); }, 650); }
      applyStep(dir);
      const pct = (cur / (slides.length - 1)) * 100;
      $('#progress .walker').style.left = pct + '%';
      $('.ca', wave).style.width = Math.max(0, (pct / 100) * 1304 - 22) + 'px';
      $('.cb', wave).style.x = (pct / 100) * 1304 + 22 + 'px';
      prog.hop(1, 34);
      history.replaceState(null, '', '#' + (cur + 1));
    } else {
      if (st !== step) Sfx.step(dir);
      step = st;
      applyStep(dir);
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
    if (hooks[slides[cur].id]?.key?.(e)) { e.preventDefault(); return; }
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); deck.next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); deck.prev(); }
    else if (e.key === 'Home') go(0, 0, -1);
    else if (e.key === 'End') go(slides.length - 1, 0, 1);
    else if (e.key === 's' || e.key === 'S') { const off = Sfx.toggle(); const hint = $('#hint'); hint.textContent = off ? 'Sound off · S to turn on' : 'Sound on'; hint.classList.remove('hide'); clearTimeout(hint._t); hint._t = setTimeout(() => hint.classList.add('hide'), 1800); }
    else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
  });
  $$('button').forEach((b) => b.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }));

  applyShapes();
  stickerize();
  const start = Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1);
  go(start, 0, 1);
  { const s = +new URLSearchParams(location.search).get('step'); if (s) setTimeout(() => go(cur, s, 1), 200); }
  setTimeout(() => $('#hint').classList.add('hide'), 5000);
})();
