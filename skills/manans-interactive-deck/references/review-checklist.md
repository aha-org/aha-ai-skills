# Review checklist (run on every slide, at its final step, before showing anyone)

Each line is something a reviewer actually called out on a previous deck.

## Layout
- [ ] Nothing overlaps: text, Milo, cards, the logo (bottom-right), the progress line (bottom), timer chips.
- [ ] **Milo is not on top of any text.** Not the heading, not the subtitle.
- [ ] Things inside a shape or ring are centred on it (optically: centre on Milo's body, not his SVG box).
- [ ] Breathing space: one hero element, real gaps between groups; nothing squeezed to fit. Split across clicks instead.
- [ ] Centred scenes for stories; avoid lopsided half-split layouts with a big empty side.
- [ ] Only one wavy line visible (hide the deck progress when the slide has its own timeline).

## Type
- [ ] Nothing below 26px on the 1600 × 900 stage. Headings 76px+.
- [ ] Orange text on white uses `#A84C0C` (contrast), not the light orange.
- [ ] Every heading from the source deck is kept; supporting text is short.

## Colour and backgrounds
- [ ] Light slides are white. Clouds only behind colourless components.
- [ ] At most two tints in view; no rainbow of card colours over a coloured background.
- [ ] No gradients.

## Components and icons
- [ ] No pills around labels or icons.
- [ ] Icons are sticker icons, sitting on top of cards, not tiny bullets beside lines.
- [ ] No tilted cards, no shaking/vibrating, no meaningless props (random trees).
- [ ] Shapes that frame things (spotlights, timers) look intentional: M3 cookie/flower etc., timers as a stroke outline.
- [ ] Drawn shapes are recognisable (a "chair" made of notes that looks like a horse is worse than a tidy grid).

## Progressive disclosure
- [ ] One idea per click. Lists, features, steps and invites appear one at a time.
- [ ] Milo appears when he is introduced, not before.
- [ ] Timers start on a click ("press → to start"), not on their own.

## Sound
- [ ] Milo hops are silent.
- [ ] No rapid-fire ticks; repeated events get a soft sound at most every few items.
- [ ] Ambient sound fades in, changes with the story, and fades out within ~1s when the slide changes; S mutes it immediately.
- [ ] No copyrighted sound files in a public deck.

## Assets
- [ ] Illustrations from the source deck look whole (no seams or broken outlines where something was painted out).
- [ ] Every QR code decodes to the right URL after export.
- [ ] Semi-transparent art was composited onto its background colour (no darkened textures).

## Build
- [ ] No console errors; bundle builds with no "unbundled assets" error; the deployed URL shows the new content.
