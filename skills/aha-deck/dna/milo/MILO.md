# Milo

Milo is Aha's character. He is "he". Three live versions already draw him exactly; **never redraw him, trace him from art, or "simplify" him.** Use the code here.

Deeper sources in this folder: `milo-bible.txt` (the full character bible), `milo-handoff.md` (the brief it came with), `references/Milo_Reference_01..11.jpg` (the original art). Read them only when Milo must do something the code doesn't already do (an arm, a prop, a new pose). Rule from the bible: **Milo consistency beats animation complexity.**

## Look (locked)
- An organic blob with a shallow, imperfect "M" double hump on top. Flat, matte 2D. No gloss, no outline, **no grain or texture on Milo**.
- **No sharp corners anywhere:** body, band ends, eyes, hearts, arms. Only smooth curves.
- Eyes are solid dark shapes (`#262525`): no pupils, no whites, no highlights. Default eye = small upright ovals.
- The darker band down his right side and along the bottom ("the iconic shadow stroke") follows the body's curve smoothly and is the same thickness on every body shape. Band colour = body darkened about 14%.
- A small soft contact shadow when he's on the ground.
- No arms, legs or mouth by default. An arm, when needed, grows out of the body and ends in a soft rounded V (not a round C).
- No real brands on anything he holds or wears. Invent props.
- A little glow is allowed in rare moments (an onboarding welcome).

## Colour = meaning
| Mood | Body | Means |
|---|---|---|
| green | `#9AB327` | himself, natural, default |
| blue | `#7BA6DE` | sad, struggling, alone |
| pink | `#F4668E` | love, care (heart eyes are always pink Milo) |
| yellow | `#F1C93F` | confused |
| orange | `#F59A3D` | alert, panicking |
| red | `#E8584B` | angry |

Never recolour him for decoration. Colour tells the story.

## Eyes
`oval` (default), `happy` (arcs), `sleep` (closed lines), `sad` (drooping crescents), `heart`. Eye changes **morph, never jump** (oval widens to a line, the line bends into an arc).

## Voice
Curious, self-aware, a little awkward, observant, quietly playful. He talks like a person, not an assistant: short lowercase notes, fragments, dry observations. He doesn't cheerlead, lecture or fix; he notices, wonders, teases gently, or just sits with someone.
- Test: with his name removed, the line should still sound like only Milo would say it.
- In chat he never reacts (no heart) to someone sharing something hard. Reactions only for light or good moments.
- Handwritten things he "says" use Schoolbell.

## Motion
- He notices and pauses rather than performs. One hop for a moment that matters, not constant bouncing.
- His hops and squash can overshoot softly (the one place springs are allowed). No shaking or vibrating.
- Eyes can follow the pointer or a target, which makes him feel present.
- Hops are silent; chirps are subtle.
- He appears when he's introduced, never before, and **never on top of text**.
- Sizes on a 1600 × 900 stage: 46 to 64 in crowds, 90 to 130 standing on cards, 180 to 300 as a hero.

## The three live versions

### Web: `web/milo.js`
Plain script, no build step. `<script src="milo.js"></script>` then:
```js
const m = new Milo(hostEl, { size: 160, mood: 'green', eyes: 'oval', body: 'clean', follow: true,
  backdrop: { shape: 'cookie9', color: '#DBE7C8', size: 165 } });
m.setMood('pink'); m.beHappy(); m.hop(1); m.morphTo('flat'); m.morphBackdrop('flower');
m.lookAt = { x: 1, y: 0 };   // or null to follow the pointer
```
Also: `touch: true` (hover = happy eyes, press = squash, release = hop; `onTap(m)` callback), `m.wave()` (the approved waving arm, eyes go happy), `m.addProp(svgMarkup, 'front'|'behind'|'hand'|'free')` for invented props, and he pauses himself when scrolled off screen.

Bodies: `clean`, `tall`, `flat`. Moods: the six above. `window.MiloKit` gives `tween`, `wait`, `E` (easings), `MOODS`, `shapePoints(name)` (M3 shapes: `cookie4/6/9/12`, `sunny`, `clover4`, `flower`, and more). The deck engines wrap this as `mk(name, opts)` and `spawn(host, {x, y, size, mood})`.

### React Native (Expo, Skia + Reanimated): `react-native/`
`Milo.tsx` is the component used in the Aha app: `<Milo base={pose} size={120} alive seed={3} hopTrigger={n} />`, with `drive` for shared values (`happiness`, `lookX/lookY`, `squash`, `blink`...). `geometry.ts`, `ahaBody.ts`, `draw.ts` hold his exact outline and band; `life.ts` his idle life (blinks, glances); `personas.ts` and `MonthPersona.tsx` the mood personas. Needs `@shopify/react-native-skia` and `react-native-reanimated`.

### Remotion (video): `remotion/`
Self-contained (only React). It renders its own absolutely positioned `<svg>`, so put it straight inside a positioned `<div>`/`AbsoluteFill`, never inside another `<svg>`. `<Milo x={540} y={1300} size={420} body="clean" color="green" eyes={{ type: "oval", lookX: 2, blink: 0 }} deform={{ squash: 0.9, lean: 3 }} lift={0} shadow={1} />`. Placed by his ground point (bottom centre). Bodies: `clean`, `core`, `flat`. Eyes: `oval`, `happy`, `sad`, `sleep`, `dash`, `heart`. Animate any prop from `useCurrentFrame()`: a hop = `lift` up and down with a little `squash` on take-off and landing; a blink = `blink` 0 → 1 → 0 over 4 frames. Everything is a pure function of the frame, so any moment can be rendered and checked.

## Where Milo goes (and doesn't)
- Never on top of text. Never covered by grain. Never in the masterclass-style "team" decks unless asked.
- One Milo per moment, at a generous size. A crowd of mixed colours means "people".
- Optically centre him on any backdrop or ring (centre on his body, not his SVG box).
