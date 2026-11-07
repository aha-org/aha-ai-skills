// Milo's colours, timing tokens and the maths that turns a moment in time into a pose.
// Ported 1:1 from the SwiftUI version (MiloTokens.swift, MiloAlive.swift).
// Pure maths on time, so every frame is predictable and haptics can be scheduled
// from the same numbers.

import type { ArmPose, MiloBody } from './geometry';

export type MiloEyes = 'oval' | 'happy' | 'sad' | 'sleep' | 'dash' | 'heart';
export type MiloMood = 'green' | 'blue' | 'pink' | 'yellow' | 'orange' | 'red';

/** body = front face, side = the darker band (body about 14% darker, a touch richer). */
export const MOODS: Record<MiloMood, { body: string; side: string; label: string }> = {
  green: { body: '#AEC123', side: '#94B214', label: 'Green, natural' },
  blue: { body: '#7BA6DE', side: '#658CBF', label: 'Blue, sad' },
  pink: { body: '#F4668E', side: '#D25075', label: 'Pink, love' },
  yellow: { body: '#F1C93F', side: '#CFAB2D', label: 'Yellow, confused' },
  orange: { body: '#F59A3D', side: '#D3802B', label: 'Orange, alert' },
  red: { body: '#E8584B', side: '#C84438', label: 'Red, angry' },
};

export const EYE_LABELS: Record<MiloEyes, string> = {
  oval: 'Default', happy: 'Happy', sad: 'Sad', sleep: 'Sleepy', dash: 'Deadpan', heart: 'Love',
};

/** The colour Milo takes on with an expression. */
export const EYE_MOOD: Record<MiloEyes, MiloMood> = {
  oval: 'green', happy: 'green', sad: 'blue', sleep: 'green', dash: 'green', heart: 'pink',
};

export const INK = {
  /** Eyes: a warm dark brown, never pure black (the illustrator's #3A261C). */
  eye: '#3A261C',
  heart: '#C11D4A',
  /** Angry eyes: a dark red, still readable on his red body. */
  angry: '#5C0B0B',
  blush: '#E94F7E',
  /** Contact shadow: the animator's #E0DADA on white, as a tint so it works on any background. */
  shadow: 'rgba(96, 64, 64, 0.2)',
};

/** Timing, in seconds. */
export const T = {
  breathePeriod: 3.8, breatheDepth: 0.012,
  sleepBreathePeriod: 5.2, sleepBreatheDepth: 0.024,
  sadBreathePeriod: 4.6, sadBreatheDepth: 0.008,

  blinkSlot: 4.5, blinkClose: 0.07, blinkHold: 0.03, blinkOpen: 0.1,
  doubleBlinkChance: 0.22, doubleBlinkGap: 0.26,

  glanceSlot: 7.0, glanceChance: 0.55, glanceHold: 1.4, glanceEase: 0.28,
  glanceDistance: 3.2, glanceLean: 1.4,

  crouch: 0.09, crouchSquash: 0.86, rise: 0.2, hopHeight: 18, stretchPeak: 1.08,
  fall: 0.17, fallStretch: 1.05, landSquash: 0.11, wobbleDecay: 0.13, wobblePeriod: 0.26,
  settle: 0.5, happyAfterLanding: 0.45,
  /** How long the eyes take to morph between the oval and the happy arc. */
  eyeMorph: 0.14,

  waveGrow: 0.22, wavePeriod: 0.38, waveCount: 5, waveRetract: 0.28, waveAngle: 136, waveSwing: 14,

  get landAt() { return this.crouch + this.rise + this.fall; },
  get boopTotal() { return this.crouch + this.rise + this.fall + this.settle; },
  get waveTotal() { return this.waveGrow + this.waveCount * this.wavePeriod + this.waveRetract; },
};

// Plain numbers for the UI thread (getters don't travel into worklets).
export const LAND_AT = T.crouch + T.rise + T.fall;
export const BOOP_TOTAL = LAND_AT + T.settle;
export const WAVE_TOTAL = T.waveGrow + T.waveCount * T.wavePeriod + T.waveRetract;
const TT = {
  breathePeriod: T.breathePeriod, breatheDepth: T.breatheDepth,
  sleepBreathePeriod: T.sleepBreathePeriod, sleepBreatheDepth: T.sleepBreatheDepth,
  sadBreathePeriod: T.sadBreathePeriod, sadBreatheDepth: T.sadBreatheDepth,
  blinkSlot: T.blinkSlot, blinkClose: T.blinkClose, blinkHold: T.blinkHold, blinkOpen: T.blinkOpen,
  doubleBlinkChance: T.doubleBlinkChance, doubleBlinkGap: T.doubleBlinkGap,
  glanceSlot: T.glanceSlot, glanceChance: T.glanceChance, glanceHold: T.glanceHold, glanceEase: T.glanceEase,
  glanceDistance: T.glanceDistance, glanceLean: T.glanceLean,
  crouch: T.crouch, crouchSquash: T.crouchSquash, rise: T.rise, hopHeight: T.hopHeight, stretchPeak: T.stretchPeak,
  fall: T.fall, fallStretch: T.fallStretch, landSquash: T.landSquash, wobbleDecay: T.wobbleDecay,
  wobblePeriod: T.wobblePeriod, settle: T.settle, happyAfterLanding: T.happyAfterLanding, eyeMorph: T.eyeMorph,
  waveGrow: T.waveGrow, wavePeriod: T.wavePeriod, waveCount: T.waveCount, waveRetract: T.waveRetract,
  waveAngle: T.waveAngle, waveSwing: T.waveSwing,
  landAt: LAND_AT, boopTotal: BOOP_TOTAL, waveTotal: WAVE_TOTAL,
};

