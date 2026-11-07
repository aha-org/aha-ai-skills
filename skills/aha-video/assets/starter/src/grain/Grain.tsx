import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { GFPS, step } from "../motion";
import "./aha-grain.js"; // the same grain.js as the web skills; it sets window.Grain

declare global {
  interface Window {
    Grain: {
      make: (cv: HTMLCanvasElement, shape: string, size: number, opts?: { spin?: boolean | number; lines?: boolean; lite?: boolean }) => (f: number, t: number) => void;
      field: (w: number, h: number, family: string, opts?: { cell?: number; from?: number; arcs?: number[] }) => HTMLCanvasElement;
      FAMILIES: string[];
    };
  }
}

/**
 * One Aha grain shape (two tones of one family, blended by dots, lit top left, hand-drawn lines inside).
 * shape: "cookie" (the sun, turns with fixed light), "pentagon", "diamond", "leaf", "disc", "screen", "slide", "browser", "phone".
 * It boils and turns on the stepped graphics clock (10 fps). `soft` = a blurred copy with no lines, for depth.
 */
export const GrainShape: React.FC<{ shape: string; size: number; spin?: boolean | number; soft?: boolean; style?: React.CSSProperties }> = ({ shape, size, spin = false, soft = false, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useRef<((f: number, t: number) => void) | null>(null);
  useLayoutEffect(() => {
    if (!draw.current && ref.current) draw.current = window.Grain.make(ref.current, shape, size, { spin, lines: !soft });
    const s = step(frame, fps);
    draw.current?.(Math.round((s * GFPS) / fps), s / fps);
  }, [frame, fps, shape, size, spin, soft]);
  return <canvas ref={ref} style={style} />;
};

/** A full-frame grain field with arcs from the bottom-right corner, for a statement or end card. Half resolution, shown at 2x. */
export const GrainField: React.FC<{ family: "blush" | "sky" | "sun" | "lime" | "forest"; width: number; height: number }> = ({ family, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const frames = useRef<HTMLCanvasElement[] | null>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const w = Math.ceil(width / 2), h = Math.ceil(height / 2), R = Math.max(w, h);
    if (!frames.current) {
      const arcs = [0.22, 0.38, 0.56, 0.76, 0.98].map((k) => Math.round(R * k));
      frames.current = [0, 1, 2].map(() => window.Grain.field(w, h, family, { cell: 1, arcs }));
      cv.width = w;
      cv.height = h;
    }
    const k = Math.round((step(frame, fps) * GFPS) / fps) % 3;
    cv.getContext("2d")!.drawImage(frames.current[k], 0, 0);
  }, [frame, fps, family, width, height]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width, height, imageRendering: "pixelated" }} />;
};
