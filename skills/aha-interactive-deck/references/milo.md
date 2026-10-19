# Milo: who he is and how he must look and move

`milo.js` already draws Milo exactly (body curves, the thickness band, eyes, moods, shapes). Never redraw him, trace him from art, or "simplify" him; use `mk()` / `spawn()` and the options below. These rules are the character, decided by Aha's design lead.

## Look (locked)
- An organic blob with a shallow, imperfect "M" double hump on top. Flat, matte 2D. No gloss, no texture on the live Milo, no outline.
- **No sharp corners anywhere**: body, band ends, eyes, hearts, any anatomy. Only smooth curves.
- Eyes are solid dark shapes only (`#262525`): no pupils, whites or highlights. Default open eye = small upright ovals.
- The darker band down his right side and along the bottom ("the iconic shadow stroke") follows the body's curve smoothly and has the same thickness on every body shape.
- A small soft contact shadow when he's on the ground.
- No arms, legs or mouth by default. When an arm is needed it grows out of the body and ends in a soft rounded V, not a round C.
- No real brands on anything Milo holds or wears; invent props.

## Colour = meaning
| Mood | Body | Means |
|---|---|---|
| green | `#9AB327` | himself, natural, default |
| blue | `#7BA6DE` | sad, struggling, alone |
| pink | `#F4668E` | love, care (heart eyes are always pink Milo) |
| yellow | `#F1C93F` | confused |
| orange | `#F59A3D` | alert, panicking |
| red | `#E8584B` | angry |

Don't recolour Milo for decoration; colour tells the story (a blue Milo alone, a pink one with heart eyes for care, a crowd of mixed colours for "people").

## Eyes
`oval` (default), `happy` (arcs), `sleep` (closed lines), `sad` (drooping crescents), `heart`. Eye changes **morph, never jump** (`beHappy()` handles this; `setEyes` is for state changes between beats).

## Personality (for anything he "says")
Curious, self-aware, a little awkward, observant, quietly playful. He talks like a person, not an assistant: short, lowercase handwriting notes, fragments, dry little observations ("psst… there's a seat here for you.", "ta-da! i'm milo, and these are my humans."). He doesn't cheerlead, lecture or fix; he notices, wonders, teases gently, or just sits with someone. Test: with his name removed, the line should still sound like only Milo would say it.

## Motion
- He notices and pauses rather than performs. One hop for a moment that matters, not constant bouncing.
- Elastic, soft overshoot on hops (built in). No shaking or vibrating.
- Eyes can follow the pointer (`follow: true`) or a target (`lookAt`), which makes him feel present.
- His hops are silent; his chirps (`hello`, `happy`) are subtle.
- He appears when he's introduced, never before, and never on top of text.

## In a deck
- Sizes: 46–64 for crowds, 90–130 standing on cards, 180–300 as a hero.
- Use `backdrop` shapes (M3 cookie/flower) only when they add something; never behind him inside a timer outline.
- When the source deck has Milo drawn into an illustration, paint the drawing out and place the live Milo there, so he matches the rest of the deck.
