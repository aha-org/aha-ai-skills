import { Easing, interpolate } from "remotion";

// Graphics step at 10 fps on a 30 fps timeline: every pose is held for exactly 3 frames (even holds, never 20 on 30).
// Footage and captions stay smooth; shapes, Milo-free illustrations and UI pieces step.
export const GFPS = 10;
export const step = (frame: number, fps: number, gfps = GFPS) => {
  const hold = Math.max(1, Math.round(fps / gfps));
  return Math.floor(frame / hold) * hold;
};

// Eases only (no springs, no overshoot) for anything that isn't Milo.
export const ease = {
  out: Easing.out(Easing.poly(4)),
  inOut: Easing.inOut(Easing.poly(4)),
  soft: Easing.inOut(Easing.quad),
};

/** 0 → 1 between two frames, clamped, eased. */
export const prog = (frame: number, from: number, len: number, e = ease.out) =>
  interpolate(frame, [from, from + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

/** The focus entrance: a blur that clears, a small rise, a fade. */
export const focusIn = (p: number, blur = 10, rise = 14): React.CSSProperties => ({
  opacity: p,
  filter: p < 1 ? `blur(${(blur * (1 - p)).toFixed(2)}px)` : "none",
  transform: `translateY(${(rise * (1 - p)).toFixed(2)}px)`,
});
