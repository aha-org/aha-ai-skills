// Being There Matters: the presentation engine and every slide's interactions.
// → / Space / PageDown: next build step, then next slide. ← / PageUp: back. F: full screen.
(() => {
  const { tween, wait, E } = MiloKit;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#stage');
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

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
    if (el.closest('[data-s]')) el.classList.add('gated');
  }
  $$('.split').forEach(split);

  // ---------- Material 3 Expressive style shapes ----------
  const shapeCache = {};
  function shapePoly(name) {
    if (shapeCache[name]) return shapeCache[name];
    const pts = MiloKit.shapePoints(name).map(([x, y]) => `${(50 + 50 * x).toFixed(2)}% ${(50 + 50 * y).toFixed(2)}%`);
    return (shapeCache[name] = `polygon(${pts.join(',')})`);
  }
  const applyShapes = (root = document) => $$('[data-shape]', root).forEach((el) => { el.style.clipPath = shapePoly(el.dataset.shape); });

  // ---------- the real bushes: live eyes over the artwork ----------
  const EYES = [[68, 548], [231, 652], [545, 857], [737, 873], [1538, 672], [1383, 752]];
  $$('.bushwrap').forEach((wrap) => {
    const svg = $('.peekers', wrap), flip = wrap.classList.contains('flip');
    EYES.forEach(([x, y], i) => {
      const yy = flip ? 900 - y : y;
      const peek = svgEl('g', { class: 'peek' }, svg);
      const pop = svgEl('g', { class: 'pop', style: `--pd:${1.3 + i * 0.12}s` }, peek);
      const lid = svgEl('g', { class: 'lid', style: `--bd:${-Math.random() * 5}s` }, pop);
      svgEl('ellipse', { cx: x, cy: yy, rx: 17, ry: 19, fill: '#3B3924' }, lid);
      svgEl('circle', { cx: x + 5, cy: yy - 7, r: 4.5, fill: '#F4EFD8', opacity: 0.9 }, lid);
    });
  });
  addEventListener('pointermove', (e) => {
    for (const p of $$('.slide.active .peek')) {
      const b = p.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2), d = Math.hypot(dx, dy) || 1;
      p.style.transform = `translate(${((dx / d) * 5).toFixed(1)}px, ${((dy / d) * 5).toFixed(1)}px)`;
    }
  });

  // ---------- big numbers that roll in digit by digit ----------
  $$('[data-digits]').forEach((n) => { n.innerHTML = [...n.dataset.digits].map((c, i) => `<span style="--i:${i}">${c}</span>`).join(''); });

  // ---------- confetti ----------
  function confetti(el, n = 34) {
    Sfx.pop();
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const cx = (r.left + r.width / 2 - s.left) / scale, cy = (r.top + r.height / 2 - s.top) / scale;
    const cols = ['#F28C38', '#9AB327', '#F6F0A4', '#DE7020', '#749C49', '#FCDDC2'];
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

  // ---------- Milo helpers ----------
  const M = {};
  const mk = (name, o) => (M[name] = new Milo($(`[data-milo="${name}"]`), o));
  function pose(host, kind, size = 100, backdrop) {
    const o = { size, follow: false, backdrop };
    let m;
    if (kind === 'panic') { m = new Milo(host, { ...o, body: 'tall', mood: 'orange' }); m.eyeScale = 1.18; }
    if (kind === 'intoxication') { m = new Milo(host, { ...o, body: 'flat', eyes: 'sleep' }); m.onFrame = (t) => { m.lean = 8 * Math.sin(t / 850); m.dx = 3 * Math.sin(t / 1300); }; }
    if (kind === 'confusion') { m = new Milo(host, { ...o, mood: 'yellow' }); m.onFrame = (t) => { m.rot = 180 + 8 * Math.sin(t / 1100); }; m.shadow = 0; }
    if (kind === 'serious') { m = new Milo(host, { ...o, body: 'flat', mood: 'blue', eyes: 'sad' }); m.breathe = 0.4; }
    return m;
  }
  $$('[data-pose]').forEach((h) => pose(h, h.dataset.pose, h.closest('.moment') ? 125 : 135, h.dataset.bd ? { shape: h.dataset.bd, color: `var(--${h.dataset.bdc}-tint)`, size: 170 } : null));

  // ---------- sticker icons ----------
  const sticker = (name) => `<span class="stk"><i class="ph-fill ph-${name}"></i><i class="ph-bold ph-${name}"></i></span>`;
  const stickerize = (root = document) => $$('.stk-me', root).forEach((el) => { const i = el.querySelector('i.ph-bold'); if (!i) return; const name = [...i.classList].find((k) => k.startsWith('ph-') && k !== 'ph-bold').slice(3); i.outerHTML = sticker(name); el.classList.remove('stk-me'); });

  // ---------- slide hooks ----------
  const hooks = {};

  // 2. What's your default move?
  {
    const chat = $('[data-chat="default"]');
    const slide = $('#s-default');
    const wrap = $('.phone-wrap', slide);
    const peek = mk('default-peek', { size: 150 });
    peek.shadow = 0;
    const opts = $('.opts', slide);
    const texts = { A: 'What happened??', B: "Aww, I'm here. Tell me.", C: "Don't worry, it'll be okay!", D: 'Want to call?' };
    const STICK = { A: 'Detective mode', B: 'Warm. Present.', C: 'Quick fix', D: 'Straight to a call', E: 'Left on read' };
    function reset() {
      opts.classList.remove('chosen'); $$('.opt', slide).forEach((o) => o.classList.remove('picked'));
      $('.closed', slide).classList.remove('on'); $('.notifs', slide).innerHTML = '';
      $$('.sticker', slide).forEach((s) => s.remove());
      peek.setMood('green'); peek.setEyes('oval'); peek.eyeScale = 1; peek.lift = 0; peek.squash = 1;
    }
    function drawChat(step) {
      chat.innerHTML = '<div class="stamp-time"><b>Today</b> 9:41 PM</div>' + (step >= 1 ? '<div class="bubble in">I\'m having a really bad day.</div>' : '<div class="bubble in typing"><i></i><i></i><i></i></div>');
    }
    async function pick(letter) {
      if (!opts.classList.contains('on')) return;
      reset();
      if (letter === 'E') Sfx.select();
      const id = runId;
      opts.classList.add('chosen');
      $(`[data-opt="${letter}"]`, slide).classList.add('picked');
      drawChat(1);
      opts.insertAdjacentHTML('afterend', `<div class="sticker">${sticker({ A: 'magnifying-glass', B: 'heart', C: 'wrench', D: 'phone', E: 'eye-slash' }[letter])}<span>${STICK[letter]}</span></div>`);
      if (letter === 'E') {
        chat.insertAdjacentHTML('beforeend', '<div class="seen">Seen</div>');
        peek.setEyes('dash');
        await wait(1000); if (!alive(id)) return;
        $('.closed', slide).classList.add('on'); Sfx.lock();
        const box = $('.notifs', slide);
        const notif = (t, when) => `<div class="notif"><div class="nav"><i class="ph-fill ph-chat-circle"></i></div><div><div class="nt">Sam<small>iMessage · ${when}</small></div><p>${t}</p></div></div>`;
        box.insertAdjacentHTML('afterbegin', notif("I'm having a really bad day.", 'now'));
        await wait(2600); if (!alive(id)) return;
        box.firstElementChild.querySelector('small').textContent = 'iMessage · 1m ago';
        box.insertAdjacentHTML('afterbegin', notif('are you there?', 'now')); Sfx.notify();
        tween(peek, { lift: -70 }, 800, E.inOut);
        return;
      }
      chat.insertAdjacentHTML('beforeend', `<div class="bubble out">${texts[letter]}</div><div class="delivered">Delivered</div>`);
      setTimeout(() => Sfx.send(), 60);
      if (letter === 'A') { peek.setMood('orange'); tween(peek, { eyeScale: 1.45 }, 180, E.back); peek.hop(1, 10); }
      if (letter === 'B') { peek.setMood('pink'); peek.setEyes('heart'); peek.hop(2, 16); }
      if (letter === 'C') { peek.setEyes('dash'); }
      if (letter === 'D') { peek.hop(2, 18); peek.beHappy(1400); }
    }
    $$('.opt', slide).forEach((b) => b.addEventListener('click', () => pick(b.dataset.opt)));
    hooks['s-default'] = {
      enter(n) {
        reset(); drawChat(0);
        const id = runId;
        setTimeout(() => { if (alive(id)) { drawChat(1); Sfx.receive(); } }, 1700);
      },
      step(n) { if (n < 1) reset(); },
      key(e) { const k = e.key.toUpperCase(); if (k.length === 1 && 'ABCDE'.includes(k)) { pick(k); return true; } },
    };
  }

  // 2b. There's no perfect answer: Milo isn't sure either, then he is
  {
    const m = mk('noanswer', { size: 190, mood: 'yellow', follow: false, backdrop: { shape: 'flower', color: 'var(--butter-tint)', size: 190 } });
    async function wonder(id) {
      const looks = [[-3.2, -1, -4], [3.2, -1, 4], [0, -2.4, 0]];
      while (alive(id) && deck.step() === 0) for (const [x, y, l] of looks) { if (!alive(id) || deck.step() !== 0) return; m.lookAt = { x, y }; tween(m, { lean: l }, 900, E.sine); await wait(1300); }
    }
    hooks['s-noanswer'] = {
      enter(n) { m.setMood(n ? 'green' : 'yellow'); m.setBackdrop(n ? 'var(--green-tint)' : 'var(--butter-tint)'); m.lean = 0; if (!n) wonder(runId); },
      step(n, dir) {
        m.morphBackdrop(n === 1 ? 'cookie12' : 'flower', 700, n === 1 ? 'var(--green-tint)' : 'var(--butter-tint)');
        if (n === 1) { m.setMood('green'); m.lookAt = { x: 0, y: -1 }; tween(m, { lean: 0 }, 400); if (dir > 0) { m.hop(1, 26); m.beHappy(1600); } }
        else { m.setMood('yellow'); if (dir < 0) wonder(runId); }
      },
    };
  }

  // 3. Seven areas around Milo (he watches whichever one you point at)
  mk('domains', { size: 220, backdrop: { shape: 'cookie12', color: 'var(--green-tint)', size: 190 } });

  // 4. Myth or fact
  {
    const slide = $('#s-myth');
    const ITEMS = [
      ['If someone looks happy, their mental health must be fine.', 'myth'],
      ['Mental health problems mean someone is weak.', 'myth'],
      ['You have to have a mental illness to need mental health support.', 'myth'],
      ['Mental health can change over time.', 'fact'],
      ['Talking about your mental health can make things worse.', 'both'],
    ];
    const card = $('.mf-card', slide), q = $('q', card), num = $('.n', card), stamp = $('.stamp', card), why = $('.mf-why', slide), btns = $('.mf-buttons', slide);
    const milo = mk('myth', { size: 160 });
    const guesses = [];
    let shown = -1;
    function render(n, dir) {
      const k = Math.floor(n / 2), rev = n % 2 === 1;
      if (k !== shown) {
        shown = k;
        q.textContent = ITEMS[k][0];
        num.textContent = `0${k + 1} / 05`;
        card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
      }
      $$('.pips i', slide).forEach((p, i) => { p.className = i < k || (i === k && rev) ? 'done' : i === k ? 'now' : ''; });
      const ans = ITEMS[k][1];
      stamp.className = 'stamp ' + ans;
      stamp.textContent = ans.toUpperCase();
      btns.classList.toggle('chosen', rev);
      $$('button', btns).forEach((b) => { const sel = rev && guesses[k] === b.dataset.guess; b.classList.toggle('sel', sel); b.classList.toggle('right', sel && (guesses[k] === ITEMS[k][1] || ITEMS[k][1] === 'both')); });
      if (rev) {
        requestAnimationFrame(() => stamp.classList.add('on'));
        if (dir > 0) setTimeout(() => Sfx.stamp(), 330);
        const g = guesses[k];
        why.textContent = ans === 'both' ? (g ? `The room said ${g}. Plot twist: it can be both.` : 'Plot twist: it can be both.') : g ? (g === ans ? `The room said ${g}. Nailed it!` : `The room said ${g}. It's a ${ans}.`) : `It's a ${ans}.`;
        why.classList.add('on');
        if (dir > 0) {
          if (!g || g === ans || ans === 'both') { milo.hop(1, 24); milo.beHappy(1300); setTimeout(() => confetti(stamp, 30), 250); }
          else { milo.setEyes('dash'); setTimeout(() => milo.setEyes('oval'), 1600); }
        }
      } else { why.classList.remove('on'); milo.setEyes('oval'); }
    }
    function guess(g) {
      if (deck.slideId() !== 's-myth' || deck.step() % 2 === 1) return;
      guesses[Math.floor(deck.step() / 2)] = g;
      Sfx.select();
      const btn = $(`[data-guess="${g}"]`, slide); btn.classList.add('press'); setTimeout(() => btn.classList.remove('press'), 260);
      setTimeout(() => deck.next(), 120);
    }
    $$('[data-guess]', slide).forEach((b) => b.addEventListener('click', () => guess(b.dataset.guess)));
    hooks['s-myth'] = {
      enter() { shown = -1; },
      step: render,
      key(e) { if (e.key === 'm' || e.key === 'M') { guess('myth'); return true; } if (e.key === 'f' || e.key === 'F') { guess('fact'); return true; } },
    };
  }

  // 5. Meet Arjun: two weeks of showing up, then fading out
  {
    const slide = $('#s-arjun');
    const pts = [];
    for (let i = 0; i <= 280; i++) { const a = (i / 280) * Math.PI * 2, rr = 88 + 6 * Math.cos(14 * a); pts.push(`${(100 + rr * Math.cos(a)).toFixed(1)} ${(100 + rr * Math.sin(a)).toFixed(1)}`); }
    $('[data-scallop]', slide).setAttribute('d', 'M' + pts.join(' L') + 'Z');
    const DAYS = [
      [1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0],
      [1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0],
    ];
    const weeks = [$$('.w1 .dots', slide), $$('.w2 .dots', slide)];
    weeks.flat().forEach((r) => { r.innerHTML = '<i></i>'.repeat(7); });
    const dot = (row, d) => weeks[d < 7 ? 0 : 1][row].children[d % 7];
    const m = mk('arjun', { size: 130 });
    const clear = () => weeks.flat().forEach((r) => [...r.children].forEach((i) => (i.className = '')));
    async function fill(instant) {
      const id = runId;
      for (let d = 0; d < 14; d++) {
        for (let ri = 0; ri < 3; ri++) dot(ri, d).className = DAYS[ri][d] ? 'full' : 'gone';
        if (!instant) { await wait(d === 6 ? 700 : 120); if (!alive(id)) return; }
      }
      m.setMood('blue');
    }
    hooks['s-arjun'] = {
      enter() { m.setMood('green'); m.setEyes('oval'); clear(); },
      step(n, dir) {
        if (n === 1 && dir > 0) fill(false);
        else if (n >= 1) fill(true);
        else { clear(); m.setMood('green'); }
        m.setEyes(n >= 2 ? 'sad' : 'oval');
      },
    };
  }

  // 6. What can distress look like? Milo acts out each one.
  {
    const slide = $('#s-distress');
    const m = mk('distress', { size: 200, backdrop: { shape: 'squircle', color: 'var(--accent-tint)', size: 190 } });
    const th = $('.thoughts', slide);
    [[250, -30, 26], [290, -80, 40], [330, -150, 64]].forEach(([x, y, s]) => { const d = document.createElement('i'); d.className = 'thought'; Object.assign(d.style, { left: x + 'px', top: y + 'px', width: s + 'px', height: s + 'px' }); th.appendChild(d); });
    hooks['s-distress'] = {
      step(n) {
        $$('.dcard', slide).forEach((t, i) => t.classList.toggle('now', i + 1 === n));
        m.morphBackdrop(['squircle', 'cookie9', 'clover4', 'flower', 'sunny'][n], 700, ['var(--accent-tint)', 'var(--accent-tint)', 'var(--green-tint)', 'var(--butter-tint)', 'var(--blue-tint)'][n]);
        Object.assign(m, { follow: true, lookAt: null, shake: 0, eyeScale: 1 });
        m.setMood('green'); m.setEyes('oval');
        th.classList.toggle('on', n === 1);
        tween(m, { lean: 0, dx: 0, squash: 1 }, 600);
        if (n === 1) { m.follow = false; m.lookAt = { x: -3, y: -2.6 }; tween(m, { lean: -4 }, 700); }
        if (n === 2) { m.setMood('blue'); m.setEyes('sad'); tween(m, { squash: 0.94 }, 700); }
        if (n === 3) { m.follow = false; m.lookAt = { x: 3.2, y: 2.2 }; tween(m, { dx: 40, lean: 6, squash: 0.94 }, 1000, E.inOut); }
        if (n === 4) { m.setMood('orange'); m.eyeScale = 1.2; tween(m, { squash: 0.9 }, 600); }
      },
    };
  }

  // 7b. Can I fix this? -> What does this person need from me right now?
  {
    const slide = $('#s-fix');
    const from = $('.fix-from', slide);
    const m = mk('fix', { size: 150, mood: 'orange', follow: false });
    let id0 = 0;
    async function fidget(id) {
      while (alive(id) && deck.step() === 0) {
        for (const x of [-3.4, 3.4]) { if (!alive(id) || deck.step() !== 0) return; m.lookAt = { x, y: 0 }; await wait(420); }
      }
    }
    hooks['s-fix'] = {
      enter(n) { id0 = runId; },
      step(n, dir) {
        from.classList.toggle('on', n >= 1);
        if (n >= 1) { m.setMood('green'); m.eyeScale = 1; m.lookAt = { x: 0, y: -2.6 }; if (dir > 0) setTimeout(() => m.beHappy(1600), 900); }
        else { m.setMood('orange'); m.eyeScale = 1.2; fidget(runId); }
      },
    };
  }

  // 8-11. Scenarios: one section at a time, big and readable
  {
    const SC = [
      {
        cat: 'Acute psychosis', title: 'When someone seems disconnected from reality', pose: 'confusion',
        cards: [
          ['eye', 'Notice', 'What might I notice?', '', ["Hearing or seeing things others don't", 'Beliefs that seem unusual or disconnected', 'Confused or disorganised speech', 'Unpredictable, hard-to-understand behaviour', 'Extreme agitation or fear']],
          ['hand-heart', 'Do', 'What can I do?', 'Slow things down', ['Speak simply and calmly', 'Give them physical space', 'Reduce noise and stimulation', 'Listen to the emotion, not the belief', 'Focus on immediate needs and safety']],
          ['prohibit', 'Avoid', 'Avoid', '', ["Arguing 'that's not real'", 'Challenging or mocking their experience', 'Crowding them', 'Trying to reason them out of it']],
          ['lifebuoy', 'Get help', 'Get additional help when', '', ["There's significant confusion or agitation", "They can't care for basic needs", "You're concerned about safety"]],
        ],
        take: 'Your role: support + safety + connection to professional help.',
      },
      {
        cat: 'Acute intoxication', title: 'When something has changed dramatically', pose: 'intoxication',
        cards: [
          ['eye', 'Notice', 'What might I notice?', '', ['Sudden intense fear, racing heart', 'Breathlessness, trembling, sweating', 'Dizziness, chest discomfort', 'Feeling out of control', '“Something terrible is happening.”']],
          ['hand-heart', 'Do', 'What can I do?', 'Slow things down', ['Stay calm yourself; stay with them', 'Move somewhere quieter', 'Speak slowly and simply', 'Help them orient to the present moment', 'Encourage comfortable, unforced breathing']],
          ['prohibit', 'Avoid', 'Avoid', '', ['Leaving them alone when significantly impaired', "Letting them 'sleep it off' if hard to wake", 'Driving them yourself if medically concerning', 'Confronting them aggressively']],
          ['lifebuoy', 'Get help', 'Get urgent help if', '', ['Difficult to wake, or breathing is abnormal', 'They lose consciousness or have a seizure', 'Serious injury or immediate danger']],
        ],
        take: "If intoxication affects consciousness or safety, think medical emergency, not just 'bad behaviour.'",
      },
      {
        cat: 'Panic / acute anxiety', title: 'When the body thinks something terrible is happening', pose: 'panic',
        cards: [
          ['eye', 'Notice', 'What might I notice?', '', ['Sudden intense fear, racing heart', 'Breathlessness, trembling, sweating', 'Dizziness, chest discomfort', 'Feeling out of control', '“Something terrible is happening.”']],
          ['hand-heart', 'Do', 'What can I do?', 'Slow things down', ['Stay calm yourself; stay with them', 'Move somewhere quieter', 'Speak slowly and simply', 'Help them orient to the present moment', 'Encourage comfortable, unforced breathing']],
          ['prohibit', 'Avoid', 'Avoid', '', ['“Calm down.”', "“There's nothing wrong with you.”", 'Overloading them with questions', "Assuming it's 'just anxiety'"]],
          ['push-pin', 'Remember', 'Remember', '', ['If symptoms are new, severe or unusual, or could be a medical emergency: seek medical help']],
        ],
        take: "You don't need to make the panic disappear. Your calm presence matters more than perfect words.",
      },
      {
        cat: 'Risk to life', title: 'When safety becomes the priority', pose: 'serious',
        cards: [
          ['warning', 'Suicide', 'Suicide: signs', '', ['Talk about wanting to die, or hopelessness', 'Feeling like a burden; no reason to live', 'Talking about suicide', 'Significant behavioural changes']],
          ['warning-octagon', 'Violence', 'Homicide / serious violence', '', ['Threats to seriously harm another person', 'Expressed intent to hurt someone', 'Severe agitation or threatening behaviour', 'Access to something that could cause harm']],
          ['hand-heart', 'Do', 'What can I do?', '', ['Create distance if needed', 'Stay with them only if safe', 'Involve professional / crisis support', 'Contact emergency services if urgent']],
          ['push-pin', 'Remember', 'Remember', '', ["Don't promise secrecy", "Don't try to negotiate or solve it all yourself", "Don't manage it alone"]],
        ],
        take: "Safety first. Don't manage a high-risk situation alone.",
      },
    ];
    $$('.scenario').forEach((slide) => {
      const i = +slide.dataset.scenario, s = SC[i];
      slide.innerHTML = `
        <div class="scen">
          <div class="left">
            <div class="eyebrow rise">${i + 1} of 4 · ${s.cat}</div>
            <h2 class="split">${s.title}</h2>
            <div class="stagepose"><div class="host"></div></div>
          </div>
          <div class="right">
            <div class="tabs rise" style="--d:3">${s.cards.map(([ic, tab]) => `<div class="tab">${tab}</div>`).join('')}</div>
            <div class="panel">${s.cards.map(([ic, , h, sub, items]) => `
              <div class="sect t-${{ eye: 'butter', 'hand-heart': 'green', prohibit: 'accent', lifebuoy: 'green', 'push-pin': 'butter', warning: 'accent', 'warning-octagon': 'accent' }[ic]}"><h3>${h}${sub ? `<small>${sub}</small>` : ''}</h3>
                <ul>${items.map((t, j) => `<li style="--k:${j}">${t}</li>`).join('')}</ul></div>`).join('')}
            </div>
            <p class="takeaway" data-s="4">${s.take}</p>
          </div>
        </div>`;
      split($('h2', slide));
      slide._pose = pose($('.host', slide), s.pose, 200, { shape: ['clover4', 'squircle', 'sunny', 'cookie9'][i], color: `var(--${['butter', 'green', 'accent', 'blue'][i]}-tint)`, size: 170 });
      hooks[slide.id] = {
        step(n) {
          const k = Math.min(n, 3);
          $$('.tab', slide).forEach((t, j) => { t.classList.toggle('now', j === k); t.classList.toggle('done', j < k); });
          $$('.sect', slide).forEach((c, j) => { c.classList.toggle('now', j === k); c.classList.toggle('past', j < k); });
          slide._pose?.morphBackdrop(['clover4', 'squircle', 'sunny', 'cookie9', 'flower'][(i + k) % 5], 650);
        },
      };
    });
  }

  // 14. You can ask: Milo says it, in his handwriting
  {
    const slide = $('#s-ask');
    const m = mk('ask', { size: 250, body: 'tall', follow: false, backdrop: { shape: 'clover4', color: 'var(--green-tint)', size: 190 } });
    m.lean = 7; m.lookAt = { x: 3, y: -1.2 };
    const span = $('[data-type]', slide);
    const full = span.dataset.type;
    hooks['s-ask'] = {
      async enter(n) {
        const id = runId;
        if (n > 0) { span.textContent = full; return; }
        span.textContent = '';
        await wait(1200);
        for (let i = 1; i <= full.length; i++) {
          if (!alive(id)) return;
          span.textContent = full.slice(0, i);
          if (full[i - 1] === ' ') m.squash = 1.02; else m.squash += (1 - m.squash) * 0.4;
          await wait(full[i - 1] === '.' || full[i - 1] === '?' ? 420 : 40);
        }
        m.squash = 1;
      },
    };
  }

  // 15. Six steps: Milo hops from card to card
  {
    const slide = $('#s-steps');
    const track = $('.track6', slide);
    const STEPS = [
      ['Pause.', 'Check.', 'Is this safe?'],
      ['Notice.', '', "What's changed?"],
      ['Listen.', 'Be with them.', "Don't rush to fix"],
      ['Ask.', "What's happening?", 'Ask directly'],
      ['Connect.', 'What needs attention now?', 'Safety first'],
      ['Follow up.', 'What happens next?', "Who's taking over?"],
    ];
    const LOOK = [['hand-palm', '#6E9BDB'], ['eye', '#EE6A91'], ['ear', '#F28C38'], ['chat-circle-dots', '#3E5B31'], ['link-simple', '#5E9C3A'], ['arrow-bend-up-right', '#8E7CC3']];
    STEPS.forEach(([v, s, q], i) => {
      track.insertAdjacentHTML('beforeend', `<div class="mcard" style="--c:${LOOK[i][1]}"><div class="bc">${sticker(LOOK[i][0])}<span class="no">0${i + 1}</span></div><div class="verb">${v.replace('.', '')}</div><div class="sub">${s}</div><div class="q">${q}</div></div>`);
    });
    // The barrel: cards wrap a vertical cylinder; the front card faces us, neighbours curve away and blur.
    const cards = $$('.mcard', slide);
    const hopper = $('.hopper', slide);
    const m = mk('hopper', { size: 92, follow: false });
    const CW = 300, CH = 420, R = 760, STEP = 32, CY = 575, FS = 0.76, GAP = 236;
    const placeMilo = (x, top) => { hopper.style.left = x - (92 * 1.7) / 2 + 'px'; hopper.style.top = top - 92 * 1.6 * 152 / 160 + 8 + 'px'; };
    function layout(n, from) {
      const flat = n >= 7, focus = Math.max(0, Math.min(5, n - 1));
      cards.forEach((c, i) => {
        let tf, f = 'none', o = 1;
        if (flat) {
          const x = 800 + (i - 2.5) * GAP;
          tf = `translate3d(${x - CW / 2}px, ${600 - CH / 2}px, 0) scale(${FS})`;
        } else {
          const k = i - focus, rad = (k * STEP * Math.PI) / 180;
          const x = 800 + R * Math.sin(rad), z = R * Math.cos(rad) - R;
          tf = `translate3d(${(x - CW / 2).toFixed(1)}px, ${CY - CH / 2 + (from ? 300 : 0)}px, ${z.toFixed(1)}px) rotateY(${k * STEP}deg)`;
          f = k ? `blur(${Math.abs(k) * 3}px)` : 'none';
          o = Math.abs(k) >= 2 ? 0 : k ? 0.8 : 1;
        }
        c.style.transform = tf; c.style.filter = f; c.style.opacity = from ? 0 : o;
        c.style.transitionDelay = flat ? i * 50 + 'ms' : '0ms';
        c.classList.toggle('front', !flat && i === focus);
      });
      if (flat) placeMilo(800 + 2.5 * GAP, 600 - (CH * FS) / 2);
      else placeMilo(800, CY - CH / 2);
      hopper.style.opacity = from ? 0 : 1;
    }
    hooks['s-steps'] = {
      enter(n) {
        [...cards, hopper].forEach((c) => (c.style.transition = 'none'));
        layout(n, true); void slide.offsetWidth;
        [...cards, hopper].forEach((c) => (c.style.transition = ''));
        requestAnimationFrame(() => layout(deck.step()));
      },
      step(n, dir) {
        layout(n);
        if (dir > 0 && n < 7) { m.lookAt = { x: -3, y: 0 }; m.hop(1, 16); setTimeout(() => (m.lookAt = null), 700); }
        if (dir < 0) { m.lookAt = { x: 3, y: 0 }; setTimeout(() => (m.lookAt = null), 700); }
        if (dir > 0 && n === 7) m.hop(1, 40);
      },
    };
  }

  // 16. Back to Arjun: the conversation plays in, message by message
  {
    const chat = $('[data-chat="back"]');
    const MSGS = [
      ['stamp', '<b>Today</b> 10:12 PM'],
      ['out', "Hey, you've been quiet lately."],
      ['out', 'How are you really doing?'],
      ['time-r', '10:12 PM'],
      ['in', "I'm fine. Just tired."],
      ['in', "Honestly? I don't know."],
      ['in', 'Sometimes I just wish I could disappear.'],
      ['time', '10:14 PM'],
    ];
    const html = ([k, t]) => k === 'stamp' ? `<div class="stamp-time">${t}</div>` : k.startsWith('time') ? `<div class="msg-time${k === 'time-r' ? ' r' : ''}">${t}</div>` : `<div class="bubble ${k}">${t}</div>`;
    hooks['s-back'] = {
      async enter(n) {
        chat.innerHTML = '';
        if (n > 0) { chat.innerHTML = MSGS.map(html).join(''); return; }
        const id = runId;
        await wait(1400);
        for (const msg of MSGS) {
          if (!alive(id)) return;
          const [k] = msg;
          if (k === 'in') {
            chat.insertAdjacentHTML('beforeend', '<div class="bubble in typing"><i></i><i></i><i></i></div>');
            await wait(1900); if (!alive(id)) return;
            chat.lastElementChild.remove();
            chat.insertAdjacentHTML('beforeend', html(msg)); Sfx.receive();
            await wait(1100);
          } else if (k === 'out') {
            chat.insertAdjacentHTML('beforeend', html(msg)); Sfx.send();
            await wait(1400);
          } else { chat.insertAdjacentHTML('beforeend', html(msg)); await wait(300); }
        }
      },
    };
  }

  // 17. Vote as we go: sort each line into helps / doesn't help
  {
    const slide = $('#s-vote');
    const ITEMS = [
      ['You have so much to live for.', 'no'],
      ["I'm really glad you told me.", 'yes'],
      ['Think about how this affects your family.', 'no'],
      ['Are you thinking about suicide?', 'yes'],
      ["Don't say things like that.", 'no'],
      ["Let's get some support together.", 'yes'],
      ["I won't tell anyone.", 'no'],
      ['Everything will be okay.', 'no'],
    ];
    const pile = $('.pile', slide), count = $('.vote-count', slide), hint = $('.vote-hint', slide);
    const bins = { no: $('[data-bin="no"]', slide), yes: $('[data-bin="yes"]', slide) };
    const lists = { no: $('.list', bins.no), yes: $('.list', bins.yes) };
    let current = null;
    const chip = (t) => `<div class="chipq">“${t}”</div>`;
    const SUM = {
      no: [['arrows-in-simple', 'Minimise', '#E8584B'], ['gavel', 'Moralise', '#F28C38'], ['hand-pointing', 'Guilt-trip', '#EE6A91'], ['lock-key', 'Promise secrecy', '#B9603A'], ['wrench', 'Try to fix it all', '#D2453D']],
      yes: [['ear', 'Listen', 'var(--forest)'], ['person-simple', 'Stay present', '#6E9BDB'], ['chat-circle-dots', 'Ask directly', '#44681B'], ['seal-check', 'Take it seriously', '#5C8F3A'], ['link-simple', 'Connect to support', '#3D6EA8']],
    };
    for (const b of ['no', 'yes']) $(`[data-sum="${b}"]`, slide).innerHTML = SUM[b].map(([ic, t, col], i) => `<div class="stile" style="--c:${col};--k:${i};--rot:${[-2, 1.5, -1, 2, -1.5][i]}deg">${sticker(ic)}<b>${t}</b></div>`).join('');
    function render(n, dir) {
      const i = Math.floor(n / 2), sorted = n % 2 === 1, done = n >= 16;
      for (const b of ['no', 'yes']) { lists[b].innerHTML = ''; bins[b].classList.toggle('summed', done); }
      ITEMS.forEach(([t, b], k) => { if (k < i || (k === i && sorted && dir < 0)) lists[b].insertAdjacentHTML('beforeend', chip(t)); });
      count.textContent = done ? '' : `${String(i + 1).padStart(2, '0')} / 08`;
      hint.style.opacity = done || sorted ? 0 : 1;
      if (current && (!sorted || dir < 0 || done)) { current.remove(); current = null; }
      if (done) return;
      if (!sorted) {
        current = document.createElement('div');
        current.className = 'qcard in';
        current.textContent = `“${ITEMS[i][0]}”`;
        pile.appendChild(current);
      } else if (dir > 0 && current) {
        const [t, b] = ITEMS[i], c = current;
        current = null;
        c.classList.remove('in');
        requestAnimationFrame(() => c.classList.add(b === 'no' ? 'toL' : 'toR'));
        setTimeout(() => { c.remove(); lists[b].insertAdjacentHTML('beforeend', chip(t)); bins[b].classList.remove('flash'); void bins[b].offsetWidth; bins[b].classList.add('flash'); }, 650);
      }
    }
    $$('.bin', slide).forEach((bin) => bin.addEventListener('click', () => {
      const n = deck.step();
      if (n % 2 === 1 || n >= 16 || !current) return;
      const right = ITEMS[Math.floor(n / 2)][1];
      if (bin.dataset.bin !== right) { Sfx.wrong(); current.classList.remove('in'); current.classList.add('wrong'); setTimeout(() => deck.next(), 480); }
      else { Sfx.select(); confetti(bin, 26); deck.next(); }
    }));
    hooks['s-vote'] = { step: render };
  }

  // 18. You are the bridge: walk them to support. Then carrying vs caring, as a little story.
  {
    const slide = $('#s-bridge');
    const journey = $('.journey', slide), story = $('.story', slide);
    const youEl = $('.actor.you', slide), themEl = $('.actor.them', slide);
    const you = mk('you', { size: 120, follow: false });
    const them = mk('them', { size: 100, mood: 'blue', eyes: 'sad', follow: false });
    // x = centre of each Milo inside the journey box (1408 wide)
    const put = (el, size, x, instant) => { if (instant) el.style.transition = 'none'; el.style.left = x - (size * 1.7) / 2 + 'px'; if (instant) { void el.offsetWidth; el.style.transition = ''; } };
    const DOOR = 1273;
    youEl.style.bottom = 120 - 120 * 0.08 + 'px'; themEl.style.bottom = 120 - 100 * 0.08 + 'px';
    // the story: you, flattened under the weight, then side by side
    const a = mk('care-you', { size: 200, follow: false });
    const b = mk('care-them', { size: 160, mood: 'blue', follow: false });
    const aEl = $('.m.a', slide), bEl = $('.m.b', slide);
    const storyAt = (n) => {
      story.classList.toggle('dropped', n === 2);
      story.classList.toggle('lifted', n >= 3);
      story.classList.toggle('caring', n >= 3);
      aEl.style.left = (n >= 3 ? 670 : 800) - 200 * 0.85 + 'px';
      bEl.style.left = (n >= 3 ? 960 : 1700) - 160 * 0.85 + 'px';
      bEl.style.opacity = n >= 3 ? 1 : 0;
    };
    function place(n) {
      journey.classList.toggle('gone', n >= 2);
      themEl.classList.toggle('inside', n >= 1);
      put(youEl, 120, n >= 1 ? 1020 : 700, true); put(themEl, 100, n >= 1 ? DOOR : 160, true);
      them.setMood(n >= 1 ? 'green' : 'blue'); them.setEyes(n >= 1 ? 'oval' : 'sad');
      you.lookAt = { x: n >= 1 ? 3.2 : -3.2, y: -0.5 };
      if (n >= 3) { a.body = 'clean'; a.to = null; a.blend = 1; a.squash = 1; a.setEyes('oval'); a.happiness = 1; b.lookAt = { x: -3.2, y: -0.6 }; a.lookAt = { x: 3.2, y: -0.6 }; }
      else { a.body = 'flat'; a.to = null; a.blend = 1; a.squash = n === 2 ? 0.8 : 1; a.setEyes(n === 2 ? 'sad' : 'oval'); a.happiness = 0; a.lookAt = { x: 0, y: 2 }; }
      a.buildPaths();
      storyAt(n);
    }
    async function walk() {
      const id = runId;
      const hopFor = async (m, ms) => { m.silent = true; const end = performance.now() + ms; while (performance.now() < end && alive(id)) await m.hop(1, 16); m.silent = false; };
      you.lookAt = { x: -3.2, y: 0 };
      youEl.style.transition = 'left 1s cubic-bezier(.45,0,.55,1)'; put(youEl, 120, 330);
      await hopFor(you, 1000); if (!alive(id)) return;
      you.lookAt = { x: -3.2, y: -0.5 }; them.lookAt = { x: 3.2, y: -0.5 }; them.setEyes('oval');
      await wait(450); if (!alive(id)) return;
      you.lookAt = { x: 3.2, y: 0 }; them.lookAt = { x: 3.2, y: 0 };
      youEl.style.transition = themEl.style.transition = 'left 2.6s cubic-bezier(.45,0,.55,1)';
      put(youEl, 120, 960); put(themEl, 100, 1100);
      await Promise.all([hopFor(you, 2600), hopFor(them, 2600)]); if (!alive(id)) return;
      them.setMood('green'); you.lookAt = { x: 3.2, y: -0.6 };
      themEl.style.transition = 'left .9s ease, opacity .6s ease .5s, transform .6s ease .5s';
      put(themEl, 100, DOOR); themEl.classList.add('inside');
      await hopFor(them, 900); if (!alive(id)) return;
      you.beHappy(2000); you.hop(1, 20); confetti($('.portal', slide), 30);
    }
    async function drop() {
      const id = runId;
      a.body = 'clean'; a.to = null; a.blend = 1; a.squash = 1; a.setEyes('oval'); a.buildPaths();
      storyAt(1); void story.offsetWidth;
      await wait(250); if (!alive(id)) return;
      story.classList.add('dropped');
      await wait(560); if (!alive(id)) return;
      Sfx.stamp();
      a.morphTo('flat', 260, E.out); tween(a, { squash: 0.8 }, 220, E.out); a.setEyes('sad'); a.lookAt = { x: 0, y: 2 };
    }
    async function lift() {
      const id = runId;
      storyAt(3); Sfx.select();
      await wait(250); if (!alive(id)) return;
      a.morphTo('clean', 500, E.back); tween(a, { squash: 1 }, 500, E.back); a.setEyes('oval');
      await wait(400); if (!alive(id)) return;
      a.lookAt = { x: 3.2, y: -0.6 }; b.lookAt = { x: -3.2, y: -0.6 };
      b.hop(2, 14); await wait(700); if (!alive(id)) return;
      a.beHappy(2400); Sfx.pop();
    }
    hooks['s-bridge'] = {
      enter(n) { place(n); },
      step(n, dir) {
        if (dir > 0 && n === 1) walk();
        else if (dir > 0 && n === 2) { journey.classList.add('gone'); drop(); }
        else if (dir > 0 && n === 3) lift();
        else if (dir > 0 && n === 4) {}
        else place(n);
      },
    };
  }

  // 19. Helplines
  {
    const m = mk('help', { size: 72 });
    hooks['s-help'] = { step(n, dir) { if (n === 1 && dir > 0) setTimeout(() => { m.hop(1, 16); m.beHappy(1400); }, 400); } };
  }

  // 20. Come back to yourself: a guided grounding exercise
  {
    const slide = $('#s-ground');
    const m = mk('ground', { size: 220, backdrop: { shape: 'cookie9', color: '#FCDDC2', size: 190 } });
    m.bdScale = 0.8;
    const ring = $('.ring', slide), fg = $('.fg', ring), rtext = $('text', ring);
    const C = 2 * Math.PI * 74;
    fg.style.strokeDasharray = C;
    const br = { get s() { return m.bdScale; }, set s(v) { m.bdScale = v; } };
    let gTok = 0;
    async function countdown(live, secs, label) {
      ring.classList.add('on');
      const start = performance.now();
      while (live()) {
        const t = (performance.now() - start) / 1000;
        if (t >= secs) break;
        fg.style.strokeDashoffset = C * (t / secs);
        rtext.textContent = label ?? Math.ceil(secs - t);
        await new Promise(requestAnimationFrame);
      }
      fg.style.strokeDashoffset = C;
    }
    async function run(n) {
      const id = runId, tok = ++gTok;
      const LIVE = () => alive(id) && tok === gTok;
      ring.classList.remove('on');
      Object.assign(m, { follow: true, lookAt: null, lift: 0, shadow: 1 });
      tween(m, { squash: 1, lean: 0 }, 400);
      tween(br, { s: 0.8 }, 800);
      if (n === 1) {
        while (LIVE()) { await tween(m, { shadow: 2.4, squash: 0.97 }, 1600, E.sine); if (!LIVE()) break; await tween(m, { shadow: 1, squash: 1 }, 1600, E.sine); }
      }
      if (n === 2) {
        for (let r = 0; r < 2 && LIVE(); r++) {
          await tween(m, { squash: 0.84, shadow: 2.2 }, 600, E.out);
          await countdown(LIVE, 5);
          if (!LIVE()) return;
          ring.classList.remove('on');
          await tween(m, { squash: 1, shadow: 1 }, 520, E.back);
          await wait(900);
        }
      }
      if (n === 3) {
        for (let r = 0; r < 2 && LIVE(); r++) {
          await tween(m, { squash: 1.13, lift: 16 }, 1000, E.inOut);
          await wait(1300); if (!LIVE()) return;
          await tween(m, { squash: 0.88, lift: 0 }, 200, E.in);
          await tween(m, { squash: 1 }, 520, E.back);
          await wait(1200);
        }
      }
      if (n === 4) {
        for (let r = 0; r < 2 && LIVE(); r++) {
          tween(br, { s: 1.5 }, 4000, E.sine); tween(m, { squash: 1.06 }, 4000, E.sine);
          await countdown(LIVE, 4, 'in'); if (!LIVE()) return;
          tween(br, { s: 0.7 }, 6000, E.sine); tween(m, { squash: 0.97 }, 6000, E.sine);
          await countdown(LIVE, 6, 'out'); if (!LIVE()) return;
        }
        ring.classList.remove('on');
        tween(m, { squash: 1 }, 600);
      }
      if (n === 5) {
        m.follow = false;
        const looks = [[-3.4, 0.4, -3], [3.4, 0.4, 3], [0, -2.8, 0], [-2.4, -1.6, -2], [0, 0, 0]];
        while (LIVE()) {
          for (const [x, y, l] of looks) { if (!LIVE()) return; m.lookAt = { x, y }; tween(m, { lean: l }, 1200, E.sine); await wait(1700); }
        }
      }
      if (n === 6) { m.setEyes('oval'); m.beHappy(2400); }
    }
    hooks['s-ground'] = {
      step(n) {
        $$('.gdots i', slide).forEach((d, i) => { d.className = i + 1 === n ? 'now' : i + 1 < n ? 'done' : ''; });
        $$('.gstep', slide).forEach((g) => g.classList.toggle('on', +g.dataset.g === n));
        const notes = $$('.affirm .note', slide);
        notes.forEach((e) => e.classList.remove('on'));
        if (n >= 6) { const id = runId, tk = gTok + 1; notes.forEach((e, i) => setTimeout(() => { if (alive(id) && gTok === tk) { e.classList.add('on'); Sfx.step(1); } }, 500 + i * 650)); }
        run(n);
      },
    };
  }

  // 21. Close
  {
    const m = mk('close', { size: 110 });
    hooks['s-close'] = { enter() { const id = runId; setTimeout(() => { if (alive(id)) { m.hop(2, 24); m.beHappy(2200); } }, 2200); } };
  }

  // ---------- the deck ----------
  const slides = $$('.slide');
  const prog = mk('progress', { size: 26, follow: false });
  prog.silent = true;
  const wave = $('#progress .wave');
  {
    let dPath = 'M0 20';
    for (let x = 0; x <= 1304 + 40; x += 2) dPath += ` L${x} ${(20 + 5 * Math.sin((x / 40) * Math.PI * 2)).toFixed(2)}`;
    wave.innerHTML = `<defs><clipPath id="wclipA"><rect class="ca" x="0" y="0" height="40" width="0"/></clipPath><clipPath id="wclipB"><rect class="cb" y="0" height="40" width="1400" x="14"/></clipPath></defs>
      <g clip-path="url(#wclipA)"><path class="flow" d="${dPath}" fill="none" stroke-width="7" stroke-linecap="round"/></g>
      <g clip-path="url(#wclipB)"><line class="rest" x1="0" y1="20" x2="1300" y2="20" stroke-width="7" stroke-linecap="round"/></g>`;
  }
  prog.shadow = 0;
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
      const theme = next.dataset.theme;
      const wasForest = document.body.classList.contains('forest');
      if ((theme === 'forest') !== wasForest && cur !== -1) {
        const wipe = $('#wipe');
        wipe.style.background = theme === 'forest' ? '#4A6A3B' : '#FDFBF7';
        wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go');
        clearTimeout(go._wipe); go._wipe = setTimeout(() => { document.body.classList.toggle('forest', slides[cur].dataset.theme === 'forest'); wipe.classList.remove('go'); }, 920);
      } else { clearTimeout(go._wipe); $('#wipe').classList.remove('go'); document.body.classList.toggle('forest', theme === 'forest'); }
      cur = i;
      step = st;
      document.body.classList.toggle('bookend', next.id === 's-title' || next.id === 's-close');
      document.body.classList.toggle('noprog', next.id === 's-back' || next.id === 's-default');
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
    slideId: () => slides[cur].id,
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
