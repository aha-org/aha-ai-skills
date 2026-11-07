import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import edit from "../public/edit.json";
import { loadFonts } from "./fonts";
import { BRAND, CREAM, INK, INK2, SANS, SERIF } from "./theme";
import { reveal, typed, Words } from "./Words";

loadFonts();

// An interview reel (1080 x 1920): the person's own words, cut tight, captions word by word, an end card.
// tools/cut.py writes public/edit.json (clips + caption words) and public/voice.wav from footage/source.mp4.
// Edit the three lines below for each video.
const HOOK = ["What changed when", "she asked for help"]; // second hook, up top during the first section (or [] for none)
const END_KICKER = "Her story";
const END_LINES = ["Asking for help", "is a strength."];

const FPS = 30;
const f = (t: number) => Math.round(t * FPS);
const END = 3.4; // seconds of end card
const VOICE = f(edit.voiceDuration);
export const TOTAL = VOICE + f(END);
const SHADOW = "0 3px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)";

type Clip = { seg: string; segIndex: number; part: number; in: number; out: number; start: number };
type Word = { text: string; start: number; end: number };
const clips = edit.clips as Clip[];
const groups = edit.groups as Word[][];

// Punch-ins hide the jump cuts: each new section flips between a wide and a close framing,
// a squeezed pause nudges in a little more, and every clip drifts in slowly so the frame never sits dead.
const zoomFor = (c: Clip) => (c.segIndex === 0 ? 1.22 : (c.segIndex % 2 === 0 ? 1.13 : 1.0) + (c.part % 2) * 0.05);

const ClipView: React.FC<{ c: Clip }> = ({ c }) => {
  const frame = useCurrentFrame();
  const len = f(c.out) - f(c.in);
  const drift = interpolate(frame, [0, len], [0, 0.018], { easing: Easing.inOut(Easing.sin) });
  return (
    <AbsoluteFill style={{ transform: `scale(${zoomFor(c) + drift})`, transformOrigin: "50% 36%" }}>
      <OffthreadVideo src={staticFile("source.mp4")} muted trimBefore={f(c.in)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

/** Their words, a short phrase at a time, the newest word on brand green. Only while they're on screen speaking. */
const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const idx = groups.findIndex((g, i) => {
    const next = groups[i + 1];
    const hold = g[g.length - 1].end + 0.6;
    return t >= g[0].start - 0.05 && t < (next ? Math.min(next[0].start, hold) : hold);
  });
  if (idx < 0) return null;
  const g = groups[idx];
  const newest = g.filter((w) => t >= w.start).length - 1;
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 1290, width: 940, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 84, lineHeight: 1.08, textTransform: "uppercase", textShadow: SHADOW }}>
        <Words words={g.map((w, i) => ({ text: w.text, start: w.start, color: CREAM, bg: i === newest ? BRAND : undefined }))} gap="0.26em" />
      </div>
    </AbsoluteFill>
  );
};

const HookTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const hide = clips.find((c) => c.segIndex === 1)?.start ?? 3;
  const out = interpolate(frame, [f(hide) - 6, f(hide)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (!HOOK.length) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", opacity: out }}>
      <div style={{ position: "absolute", top: 200, maxWidth: 980, padding: "30px 36px 24px", background: CREAM, borderRadius: 28, textAlign: "center", fontFamily: SERIF, fontSize: 64, lineHeight: 1.08, color: INK, boxShadow: "0 10px 40px rgba(0,0,0,0.18)", ...reveal(frame, 0) }}>
        <Words words={typed(HOOK[0], 0.15, 0.1)} />
        {HOOK[1] && <><br /><Words words={typed(HOOK[1], 0.6, 0.1, BRAND)} /></>}
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, alignItems: "center", justifyContent: "center", opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }) }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: INK2, marginBottom: 34, ...reveal(frame, 4) }}>{END_KICKER}</div>
      <div style={{ fontFamily: SERIF, fontSize: 112, color: INK, textAlign: "center", lineHeight: 1.04, letterSpacing: "-0.02em" }}>
        <Words words={typed(END_LINES[0], 0.25, 0.14)} />
        <br />
        <Words words={typed(END_LINES[1], 0.7, 0.14, BRAND)} />
      </div>
      <div style={{ marginTop: 120, width: 196, height: 103, backgroundColor: BRAND, WebkitMaskImage: `url(${staticFile("aha-logo-mask.png")})`, WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", ...reveal(frame, f(1.4)) }} />
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {clips.map((c, i) => (
      <Sequence key={i} from={f(c.start)} durationInFrames={f(c.out) - f(c.in)}>
        <ClipView c={c} />
      </Sequence>
    ))}
    <Sequence from={VOICE}>
      <EndCard />
    </Sequence>
    {VOICE > 0 && (
      <>
        <Sequence durationInFrames={VOICE}><Captions /></Sequence>
        <Sequence durationInFrames={VOICE}><HookTitle /></Sequence>
        <Audio src={staticFile("voice.wav")} />
      </>
    )}
  </AbsoluteFill>
);
