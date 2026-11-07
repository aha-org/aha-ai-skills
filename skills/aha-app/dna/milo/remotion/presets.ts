/**
 * Body presets measured from the reference pixels (base width normalised to 100).
 * Starting shapes, not the only shapes: Milo deforms freely from these.
 */
import type { BodyShape } from "./shape";

export const bodyPresets = {
  /** Ref 08. Baseline proportions, even humps, broad soft side plane at the lower right. */
  clean: {
    W: 100,
    left: { base: 50, shoulder: 38.3, shoulderY: 91, bulge: 1.5, corner: 16, cornerX: 24 },
    right: { base: 50, shoulder: 38.8, shoulderY: 91, bulge: 1.5, corner: 16, cornerX: 24 },
    humpL: { x: -22.5, y: 107 },
    humpR: { x: 23.5, y: 107 },
    dip: { x: 0, y: 94.4 },
    dome: 2,
    belly: 0.6,
    band: { side: 9, top: 2.5, lift: 12, corner: 22, center: 0 },
  },
  /** Ref 01. Taller, left hump higher, broad right shoulder, thin even side band. */
  core: {
    W: 100,
    left: { base: 50, shoulder: 41, shoulderY: 99, bulge: 1.2, corner: 17, cornerX: 26 },
    right: { base: 50, shoulder: 38.5, shoulderY: 100, bulge: 1.2, corner: 12, cornerX: 16 },
    humpL: { x: -26, y: 117 },
    humpR: { x: 23.5, y: 112.5 },
    dip: { x: 0, y: 102.2 },
    dome: 2.2,
    belly: 0.8,
    band: { side: 5.5, top: 4.5, lift: 2.5, corner: 14, center: 0.8 },
  },
  /** Ref 02. Flattened and widened, bottom spreading like a puddle. */
  flat: {
    W: 100,
    left: { base: 50, shoulder: 38.5, shoulderY: 36, bulge: -2.5, corner: 14, cornerX: 17 },
    right: { base: 50, shoulder: 35.5, shoulderY: 34, bulge: -2.5, corner: 14, cornerX: 17 },
    humpL: { x: -22, y: 50.8 },
    humpR: { x: 20, y: 49.3 },
    dip: { x: -2, y: 41.5 },
    dome: 2,
    belly: 0.5,
    band: { side: 4, top: 3.5, lift: 2.5, corner: 15, center: 0.5 },
  },
} satisfies Record<string, BodyShape>;

export type BodyPreset = keyof typeof bodyPresets;

/** Eye centre (x offset from the middle, height from the ground) and spacing, per preset.
 *  Eyes sit slightly left of centre because the face plane is. */
export const eyePlacement: Record<BodyPreset, { x: number; y: number; spacing: number }> = {
  clean: { x: -3.5, y: 64, spacing: 30 },
  core: { x: -5, y: 60.5, spacing: 36.5 },
  flat: { x: -2.5, y: 26, spacing: 34 },
};
