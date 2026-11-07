# The grain engine (8 fps decks)

`assets/template-grain/` is the newer engine, taken from Manan's masterclass deck ("Make it without me", `assets/example-grain/`). Use it for any deck unless the person wants the classic Milo-led style (`assets/template/`, the Save Me a Seat engine). The two can be mixed: copy `milo.js` from the classic template (already in `template-grain/`) and add `<script src="milo.js"></script>` when a grain deck needs Milo.

## Files
```
index.html   head (fonts, boil filters), one <section class="slide"> per slide, chrome (logo, progress, cursor, hint)
styles.css   tokens, stage, view-transition match cuts, builds, boil, chrome, then one block per slide (#s-id)
deck.js      engine (clock, easings, anim, helpers, grain wiring, cursor) → slide hooks → navigation
grain.js     the Aha grain (Grain.make / disc / field / text). Same file as dna/grain/grain.js
sound.js     Sfx: generic sounds are silent on purpose; real clips go in FILES and play with Sfx.voice(name)
tools/       bundle.py (one self-contained HTML), encrypt.mjs (password page)
```

## The clock (why it looks hand-made)
- `FPS = 8`. One `setInterval` drives everything. Each tick: `html[data-b]` cycles 0-1-2 (the line boil), every grain canvas on the active slide redraws its next frame, and every running `anim()` advances one step.
- CSS uses stepped easings so CSS and JS land on the same frames: `var(--oN)` (ease out) and `var(--ioN)` (ease in-out), where N is the duration in twelfths of a second. Pair them: `.667s var(--o8)`, `.5s var(--o6)`, `.833s var(--io10)`. `--f` is one frame (125ms) for delays.
- Change `FPS` to 12 for a smoother hand-made feel. Never above 12 for shapes.

## Writing motion
```js
const ok = guard();                       // cancels if the slide or step changes
await anim(667, (p, raw) => { el.style.opacity = p; }, E.out, ok);   // p is eased, per frame
await hold(300, ok);                      // wait N ms on the clock
await cursorTo(x, y, 750, ok); await click(ok);   // the walking cursor (name it with cursorName('You', true))
```
Every `await` returns `false` if cancelled: write `if (!(await anim(...))) return;`.

**Multi-step slides:** `hooks['s-id'] = stepped_slide(reset, play)`. `reset()` puts the slide back to its start; `play(n, ok)` plays step n and must also work instantly (`FAST` is true while snapping back or skipping), which is how going back a step or jumping in by URL rebuilds any state.

Simple slides use `{ enter(step, dir), step(n, dir), leave() }`.

## Markup hooks
- `data-steps="N"` on a slide: clicks before the next slide. `data-s="n"` on an element: appears on click n (rises in).
- `class="split"` on a heading: words rise one frame after another. `class="rise" style="--d:5"`: rises after 5 frames.
- `data-vt="name"`: the same name on an element in two neighbouring slides = a **match cut** (the View Transitions API morphs it across).
- `data-bg="forest|lime|paper"`: slide background (body colour changes, and a different background wipes in as a circle).
- `data-bookend` hides the logo and progress; `data-nomark` hides only the logo; `data-noprog` only the progress.
- `data-sound`: the only slides where sound plays.
- `class="boil"` on an SVG: the line shimmers on the beat (hand-drawn underline: an SVG path with `pathLength="1"`, animate `strokeDashoffset` 1 → 0).

## Grain on slides
- **A shape:** `<canvas class="gr" data-shape="cookie|pentagon|diamond|leaf|disc|screen|slide|browser|phone" data-size="330" data-spin></canvas>`. Add `class="copy"` for a soft blurred copy (no lines), `data-spin="-32"` for seconds per turn (negative = the other way), `data-wave` for a leaf sway, `data-lite` for big shapes (cheaper). The engine draws and floats it on the clock.
- **A field (full slide or a card):** `fieldOf('blush'|'sky'|'lime'|'sun'|'forest')` returns three pre-painted 800 × 450 frames with arcs; paint one per tick with `GR.push({ slide, tick(f) { ctx.drawImage(fieldOf(fam)[f % 3], ...) } })`. See slides 2 and 3 of the template.
- **A grain word:** `<canvas class="gt" data-text="Needs you" data-fam="sky" data-px="56">`.
- **People without faces:** `avatar(fam)` gives an anonymous grain disc (used for "the team" so nobody is singled out).
- White text on grain cards. One grain family per card; at most four families on a slide.

## Patterns in the example deck (`assets/example-grain/`)
| Slide id | What it shows |
|---|---|
| `s-title`, `s-end` | the grain entrance (copies drift in, the sun focuses in turning, lines focus in), cursor underline |
| `s-brief` | four grain cards, one per click, cursor taps each |
| `s-why` | forest grain field, hand-drawn underline, a dot that match-cuts into the next slide |
| `s-path`, `s-close` | a day as a line: a face walking, people cutting in, a camera that pushes in, chat thread, voice notes with transcripts, a call, stacked notifications, a Milo-style chat |
| `s-sort` | requests sorting into two columns; particles turn one heading into the next |
| `s-made` | four grain frames (screen, slide, browser, phone), newest in focus |
| `s-loop` | each step of a workflow as a full grain screen |
| `s-rules` | a send button growing into a card (container transform), folding into a file (match cut) |
| `s-try` | a composer: a file chip dragged in, the input dips and settles, a grain border spreads from the chip, typing, a reply, a "making it" bar, the result card |
| `s-taste` | black and white, letters cycling fonts then settling, big lite turning shapes at the edges |
| `s-handoff` | a mail with a zip attached, the cursor appears only to press Send |
| `s-do` | a grain staircase; a variable-font word (Roboto Flex axes) with a grain fill that changes family |
| `s-broke` | a loop diagram: you, me, the skill, everyone |

Copy the markup, the `#s-id` CSS block and the `hooks['s-id']` block, then change the content.

## Fit and full screen
The stage is 1600 × 900, scaled to **cover** the window but never trimming more than about a seventh (`Math.min(cover, contain * 1.16)`), so it fills any screen without bars. Keep everything at least 96px from the stage edges. F = full screen.

## Gotchas
- Bump the `?v=N` on the three script tags and the stylesheet after edits, or the browser serves stale files.
- A hidden browser pane pauses CSS transitions and view transitions; screenshots go stale. Check state with JS (`deck.goto(i, step)`, read classes) or bring the pane forward.
- A flat SVG line disappears under the boil filter (zero-height box): put it inside `.lines` so it uses the fixed-region filter `#boilL0-2`.
- Turning shapes get clipped: the canvas is 1.25× the shape with a negative margin; don't put them in `overflow: hidden` parents.
- Measure an element's final position (`at(el)`) after layout settles, not mid-transition. Reparent a dragged chip into its slot, then animate the slot.
- Glyphs with descenders in a background-clip grain word need padding plus an equal negative margin.
