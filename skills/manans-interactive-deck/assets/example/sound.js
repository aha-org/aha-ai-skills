// Sound design: everything is synthesised with Web Audio, no audio files.
// Filtered noise for the "click", a very short low sine for the "body". No melodies.
(() => {
  let ctx = null, out = null, noiseBuf = null;
  // The real Messages sent / received sounds, decoded once audio is allowed.
  const FILES = { crowd: 'assets/crowd.m4a' };
  const clips = {};
  function loadClips() {
    for (const [k, url] of Object.entries(FILES)) {
      if (clips[k] !== undefined) continue;
      clips[k] = null;
      fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).then((buf) => { clips[k] = buf; }).catch(() => {});
    }
  }
  function clip(t, name, gain = 0.9) {
    const buf = clips[name];
    if (!buf) return false;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(g); g.connect(ctx.destination);
    src.start(t);
    return true;
  }
  let muted = false;
  try { muted = localStorage.getItem('smas-mute') === '1'; } catch (_) {}

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      out = ctx.createGain(); out.gain.value = 0.6;
      out.connect(comp); comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    loadClips();
    return ctx;
  }
  // Browsers only allow audio after the presenter touches a key or the mouse.
  ['pointerdown', 'keydown'].forEach((e) => addEventListener(e, ensure, { capture: true }));

  const jitter = (v, amt = 0.06) => v * (1 + (Math.random() * 2 - 1) * amt);

  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function noise(t, { type = 'bandpass', freq = 3000, to, q = 1, gain = 0.3, attack = 0.001, decay = 0.02 }) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
    const g = ctx.createGain(); env(g, t, gain, attack, decay);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(t, Math.random() * 0.4); src.stop(t + attack + decay + 0.05);
  }

  function tone(t, { freq = 120, to, gain = 0.3, attack = 0.002, decay = 0.06, type = 'sine' }) {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
    const g = ctx.createGain(); env(g, t, gain, attack, decay);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + attack + decay + 0.05);
  }

  function curve(t, { type = 'sine', points, dur, gain = 0.1, attack = 0.004 }) {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueCurveAtTime(new Float32Array(points), t, dur);
    const g = ctx.createGain(); env(g, t, gain, attack, dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + attack + dur + 0.05);
  }
  // Warm pluck: a soft tone that drops into pitch, plus a gentle second partial.
  function pluck(t, freq, gain = 0.16) {
    tone(t, { type: 'triangle', freq: freq * 1.5, to: freq, gain, attack: 0.002, decay: 0.16 });
    tone(t, { type: 'sine', freq: freq * 2, gain: gain * 0.35, attack: 0.002, decay: 0.09 });
    noise(t, { freq: 2600, q: 1.4, gain: 0.1, decay: 0.008 });
  }
  // Steps walk up a major pentatonic scale, so a run of steps sounds like a little phrase.
  const SCALE = [392, 440, 523.25, 587.33, 659.25, 783.99];
  let stepIx = 0;
  let crowdBus = null, crowdLP = null, crowdBed = null;
  let lastMilo = 0;

  function play(fn) {
    if (muted || !ensure() || ctx.state !== 'running') return;
    fn(ctx.currentTime + 0.005);
  }

  const Sfx = {
    // A build step on the same slide: one crisp tick.
    // Arrow step: a soft water-drop bloop. Pitch rises slightly through a slide's steps.
    step(dir = 1) {
      stepIx = Math.max(0, Math.min(SCALE.length - 1, stepIx + (dir > 0 ? 1 : -1)));
      const f = SCALE[stepIx] * (dir > 0 ? 1 : 0.84);
      play((t) => {
        tone(t, { type: 'sine', freq: f * 0.7, to: f * 1.6, gain: 0.2, attack: 0.003, decay: 0.07 });
        tone(t + 0.012, { type: 'sine', freq: f * 2.1, to: f * 2.6, gain: 0.035, attack: 0.002, decay: 0.04 });
      });
    },
    resetSteps() { stepIx = 0; },
    // Message sent: a quick upward whoosh that ends in a bright blip.
    send() {
      play((t) => {
        if (clip(t, 'sent')) return;
        noise(t, { freq: 700, to: 4200, q: 2.2, gain: 0.13, attack: 0.03, decay: 0.15 });
        tone(t + 0.12, { freq: 1046, to: 1568, gain: 0.11, attack: 0.003, decay: 0.07 });
      });
    },
    // Message received: two soft glassy notes.
    receive() {
      play((t) => {
        if (clip(t, 'received')) return;
        [[1318.5, 0], [1760, 0.11]].forEach(([fr, d]) => {
          tone(t + d, { freq: fr, gain: 0.13, attack: 0.003, decay: 0.32 });
          tone(t + d, { freq: fr * 2.76, gain: 0.025, attack: 0.002, decay: 0.12 });
        });
      });
    },
    // Milo: a tiny rabbit squeak. Throttled so a hopping Milo never chatters.
    milo(kind = 'squeak') {
      const now = performance.now();
      if (kind === 'squeak') return;   // hops are silent
      if (now - lastMilo < 260) return;
      lastMilo = now;
      play((t) => {
        const k = jitter(1, 0.08);
        if (kind === 'happy') {
          [0, 0.07, 0.14].forEach((d, i) => curve(t + d, { type: 'sine', points: [1100 * k + i * 140, 1700 * k + i * 160, 1500 * k + i * 160], dur: 0.06, gain: 0.07 }));
        } else if (kind === 'hello') {
          curve(t, { type: 'sine', points: [900 * k, 1600 * k, 1250 * k], dur: 0.1, gain: 0.08 });
          curve(t + 0.13, { type: 'sine', points: [1100 * k, 1900 * k, 1500 * k], dur: 0.09, gain: 0.07 });
        } else {
          curve(t, { type: 'sine', points: [1000 * k, 1750 * k, 1350 * k], dur: 0.09, gain: 0.065 });
        }
      });
    },
    // A new slide: a light card swipe with a small woody knock at the end.
    slide(dir = 1) {
      play((t) => {
        noise(t, { freq: dir > 0 ? 900 : 3200, to: dir > 0 ? 3200 : 900, q: 1.6, gain: 0.09, attack: 0.04, decay: 0.11 });
        const k = dir > 0 ? 1 : 0.8;
        tone(t + 0.1, { type: 'sine', freq: 620 * k, to: 560 * k, gain: 0.13, attack: 0.002, decay: 0.07 });
        tone(t + 0.1, { type: 'sine', freq: 620 * k * 3.9, gain: 0.02, attack: 0.001, decay: 0.025 });
      });
    },
    // Choosing something (an option, Myth/Fact, a vote): a switch, press then release.
    select() {
      play((t) => {
        noise(t, { freq: jitter(2600), q: 1.6, gain: 0.34, decay: 0.014 });
        tone(t, { freq: 220, to: 120, gain: 0.16, decay: 0.03 });
        noise(t + 0.055, { freq: jitter(3800), q: 2, gain: 0.16, decay: 0.01 });
      });
    },
    // The rubber stamp landing.
    stamp() {
      play((t) => {
        tone(t, { freq: 95, to: 45, gain: 0.55, decay: 0.13 });
        noise(t, { type: 'lowpass', freq: 900, q: 0.8, gain: 0.32, decay: 0.07 });
        noise(t + 0.004, { freq: 2200, q: 1.2, gain: 0.12, decay: 0.012 });
      });
    },
    // A wrong pick: two dull knocks.
    wrong() {
      play((t) => {
        [0, 0.09].forEach((d) => { tone(t + d, { freq: 110, to: 80, gain: 0.3, decay: 0.05 }); noise(t + d, { type: 'lowpass', freq: 700, gain: 0.16, decay: 0.03 }); });
      });
    },
    // Confetti: a soft cork pop, then a bouncy rising arpeggio and a few quiet sparkles. No noise.
    pop() {
      play((t) => {
        tone(t, { type: 'sine', freq: 1100, to: 260, gain: 0.16, attack: 0.002, decay: 0.06 });
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          tone(t + 0.06 + i * 0.06, { type: 'triangle', freq: f * 1.04, to: f, gain: 0.1, attack: 0.003, decay: 0.16 });
          tone(t + 0.06 + i * 0.06, { type: 'sine', freq: f * 2, gain: 0.02, attack: 0.002, decay: 0.08 });
        });
        [0.32, 0.4, 0.47].forEach((d, i) => tone(t + d, { type: 'sine', freq: [2093, 2637, 3136][i], gain: 0.025, attack: 0.002, decay: 0.12 }));
      });
    },
    soft() {},
    // A crowd: a recorded-style loop of many people chatting. Fades in, and fades right out when the slide changes.
    crowd(on) {
      if (!on) {
        if (crowdBus) {
          const g = crowdBus.gain, now = ctx.currentTime;
          g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + 1.2);
          const b = crowdBus, src = crowdBed; setTimeout(() => { try { src.stop(); } catch (_) {} b.disconnect(); }, 1400);
          crowdBus = null;
        }
        return;
      }
      if (muted || !ensure() || ctx.state !== 'running' || crowdBus || !clips.crowd) return;
      const now = ctx.currentTime;
      crowdBus = ctx.createGain(); crowdBus.gain.setValueAtTime(0, now); crowdBus.gain.linearRampToValueAtTime(0.7, now + 1.6);
      crowdLP = ctx.createBiquadFilter(); crowdLP.type = 'lowpass'; crowdLP.frequency.value = 9000;
      crowdBus.connect(crowdLP); crowdLP.connect(ctx.destination);
      crowdBed = ctx.createBufferSource(); crowdBed.buffer = clips.crowd; crowdBed.loop = true;
      // skip the encoder's padding at both ends so the loop has no gap
      crowdBed.loopStart = 0.12; crowdBed.loopEnd = clips.crowd.duration - 0.12;
      crowdBed.connect(crowdBus); crowdBed.start(now, 0.12 + Math.random() * 10);
    },
    // the crowd drifts away: muffled and quieter, as if you've stopped hearing it
    crowdFar(far) {
      if (!crowdBus) return;
      const now = ctx.currentTime;
      crowdLP.frequency.cancelScheduledValues(now); crowdLP.frequency.setTargetAtTime(far ? 420 : 9000, now, 0.7);
      crowdBus.gain.cancelScheduledValues(now); crowdBus.gain.setTargetAtTime(far ? 0.07 : 0.7, now, 0.7);
    },
    // a sticky note landing: one soft, short wooden tick on a pentatonic note
    paper() { play((t) => { const f = [784, 880, 1046.5, 1174.7, 1318.5][Math.floor(Math.random() * 5)]; tone(t, { type: 'sine', freq: f, gain: 0.035, attack: 0.004, decay: 0.09 }); }); },
    // A timer running out: three soft bell notes going up.
    chime() {
      play((t) => {
        [659.25, 783.99, 1046.5].forEach((f, i) => {
          tone(t + i * 0.16, { type: 'sine', freq: f, gain: 0.14, attack: 0.004, decay: 0.7 });
          tone(t + i * 0.16, { type: 'sine', freq: f * 2.01, gain: 0.025, attack: 0.003, decay: 0.3 });
        });
      });
    },
    // A sticky note landing on the wall: a papery tap.
    tap() { play((t) => { noise(t, { freq: jitter(1800), q: 0.9, gain: 0.16, decay: 0.03 }); tone(t, { freq: 260, to: 180, gain: 0.08, decay: 0.04 }); }); },
    lock() { play((t) => { if (!clip(t, 'lock')) noise(t, { freq: 1800, q: 1.5, gain: 0.3, decay: 0.03 }); }); },
    notify() { play((t) => { if (!clip(t, 'notify')) clip(t, 'received'); }); },
    toggle() {
      muted = !muted;
      if (muted) Sfx.crowd(false);
      try { localStorage.setItem('smas-mute', muted ? '1' : '0'); } catch (_) {}
      if (!muted) Sfx.select();
      return muted;
    },
    get muted() { return muted; },
  };
  window.Sfx = Sfx;
})();
