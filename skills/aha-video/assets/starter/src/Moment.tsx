import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFonts } from "./fonts";
import { GrainShape } from "./grain/Grain";
import { Milo } from "./milo/Milo";
import { focusIn, prog, step } from "./motion";
import { BRAND, CREAM, HAND, INK, SERIF } from "./theme";
import { typed, Words } from "./Words";

loadFonts();

const s = (sec: number, fps: number) => Math.round(sec * fps);

/**
 * A short Aha moment (6 s, 1080 x 1920): the grain entrance, a line that appears word by word, Milo noticing.
 * Use it as the pattern for animated pieces without footage. Every value is a function of the frame.
 */
export const Moment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = step(frame, fps); // the stepped clock for shapes (3-frame holds)

  // 1. The grain entrance: soft copies drift in, the sun focuses in while turning, then holds and turns slowly.
  const copy = prog(g, s(0.2, fps), s(1.4, fps));
  const hero = prog(g, s(0.4, fps), s(1.3, fps));

  // 2. The line, word by word, calm (fade + small rise, words hold their space).
  // 3. Milo arrives, looks up at the sun, one small hop, eyes go happy. His motion is smooth (he's a character).
  const miloIn = prog(frame, s(2.6, fps), s(0.6, fps));
  const hopT = interpolate(frame, [s(3.6, fps), s(4.1, fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift = Math.sin(Math.PI * hopT) * 34;
  const squash = hopT > 0 && hopT < 1 ? 1 + 0.06 * Math.sin(Math.PI * hopT) : 1 - 0.08 * Math.max(0, 1 - Math.abs(frame - s(4.1, fps)) / 4);
  const happy = frame > s(4.1, fps);
  const blink = Math.max(0, 1 - Math.abs(frame - s(3.1, fps)) / 2);
  const note = prog(frame, s(4.4, fps), s(0.5, fps));
  const logo = prog(frame, s(5.0, fps), s(0.5, fps));

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      <div style={{ position: "absolute", left: 660, top: 140, opacity: 0.5 * copy, filter: `blur(${12 + 18 * (1 - copy)}px)`, transform: `translate(${40 * (1 - copy)}px, ${-30 * (1 - copy)}px)` }}>
        <GrainShape shape="cookie" size={260} soft />
      </div>
      <div style={{ position: "absolute", left: 120, top: 640, opacity: 0.4 * copy, filter: `blur(${14 + 18 * (1 - copy)}px)`, transform: `translate(${-40 * (1 - copy)}px, ${34 * (1 - copy)}px)` }}>
        <GrainShape shape="cookie" size={190} soft />
      </div>
      <div style={{ position: "absolute", left: 540 - 210, top: 260, opacity: Math.min(1, hero * 1.6), filter: hero < 1 ? `blur(${22 * (1 - hero)}px)` : "none", transform: `translateY(${24 * (1 - hero)}px) scale(${0.82 + 0.18 * hero}) rotate(${-14 * (1 - hero)}deg)` }}>
        <GrainShape shape="cookie" size={420} spin />
      </div>

      <div style={{ position: "absolute", top: 830, width: "100%", textAlign: "center", fontFamily: SERIF, fontSize: 108, lineHeight: 1.04, letterSpacing: "-0.02em", color: INK }}>
        <Words words={typed("A small moment,", 1.4, 0.16)} />
        <br />
        <Words words={typed("made by hand.", 1.9, 0.16, BRAND)} />
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: miloIn, transform: `translateY(${40 * (1 - miloIn)}px)` }}>
        <Milo x={430} y={1560} size={300} color="green" lift={lift} deform={{ squash }} eyes={happy ? { type: "happy" } : { type: "oval", lookX: 3, lookY: 3, blink }} />
      </div>
      <div style={{ position: "absolute", left: 610, top: 1290, background: "#fff", borderRadius: "28px 28px 28px 4px", padding: "22px 30px", boxShadow: "0 4px 16px rgba(0,0,0,.12)", fontFamily: HAND, fontSize: 48, color: INK, ...focusIn(note, 8, 12) }}>
        oh. it's warm.
      </div>

      <div style={{ position: "absolute", left: 540 - 98, bottom: 110, width: 196, height: 103, backgroundColor: BRAND, WebkitMaskImage: `url(${staticFile("aha-logo-mask.png")})`, WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", ...focusIn(logo, 6, 10) }} />
    </AbsoluteFill>
  );
};

export const MOMENT_FRAMES = 180;
