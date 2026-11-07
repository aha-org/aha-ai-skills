/**
 * Milo renderer. Draws one Milo from: body shape + deformation + colour + eyes + shadow.
 * Positioned by his ground point (bottom centre), so squash and landing stay planted.
 */
import React, { useId } from "react";
import { EyeState, Eyes } from "./eyes";
import { MiloColor, miloInk, miloPalette } from "./palette";
import { bodyPresets, BodyPreset, eyePlacement } from "./presets";
import { bodyHeight, BodyShape, Deform, deformPoint, facePoints, outlinePoints, smoothClosedPath } from "./shape";

export type MiloProps = {
  /** Ground point (bottom centre) in the parent, in px. */
  x: number;
  y: number;
  /** Base width in px. */
  size: number;
  body?: BodyPreset | BodyShape;
  deform?: Deform;
  color?: MiloColor;
  eyes?: EyeState;
  /** Eye placement override (x offset, height from ground, spacing), in units. */
  eyePos?: { x: number; y: number; spacing: number };
  /** Contact shadow: 1 = grounded, 0 = hidden. Lift him to shrink and lighten it. */
  shadow?: number;
  /** Height above the ground in units (for jumps). Shadow stays on the ground. */
  lift?: number;
  /** Review only: draw just the silhouette outline in this colour (for overlaying on references). */
  outlineOnly?: string;
};

export const Milo: React.FC<MiloProps> = ({
  x,
  y,
  size,
  body = "clean",
  deform = {},
  color = "green",
  eyes = { type: "oval" },
  eyePos,
  shadow = 1,
  lift = 0,
  outlineOnly,
}) => {
  const shape = typeof body === "string" ? bodyPresets[body] : body;
  const H = bodyHeight(shape);
  const placement = eyePos ?? (typeof body === "string" ? eyePlacement[body] : { x: -3.5, y: H * 0.6, spacing: 31 });
  const raw = outlinePoints(shape);
  const silhouette = raw.map((p) => deformPoint(p, deform, H));
  const face = facePoints(shape).map((p) => deformPoint(p, deform, H));
  const eyeCenter = deformPoint({ x: placement.x, y: placement.y }, deform, H);
  const sx = 1 / Math.sqrt(deform.squash ?? 1);
  const palette = miloPalette[color];
  const clipId = `milo-clip-${useId().replace(/:/g, "")}`;
  const unit = size / shape.W;
  const pad = 40;
  // Shadow shrinks and fades as he lifts off the ground.
  const airborne = Math.min(1, lift / 40);
  const shadowScale = 1 - 0.35 * airborne;

  return (
    <svg
      width={(shape.W + pad * 2) * unit}
      height={(H + pad * 2) * unit}
      viewBox={`${-shape.W / 2 - pad} ${-H - pad} ${shape.W + pad * 2} ${H + pad * 2}`}
      style={{ position: "absolute", left: x - (shape.W / 2 + pad) * unit, top: y - (H + pad) * unit, overflow: "visible" }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={smoothClosedPath(silhouette)} />
        </clipPath>
        <filter id="milo-shadow-soft" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation={0.7} />
        </filter>
      </defs>
      {outlineOnly && (
        <g transform={`translate(0 ${-lift})`}>
          <path d={smoothClosedPath(silhouette)} fill="none" stroke={outlineOnly} strokeWidth={0.6} />
          <path d={smoothClosedPath(face)} fill="none" stroke={outlineOnly} strokeWidth={0.35} strokeDasharray="1.5 1.2" />
        </g>
      )}
      {!outlineOnly && shadow > 0 && (
        <ellipse
          cx={-0.5}
          cy={1.2}
          rx={(Math.max(shape.left.base, shape.right.base) + 5) * sx * shadowScale}
          ry={2.7 * shadowScale}
          fill={miloInk.shadow}
          opacity={shadow * (1 - 0.5 * airborne)}
          filter="url(#milo-shadow-soft)"
        />
      )}
      <g transform={`translate(0 ${-lift})`} display={outlineOnly ? "none" : undefined}>
        <path d={smoothClosedPath(silhouette)} fill={palette.side} />
        <path d={smoothClosedPath(face)} fill={palette.body} clipPath={`url(#${clipId})`} />
        <Eyes eyes={eyes} cx={eyeCenter.x} cy={-eyeCenter.y} spacing={placement.spacing * sx} />
      </g>
    </svg>
  );
};
