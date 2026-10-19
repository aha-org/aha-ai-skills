# Slide patterns: what to turn each kind of slide into

Pick the pattern from what the slide *does in the room* (a game, a reflection, a story beat, a list), not from how it looked as a static slide. Every pattern below exists as working code; copy the markup (`index.html`), styles (`styles.css`, search the slide id) and hook (`deck.js`, search `hooks['<id>']`) from the example named, then adapt.

- `assets/example/` = **Save Me a Seat** (belonging workshop; newest, closest to the current rules)
- `assets/example-btm/` = **Being There Matters** (psychological first aid talk; older, some styles were superseded, its sound files are not included)

## Contents
1. Openers and closers
2. Lists, steps and features
3. Games and activities
4. Reflection and discussion
5. Story beats and contrasts
6. Calls to action and contact

## 1. Openers and closers

| Source slide | Pattern | Where |
|---|---|---|
| Title with an illustration | Keep the deck's own art as a scene; place live Milo in it; one click plays a tiny story (someone takes the saved seat). Left half = flat/swirl panel with the title. | example `s-title` (bench scene, `.ill-bench`, `SEAT`/`FLOOR` coords) |
| Closing quote | Same scene as the title (bookend), the story resolves (they make room for one more), last click shows a feedback QR card. | example `s-close` |
| Title over a photo/illustration with characters | Cut the art into layers; add live eyes/characters on top. | btm `s-title` (bushes with peeking eyes) |

When the source art has a character drawn in, paint it out (see engine.md, "Cleaning illustrations") and use live Milo instead.

## 2. Lists, steps and features

| Source | Pattern | Where |
|---|---|---|
| "Who we are" / 3 features | Heading + lede; three tonal cards with sticker icons on top, one per click; Milo peeks over the first card with a speech note when he's introduced; closing line on the last click. | example `s-hi` |
| Numbered steps (4–6) | **3D barrel**: one card faces front (primary green), neighbours curve away blurred; Milo stands on the front card; the last click flattens all into a row. | example `s-five`, btm `s-steps` |
| Grid of shared statements (6–8) | Cards fill two per click; a row of mixed-colour Milos hops in sync each time; on the last, all turn happy and huddle. | example `s-share` |
| Hidden rules / categories (4) | Flip cards: back shows a big sticker + label, each click flips one to reveal the rule; final line + a lone sad Milo. | example `s-nocards` |
| Simple activity brief (3 parts) + timeline | Cards one per click, then a timeline, then a real timer on the last click (see games). | example `s-fest` |

## 3. Games and activities

| Source | Pattern | Where |
|---|---|---|
| "Never have I ever" / show of hands | One statement card at a time (number "01 OF 08"); a crowd of Milos below; a random part of the crowd "answers" (sticker cup sip, or stands tall with happy eyes). | example `s-never` |
| Find your match / mingling rounds | Ten Milos in an arena; each click is a round, they regroup into labelled groups; someone with no match goes to stand with "us" (the logo). | example `s-match` |
| Teams / tables | Milos gather around M3-shape tables; a "plot twist" click hops 1–2 from each table to another. | example `s-challenge`, `s-twist` |
| Timed activity with milestones | Real countdown (press → to start), wavy timeline with a walking Milo, chimes at milestones, and the time keeps running in a chip at the bottom centre on the next slides. | example `s-fest` (`fest` object, `#festclock`) |
| Short timed task | Shape timer (cookie outline stroke) around Milo; press → to start; chime + happy hop at zero. | example `s-rule`, `s-mean` |
| Myth or fact / quiz | Statement card, two big connected buttons, answer stamps in, Milo reacts; keyboard and click both work. | btm `s-myth` |
| Vote: helps / doesn't help | Card in the middle, room votes, presenter clicks a side; card flies to that column; summary at the end. | btm `s-vote` |
| "What's your move?" options | M3 segmented list of options + a phone/chat mock reacting to the pick. | btm `s-default` |

## 4. Reflection and discussion

| Source | Pattern | Where |
|---|---|---|
| Discussion questions after an activity | Camera-flash "freeze frame"; three white question cards one per click, each with a frozen Milo pose peeking over (clouds allowed here since the cards are colourless). | example `s-freeze` |
| "Pick one prompt and think" | Three prompt cards (clickable to spotlight one), handwritten reassurance, 30-second shape timer. | example `s-mean` |
| Private reflection ("just for you") | Lock sticker on the lede; tappable tiles that toggle (nothing is recorded); a green card with numbered blank lines. | example `s-leftout` |
| Sticky-note exercise | Two big sticky notes (Schoolbell, blanks); one click fills a calm 6×6 wall of notes, soft ticks, chime. | example `s-wall` |
| Grounding / breathing exercise | Steps with a breathing M3 shape and per-step countdown tokens. | btm `s-ground` |

## 5. Story beats and contrasts

| Source | Pattern | Where |
|---|---|---|
| "Full of people… and still alone" | Wandering crowd of small Milos + crowd sound; one click: crowd dims, sound muffles, a white M3 spotlight centres on one blue sad Milo. | example `s-full` |
| X vs Y (fitting in vs belonging) | Two panels; in one Milo changes colour/eyes to match the group, in the other he stays green and is welcomed. | example `s-fit` |
| Before → after quote | White card vs primary card; Milo hops across when "after" appears; the question that follows on its own click. | example `s-changed` |
| Approaching someone / conversation starters | Centred scene: two Milos apart, one invite bubble at a time floats between them; each brings the other closer, happy at the end. | example `s-alone` |
| A person's story over weeks | Tinted week blocks filling in, quote reveal. | btm `s-arjun` |
| "You are the bridge" | Characters walk a path to a door/portal; a weight drops vs lifts. | btm `s-bridge` |
| Big statement / section break | Forest or green slide, display serif, Milo with a prop (magnifier lens that follows the pointer, Milo's eyes track it). | example `s-words` |

## 6. Calls to action and contact

| Source | Pattern | Where |
|---|---|---|
| "In the next 48 hours…" | Display serif with rolling digits (`data-digits`), action tiles with stickers (one highlighted in orange), heart-eyed pink Milo. | example `s-48` |
| Contact + QR | Tinted panel: logo, two lines, the real QR in a white card with "scan me", Milo looking at it. Always re-export and **decode** the QR (scripts/decode_qr.swift) so it still scans. | example `s-connect` |
| Feedback form QR | Last click of the closing slide: the scene slides left, a white card with eyebrow, short question, QR. | example `s-close` |
