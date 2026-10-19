// Aha interactive deck: the presentation engine + this deck's slide hooks.
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

  // ================= SLIDE HOOKS =================
  // Each slide can register hooks[id] = { enter(step, dir), step(step, dir), leave(), key(e) }.
  // [data-s="N"] elements reveal on step N automatically; hooks add the motion and Milo on top.
  // Long-running loops must check alive(id) (captured from runId on enter) so they stop when the slide changes.

  // 1. Title: Milo arrives and says hello.
  {
    const m = mk('title', { size: 230, follow: true });
    hooks['s-title'] = { enter() { const id = runId; setTimeout(() => { if (alive(id)) { m.hop(1, 24); m.beHappy(1600); } }, 1100); } };
  }

  // 2. Three ideas, one per click. Milo peeks over the first card when it appears.
  {
    const m = mk('cards', { size: 120, follow: true });
    hooks['s-cards'] = { step(n, dir) { if (n === 1 && dir > 0) { const id = runId; setTimeout(() => { if (alive(id)) { m.hop(2, 22); m.beHappy(1600); } }, 500); } } };
  }

  // 3. A timer drawn as the M3 cookie outline; press → to start it.
  {
    const slide = $('#s-timer'), timer = $('.shape-timer', slide), set = ring(timer), clock = $('.clock', slide), b = $('b', clock);
    const m = mk('timer', { size: 200, mood: 'pink', eyes: 'heart', follow: false });
    const total = +timer.dataset.secs || 120;
    let tk = 0;
    const reset = () => { tk++; clock.classList.remove('running'); b.textContent = fmt(total); set(1); };
    async function run() {
      const t = ++tk, start = performance.now();
      clock.classList.add('running'); m.hop(1, 20);
      while (t === tk) {
        const left = Math.max(0, total - (performance.now() - start) / 1000);
        b.textContent = fmt(Math.ceil(left)); set(left / total);
        if (left <= 0) { Sfx.chime(); m.hop(2, 24); m.beHappy(1600); return; }
        await wait(250);
      }
    }
    hooks['s-timer'] = { enter: reset, step(n, dir) { if (n === 1 && dir > 0) run(); else reset(); }, leave: reset };
  }

  // 4. Close.
  {
    const m = mk('close', { size: 200, follow: true });
    hooks['s-close'] = { enter() { const id = runId; setTimeout(() => { if (alive(id)) { m.hop(2, 24); m.beHappy(2200); } }, 1600); } };
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
      // per-slide chrome: data-bookend hides progress + logo, data-noprog / data-nomark hide one of them
      document.body.classList.toggle('bookend', next.hasAttribute('data-bookend'));
      document.body.classList.toggle('nomark', next.hasAttribute('data-nomark'));
      document.body.classList.toggle('noprog', next.hasAttribute('data-noprog'));
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