/** Everything needed to draw one frame of Milo. */
export type MiloPose = {
  body: MiloBody;
  mood: MiloMood;
  eyes: MiloEyes;
  lookX: number;
  lookY: number;
  /** 0 = open, 1 = closed (oval eyes only). */
  blink: number;
  eyeScale: number;
  /** Vertical scale from the ground (<1 squash, >1 stretch); width compensates. */
  squash: number;
  /** Shear: positive leans the top to the right, in units at the top of the body. */
  lean: number;
  /** Height above the ground in units. */
  lift: number;
  /** Contact shadow: 1 = grounded, 0 = hidden. */
  shadow: number;
  arm: ArmPose | null;
  /** Morph from default ovals (0) to happy arcs (1), for `oval` eyes. */
  happiness: number;
  /** 0...1: the notebook he holds while listening (0 = put away). */
  notebook: number;
  /** 0...1: how much he has written in it (the pencil moves along the lines). */
  write: number;
  /** 0...1: the notebook pushed aside (out to his left) so he can look at the field. */
  aside: number;
  /** 0...1: the notebook flipped open towards you, for writing. */
  open: number;
  /** 0...1: a light bulb popping up over his head (an idea). */
  bulb: number;
  /** 0...1: two rings spinning over his head (overthinking), and their spin angle. */
  rings: number;
  spin: number;
  /** 0...1: the first-version body morphing into the Aha body. */
  morph: number;
  /** 0...1: angry eyes (the lids cut down towards the middle of the face). */
  anger: number;
};

export function basePose(p: Partial<MiloPose> = {}): MiloPose {
  return {
    body: 'aha', mood: 'green', eyes: 'oval', lookX: 0, lookY: 0, blink: 0, eyeScale: 1,
    squash: 1, lean: 0, lift: 0, shadow: 1, arm: null, happiness: 0, notebook: 0, write: 0, aside: 0, open: 0, bulb: 0, rings: 0, spin: 0, morph: 0, anger: 0, ...p,
  };
}

// MARK: - Easing and randomness

export function easeInOut(x: number) {
  'worklet';
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}
function easeOut(x: number) {
  'worklet';
  return 1 - (1 - x) * (1 - x);
}
function easeIn(x: number) {
  'worklet';
  return x * x;
}
function clamp(x: number) {
  'worklet';
  return Math.min(1, Math.max(0, x));
}

/** Stable 0..<1 random per slot, so a blink at second 12 is always the same blink. */
function rand(slot: number, salt: number) {
  'worklet';
  let x = Math.imul(slot | 0, 73856093) ^ Math.imul(salt | 0, 19349663);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = x ^ (x >>> 16);
  return ((x >>> 0) % 10000) / 10000;
}

function blinkCurve(t: number, start: number) {
  'worklet';
  const dt = t - start;
  if (dt < 0) return 0;
  if (dt < TT.blinkClose) return dt / TT.blinkClose;
  if (dt < TT.blinkClose + TT.blinkHold) return 1;
  const o = dt - TT.blinkClose - TT.blinkHold;
  return o < TT.blinkOpen ? 1 - o / TT.blinkOpen : 0;
}

function blink(t: number, seed: number) {
  'worklet';
  const slot = Math.floor(t / TT.blinkSlot);
  let v = 0;
  for (const s of [slot - 1, slot]) {
    const start = s * TT.blinkSlot + 0.6 + rand(s, seed) * (TT.blinkSlot - 1.4);
    v = Math.max(v, blinkCurve(t, start));
    if (rand(s, seed + 1) < TT.doubleBlinkChance) v = Math.max(v, blinkCurve(t, start + TT.doubleBlinkGap));
  }
  return v;
}

/** -1...1: how far he is looking to the side right now. */
function glance(t: number, seed: number) {
  'worklet';
  const slot = Math.floor(t / TT.glanceSlot);
  if (rand(slot, seed + 2) >= TT.glanceChance) return 0;
  const start = slot * TT.glanceSlot + 1 + rand(slot, seed + 3) * 3;
  const dir = rand(slot, seed + 4) < 0.5 ? -1 : 1;
  const dt = t - start;
  const total = TT.glanceEase * 2 + TT.glanceHold;
  if (dt <= 0 || dt >= total) return 0;
  if (dt < TT.glanceEase) return dir * easeInOut(dt / TT.glanceEase);
  if (dt > TT.glanceEase + TT.glanceHold) return dir * (1 - easeInOut((dt - TT.glanceEase - TT.glanceHold) / TT.glanceEase));
  return dir;
}

