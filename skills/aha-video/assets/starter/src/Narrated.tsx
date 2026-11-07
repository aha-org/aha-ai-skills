import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import timeline from "../public/timeline.json";
import { loadFonts } from "./fonts";
import { BRAND, CREAM, INK, SANS, SERIF } from "./theme";
import { reveal, typed, Words } from "./Words";

loadFonts();

// A narrated reel (1080 x 1920): footage cut on the music's beats, a voice line on a beat, captions word by word,
// the music dipping under every line, an end card. Everything comes from public/timeline.json (tools/plan.py).
// Edit the end card lines here.
const END_LINES = ["One line to end on,", "and one to act on."];

const FPS = 30;
const f = (t: number) => Math.round(t * FPS);
type Shot = { file: string; in: number; start: number; end: number; zoom: number[] };
type Vo = { id: string; start: number; dur: number };
type Cap = { text: string; start: number; end: number; line: string };
const T = timeline as unknown as { duration: number; endCard: number; vo: Vo[]; shots: Shot[]; groups: Cap[][] };
export const NARRATED_FRAMES = Math.max(f(T.duration), 1);
const SHADOW = "0 3px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)";
const isStill = (file: string) => /\.(jpe?g|png|webp|heic)$/i.test(file);

const ShotView: React.FC<{ s: Shot }> = ({ s }) => {
  const frame = useCurrentFrame();
  const len = f(s.end) - f(s.start);
  const z = interpolate(frame, [0, len], s.zoom, { extrapolateRight: "clamp" });
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
  return (
    <AbsoluteFill style={{ transform: `scale(${z})` }}>
      {isStill(s.file) ? <Img src={staticFile(s.file)} style={style} /> : <OffthreadVideo src={staticFile(s.file)} muted trimBefore={f(s.in)} style={style} />}
    </AbsoluteFill>
  );
};

/** A short phrase at a time, the newest word on brand green. Only while someone is speaking. */
const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const g = T.groups.find((g, i) => {
    const next = T.groups[i + 1];
    const hold = g[g.length - 1].end + 0.5;
    return t >= g[0].start - 0.05 && t < (next ? Math.min(next[0].start, hold) : hold);
  });
  if (!g) return null;
  const newest = g.filter((w) => t >= w.start).length - 1;
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 1290, width: 940, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 84, lineHeight: 1.08, textTransform: "uppercase", textShadow: SHADOW }}>
        <Words words={g.map((w, i) => ({ text: w.text, start: w.start, color: CREAM, bg: i === newest ? BRAND : undefined }))} gap="0.26em" />
      </div>
    </AbsoluteFill>
  );
};

/** The music drops way down under every voice line (short pauses between lines stay down), easing in and out. */
const musicVolume = (frame: number) => {
  const t = frame / FPS;
  const LOW = 0.12, HIGH = 0.55, RAMP = 0.3, BRIDGE = 1.2;
  let duck = 0;
  T.vo.forEach((v, i) => {
    const next = T.vo[i + 1];
    const a = v.start - 0.15;
    const b = next && next.start - (v.start + v.dur) < BRIDGE ? next.start : v.start + v.dur + 0.15;
    const k = Math.min(interpolate(t, [a - RAMP, a], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), interpolate(t, [b, b + RAMP], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    duck = Math.max(duck, k);
  });
  const fadeOut = interpolate(t, [T.duration - 2.4, T.duration - 0.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (HIGH - (HIGH - LOW) * duck) * fadeOut;
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, alignItems: "center", justifyContent: "center", opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }) }}>
      <div style={{ fontFamily: SERIF, fontSize: 104, color: INK, textAlign: "center", lineHeight: 1.04, letterSpacing: "-0.02em" }}>
        <Words words={typed(END_LINES[0], 0.2, 0.14)} />
        <br />
        <Words words={typed(END_LINES[1], 0.65, 0.14, BRAND)} />
      </div>
      <div style={{ marginTop: 120, width: 196, height: 103, backgroundColor: BRAND, WebkitMaskImage: `url(${staticFile("aha-logo-mask.png")})`, WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", ...reveal(frame, f(1.3)) }} />
    </AbsoluteFill>
  );
};

export const Narrated: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {T.shots.map((s, i) => (
      <Sequence key={i} from={f(s.start)} durationInFrames={Math.max(1, f(s.end) - f(s.start))}>
        <ShotView s={s} />
      </Sequence>
    ))}
    <Sequence from={f(T.endCard)}>
      <EndCard />
    </Sequence>
    <Sequence durationInFrames={f(T.endCard)}>
      <Captions />
    </Sequence>
    {T.vo.map((v) => (
      <Sequence key={v.id} from={f(v.start)}>
        <Audio src={staticFile(`vo/${v.id}.wav`)} />
      </Sequence>
    ))}
    {T.vo.length > 0 && <Audio src={staticFile("music.wav")} volume={musicVolume} />}
  </AbsoluteFill>
);
