/**
 * Milo's eye language. Solid black shapes only: no pupils, whites or highlights.
 * Emotion comes from reshaping the black forms.
 * Each eye is drawn around (0, 0) in Milo units (base width 100), SVG y down.
 * Shapes are drawn for the LEFT eye; the right eye is mirrored.
 */
import React from "react";
import { miloInk } from "./palette";

export type EyeType =
  | "oval" // DEFAULT: small upright ovals, quietly attentive (refs 03, 07)
  | "happy" // soft upward arcs (refs 06, 08, 11)
  | "sad" // drooping crescents (refs 01, 10)
  | "sleep" // relaxed closed curves (refs 02, 05)
  | "dash" // flat horizontal dashes, deadpan (ref 09)
  | "heart"; // love (ref 04)

export type EyeState = {
  type: EyeType;
  /** Where he is looking, in units. Moves both eyes together. */
  lookX?: number;
  lookY?: number;
  /** 0 = open, 1 = closed (oval eyes only). */
  blink?: number;
  /** Size multiplier. */
  scale?: number;
};

const STROKE = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

const EyeShape: React.FC<{ type: EyeType; blink: number }> = ({ type, blink }) => {
  switch (type) {
    case "oval":
      return <ellipse cx={0} cy={0} rx={3.3} ry={5.1 * Math.max(0.08, 1 - blink)} fill={miloInk.eye} />;
    case "happy":
      return <path d="M -7.6 3 C -7.4 -5.8, 7.4 -5.8, 7.6 3" stroke={miloInk.eye} strokeWidth={2.5} {...STROKE} />;
    case "sleep":
      return <path d="M -6.6 -0.9 C -3.3 2.9, 3.3 2.9, 6.6 -0.9" stroke={miloInk.eye} strokeWidth={2.2} {...STROKE} />;
    case "dash":
      return <rect x={-5} y={-1.7} width={10} height={3.4} rx={1.7} fill={miloInk.eye} />;
    case "sad":
      // Crescent: thin end raised toward the middle of the face, heavy end drooping outward. Both ends rounded.
      return (
        <path
          transform="scale(1.18)"
          d="M 6.2 -4.2 C 6.6 -0.6, 3.4 4.6, -2.2 4.7 C -5.4 4.8, -7.3 3.4, -6.9 1.4 C -6.5 -0.4, -4.2 -0.4, -2 -0.9 C 0.6 -1.6, 2.4 -2.9, 3.9 -4.9 A 1.25 1.25 0 0 1 6.2 -4.2 Z"
          fill={miloInk.eye}
        />
      );
    case "heart":
      return (
        <path
          transform="scale(1.4)"
          d="M 0 5.2 C -0.5 5.2, -1.2 4.8, -1.8 4.3 C -4.2 2.4, -7.2 0.2, -7.2 -2.8 C -7.2 -5.4, -5.2 -6.8, -3.4 -6.8 C -1.9 -6.8, -0.8 -6, -0.3 -5 Q 0 -4.5, 0.3 -5 C 0.8 -6, 1.9 -6.8, 3.4 -6.8 C 5.2 -6.8, 7.2 -5.4, 7.2 -2.8 C 7.2 0.2, 4.2 2.4, 1.8 4.3 C 1.2 4.8, 0.5 5.2, 0 5.2 Z"
          fill={miloInk.heart}
        />
      );
  }
};

/** Both eyes, centred on (cx, cy) with the given spacing. */
export const Eyes: React.FC<{ eyes: EyeState; cx: number; cy: number; spacing: number }> = ({ eyes, cx, cy, spacing }) => {
  const s = eyes.scale ?? 1;
  const x = cx + (eyes.lookX ?? 0);
  const y = cy + (eyes.lookY ?? 0);
  const blink = eyes.blink ?? 0;
  return (
    <g>
      {eyes.type === "heart" && (
        <g opacity={0.9}>
          <ellipse cx={x - spacing / 2} cy={y + 13.5 * s} rx={6.6} ry={2.6} fill={miloInk.blush} />
          <ellipse cx={x + spacing / 2} cy={y + 13.5 * s} rx={6.6} ry={2.6} fill={miloInk.blush} />
        </g>
      )}
      <g transform={`translate(${x - spacing / 2} ${y}) scale(${s})`}>
        <EyeShape type={eyes.type} blink={blink} />
      </g>
      <g transform={`translate(${x + spacing / 2} ${y}) scale(${-s} ${s})`}>
        <EyeShape type={eyes.type} blink={blink} />
      </g>
    </g>
  );
};
