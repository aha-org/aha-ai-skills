# Design system: Aha × Material 3 Expressive, for the projector

The look is Aha's brand (colours, fonts, Milo) dressed in Material 3 Expressive components, shapes and motion, sized for a room where people sit far from the screen. All tokens live at the top of `styles.css` (`:root`). To use another brand, change the tokens there; nothing else hardcodes colour except Milo's moods (`milo.js`, `MOODS`).

## Contents
1. Stage and type
2. Colour
3. Backgrounds
4. Components
5. Icons
6. Milo
7. Motion
8. Sound
9. Spacing and layout

## 1. Stage and type

- The stage is a fixed **1600 × 900** box scaled to the window. Design in stage pixels.
- **Nothing under 26px.** Body/support text 28–36px, card titles 34–44px, slide headings (`h2`) 76–96px, display titles (`.display`) 120–170px.
- Fonts: **Hedvig Letters Serif** for headings, quotes and big numbers; **Satoshi** for UI text, labels and body; **Schoolbell** (`.hand`) only for things Milo or a person "says" (speech notes, sticky notes, "scan me").
- Headings use `class="split"` so words rise in one by one, and `text-wrap: balance`.
- Eyebrows/labels: Satoshi 800, 26px, uppercase, letter-spacing .1em. On white, orange text must be the deep shade `#A84C0C` (passes 4.5:1); `#F28C38` is too light for text on light backgrounds.
- 90% visual, 8% text, 2% paragraphs. Keep every heading from the source deck, cut supporting text to one line where you can, and turn lists into things that appear one per click.

## 2. Colour

| Role | Token / value | Use |
|---|---|---|
| Brand green | `--brand #749C49`, `--m3-primary #44681B`, `--green-deep #4F6A1B` | primary actions, "active" card, deep text accents |
| Milo green | `--milo #9AB327` | Milo, small highlights |
| Accent | `--accent #F28C38`, `--accent-deep #DE7020`, text-safe `#A84C0C` | numbers, eyebrows, timer strokes, one highlighted item |
| Tints | `--green-tint #EEF3DC`, `--butter-tint`, `--accent-tint`, `--blue-tint` | card fills |
| Ink | `--ink #202020`, `--ink2 #62605F`, `--ink3 #898786` | text |
| Dark slide | forest `#4A6A3B` (`data-bg="forest"`) | statement and "do this now" slides, cream text |
| Light green slide | `#EAF1CF` (`data-bg="green"`) | bookends, emotional moments |
| Peach slide | `#FAD3B4` (`data-bg="peach"`) | a surprise or twist |

Rules:
- **No gradients anywhere.** Flat colour only.
- Soothing beats lively: one or two tints per slide. If the cards already carry colour, the background is plain white. A slide where every card is a different colour on top of a coloured background reads as noise.
- Brand green stays primary; orange is the accent, never the main surface.

## 3. Backgrounds

- Light slides are **pure white** (`#FFFFFF`).
- The cloud art (`class="clouds"`) goes only behind colourless, minimal components (e.g. white outlined cards). Never behind coloured cards.
- Use the source deck's own illustrations (trees, benches, swirl panels) when they carry meaning. Don't add decorative props that mean nothing (a random tree next to a list).
- Slide background changes play as a circular wipe from the bottom centre.

## 4. Components (Material 3 Expressive, Aha colours)