/** Squash and lift for the tap reaction, `dt` seconds after the tap. */
function boop(dt: number): { squash: number; lift: number } {
  'worklet';
  const a = TT.crouch;
  const r = TT.rise;
  const f = TT.fall;
  if (dt < a) return { squash: 1 - (1 - TT.crouchSquash) * easeOut(dt / a), lift: 0 };
  if (dt < a + r) {
    const x = (dt - a) / r;
    const squash = x < 0.35
      ? TT.crouchSquash + (TT.stretchPeak - TT.crouchSquash) * easeOut(x / 0.35)
      : TT.stretchPeak - (TT.stretchPeak - 1) * easeInOut((x - 0.35) / 0.65);
    return { squash, lift: TT.hopHeight * easeOut(x) };
  }
  if (dt < a + r + f) {
    const x = (dt - a - r) / f;
    return { squash: 1 + (TT.fallStretch - 1) * x, lift: TT.hopHeight * (1 - easeIn(x)) };
  }
  const s = dt - a - r - f;
  if (s >= TT.settle) return { squash: 1, lift: 0 };
  const wobble = Math.exp(-s / TT.wobbleDecay) * Math.cos((2 * Math.PI * s) / TT.wobblePeriod);
  return { squash: 1 - TT.landSquash * wobble, lift: 0 };
}

/** The arm `age` seconds into a wave, or null when the wave is over. */
function wave(age: number): ArmPose | null {
  'worklet';
  const grow = TT.waveGrow;
  const swing = TT.wavePeriod * TT.waveCount;
  if (age < 0 || age >= TT.waveTotal) return null;
  if (age < grow) {
    const x = age / grow;
    const back = 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
    return { angle: TT.waveAngle + TT.waveSwing, extension: back, marks: 0 };
  }
  if (age < grow + swing) {
    const phase = (age - grow) / TT.wavePeriod;
    return {
      angle: TT.waveAngle + TT.waveSwing * Math.cos(2 * Math.PI * phase),
      extension: 1,
      marks: 0.35 + 0.65 * Math.abs(Math.sin(2 * Math.PI * phase)),
    };
  }
  const r = (age - grow - swing) / TT.waveRetract;
  return { angle: TT.waveAngle + TT.waveSwing, extension: 1 - easeIn(r), marks: Math.max(0, 1 - 2 * r) };
}

function breathing(eyes: MiloEyes) {
  'worklet';
  if (eyes === 'sleep') return { period: TT.sleepBreathePeriod, depth: TT.sleepBreatheDepth };
  if (eyes === 'sad') return { period: TT.sadBreathePeriod, depth: TT.sadBreatheDepth };
  return { period: TT.breathePeriod, depth: TT.breatheDepth };
}

/**
 * The full pose at time `t` (seconds). `boopAge` = seconds since the last tap hop (or -1),
 * `waveAge` = seconds since the wave began (or -1).
 */
export function livePose(base: MiloPose, t: number, alive: boolean, boopAge: number, seed: number, waveAge: number): MiloPose {
  'worklet';
  const p: MiloPose = { ...base };
  if (waveAge >= 0) {
    const arm = wave(waveAge);
    if (arm) {
      p.arm = arm;
      // Eyes ease into happy as the arm comes out, and back as it goes in.
      const g = TT.waveGrow;
      const end = TT.waveTotal;
      const ramp = waveAge < g ? waveAge / g : waveAge > end - TT.waveRetract ? (end - waveAge) / TT.waveRetract : 1;
      p.happiness = Math.max(p.happiness, easeInOut(clamp(ramp)));
    }
  }
  const hopping = boopAge >= 0 && boopAge < TT.boopTotal;
  if (!alive && !hopping) return p;

  const breath = breathing(base.eyes);
  let squash = alive ? 1 + breath.depth * Math.sin((2 * Math.PI * (t + seed * 0.37)) / breath.period) : 1;
  let lift = 0;

  if (hopping) {
    const b = boop(boopAge);
    squash *= b.squash;
    lift = b.lift;
    // Default eyes ease into happy for the hop and back just after he lands.
    const start = TT.crouch;
    const end = TT.landAt + TT.happyAfterLanding;
    const ramp = Math.min((boopAge - start) / TT.eyeMorph, (end + TT.eyeMorph - boopAge) / TT.eyeMorph);
    p.happiness = Math.max(p.happiness, easeInOut(clamp(ramp)));
  } else if (alive && base.eyes !== 'sleep') {
    const g = glance(t, seed);
    p.lookX = g * TT.glanceDistance;
    p.lookY = -Math.abs(g) * 0.6;
    p.lean = g * TT.glanceLean;
  }

  if (alive && p.eyes === 'oval' && p.happiness < 0.5) p.blink = Math.max(base.blink, blink(t, seed));
  // The base pose can carry its own squash or stretch (for example while falling).
  p.squash = base.squash * squash;
  p.lift = lift;
  return p;
}
