import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type TimedWord = { text: string; start: number; color?: string; bg?: string };

/** Calm entrance: a short fade and a small rise, no overshoot. */
export const reveal = (frame: number, startFrame: number): React.CSSProperties => {
  const p = interpolate(frame, [startFrame, startFrame + 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return { opacity: p, transform: `translateY(${(1 - p) * 12}px)` };
};

/**
 * Words that appear one at a time at their `start` (seconds on the reel timeline).
 * Words that haven't appeared yet still hold their space, so lines never reflow.
 * `offset` is where the enclosing <Sequence> starts on the reel timeline.
 */
export const Words: React.FC<{ words: TimedWord[]; offset?: number; color?: string; gap?: string }> = ({ words, offset = 0, color, gap = "0.24em" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            marginRight: i < words.length - 1 ? gap : 0,
            color: w.color ?? color,
            // highlight box: off-white text on brand green (the one coloured caption word)
            ...(w.bg ? { background: w.bg, padding: "0.08em 0.16em 0", marginLeft: "-0.16em", marginRight: `calc(${i < words.length - 1 ? gap : "0em"} - 0.16em)` /* padding cancelled out, so nothing reflows */, borderRadius: 10, textShadow: "none" } : {}),
            ...reveal(frame, Math.round((w.start - offset) * fps)),
          }}
        >
          {w.text}
        </span>
      ))}
    </>
  );
};

/** Evenly spaced word times for text that has no voice timing. */
export const typed = (text: string, start: number, step = 0.11, color?: string): TimedWord[] =>
  text.split(" ").map((t, i) => ({ text: t, start: start + i * step, color }));