- **Cards / tiles**: tonal fill (`--green-tint` etc.), radius `--r-xl` (28px) or `--r-xxl` (48px) for hero cards, padding ~30–36px, no borders on tonal cards. White cards get a 2px `--m3-outline-variant` border.
- **Active state**: the current card turns `--m3-primary` with white text (barrels, step lists).
- **M3 shapes** (`data-shape="cookie9|cookie12|sunny|flower|clover4|squircle"`, or `MiloKit.shapePoints`): for spotlights, tables, timer outlines. Shapes must be optically centred on what they frame (centre on the *body*, not the SVG box).
- **Timers**: the cookie12 outline drawn as a stroke that runs down (`.shape-timer`), never a plain circle. The number sits below or inside it.
- **Speech notes**: white surface, `--r-xl`, one sharp corner (`border-bottom-left-radius: var(--r-xs)`) pointing at the speaker, Schoolbell 36–46px, soft shadow.
- **No pills.** Do not wrap labels or icons in pill-shaped chips; users read them as clutter. Use tiles, plain text with a sticker icon, or M3 cards instead.
- **No tilted elements** (no rotated cards or sticky notes), no shaking or vibrating.

## 5. Icons

Sticker icons only: Phosphor **fill in white + bold in ink**, stacked, with a white outline and soft drop shadow (`<span class="stk-me"><i class="ph-bold ph-NAME"></i></span>`, or `sticker('NAME')` in JS). Put icons at the **top of a card**, not as small bullets beside text lines.

## 6. Milo

- Full character rules (look, colour meanings, eyes, voice, motion): `references/milo.md`.
- Milo is Aha's companion: curious, quietly playful, "he". A live SVG character (`milo.js`), never a static drawing, unless the source art draws him into a scene (then paint the drawn Milo out and place the live one).
- Bodies: `clean`, `tall`, `flat`. Moods (colour): `green, blue, pink, yellow, orange, red`. Eyes: `oval, happy, sleep, sad, heart`. Actions: `hop(n, height)`, `beHappy(ms)`, `setMood`, `setEyes`, `morphTo(body)`, `lookAt = {x, y}` (x ±3.4, y ±2.6), `follow` (watch the pointer), `lean`, `squash`, `lift`.
- Story roles: blue + sad = someone struggling or alone; pink + heart eyes = care/love; a crowd of mixed colours = people/the room.
- **Milo never overlaps text.** Leave a clear gap above cards he stands on; check headings and subtitles.
- Milo appears **when he is introduced**, not before.
- One hop per moment, not constant bouncing.

## 7. Motion

- M3 Expressive springs are CSS `linear()` easings in the tokens: `--m3-spatial-fast/default/slow` (movement), `--m3-effects-*` (opacity/colour).
- Slides enter rising from the bottom centre; builds (`data-s`) rise with a short blur.
- Progressive disclosure: **one idea per click.** Lists, features, steps and rules reveal one at a time.
- Allowed flourishes: word-by-word headings, barrels that flatten, flip cards, crowds regrouping, shape morphs, digits rolling, confetti for a genuine win (sparingly).
- Not allowed: falling leaves, vibrating, spinning for no reason, anything that runs forever in the eye line.

## 8. Sound

`sound.js` (`Sfx`) synthesises everything in the browser; S mutes.
- Step clicks are soft water-drop "bloops"; slide changes are a light card swipe.
- Milo hops are **silent**. Keep his `hello`/`happy` chirps subtle.
- Timers end with a soft three-note chime. Notes landing on a wall get a very soft tick on every fourth one, never a rapid-fire click.
- Ambient sound (e.g. a crowd) must fade in, change with the story (muffle to ~10% volume when the point lands), and fade out within a second when the slide changes.
- Never use copyrighted sound files (e.g. iPhone sounds) in a public deck. Synthesised sound or audio made on the machine (e.g. the `say`-voice crowd in `scripts/`) is fine.

## 9. Spacing and layout

- Margins: 96px left/right, 72px top. The bottom ~70px belongs to the progress line and the logo (bottom-right); keep content above y ≈ 800 and clear of x > 1420 near the bottom.
- Give each slide breathing space: one hero element, generous gaps (28–56px between groups). If a slide feels full, split the content across clicks rather than shrinking it.
- Prefer centred scenes over half-split layouts for stories (two Milos with the speech between them, heading centred above).
- Only one wavy line on screen: hide the deck progress (`data-noprog`) when a slide has its own timeline.
