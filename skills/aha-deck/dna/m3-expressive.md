# Material 3 Expressive, the Aha way

Aha uses Material 3 Expressive for its **shapes, corner scale and component structure**, dressed in Aha's colours and type. Grain gradients and hand-drawn lines (see `grain/GRAIN-GUIDE.md`) are what make those shapes feel like Aha.

## Shapes

The M3 Expressive shape set: `cookie9`, `cookie12`, `sunny`, `flower`, `clover4`, `squircle`, `pentagon`, `diamond`, plus Aha's own leaf and sun (9-scallop cookie). Use them for:
- spotlights and backdrops behind a person or Milo (optically centred on the subject, not the SVG box)
- timers (the cookie outline as a stroke that runs down, never a plain circle)
- grain pieces (any of these shapes can carry a grain gradient with lines)

Web helpers: `MiloKit.shapePoints(name)` in `milo/web/milo.js` returns the outline; the deck engines turn it into a CSS `clip-path`.

## Corner scale

`4, 8, 12, 16, 20, 28, 32, 48, full`. Cards 28; hero cards 48; one sharp corner (4) on speech notes, pointing at the speaker.

## Colour roles (generated from the Aha green seed `#749C49`, orange as tertiary)

| Role | Hex |
|---|---|
| primary | `#44681B` |
| primary container | `#C4F093` |
| secondary container | `#DBE7C8` |
| tertiary | `#944A00` |
| tertiary container | `#FFDCC5` |
| surface container low / mid / high / highest | `#F5F4EC` / `#EFEEE7` / `#E9E8E1` / `#E3E3DB` |
| outline / outline variant | `#75796C` / `#C4C8BA` |

In product UI these roles sit under Aha's monochrome rule (selection is an ink border, not a filled primary). In decks and marketing they can be used more freely.

## Components

- **Cards / tiles:** tonal fill or white with a 2px outline-variant border; radius 28 (48 for hero); padding about 30.
- **Active state** in decks: the current item turns ink or primary with light text.
- **Speech notes:** white surface, radius 28, one sharp corner toward the speaker, Schoolbell type.
- **No pills** around labels in decks (read as clutter). Product chips follow the Figma design system.
- **Sticker icons:** Phosphor fill (white) under Phosphor bold (ink), with a white outline and a soft shadow; placed at the top of a card, never as tiny bullets.

## Motion tokens (M3 Expressive springs, as CSS easings)

Defined in the deck engine's `styles.css` as `--m3-spatial-fast/default/slow` and `--m3-effects-*`. In Aha product UI use the **non-overshoot** curves only (Manan: no bounces in the app). Overshoot is allowed for Milo's own character motion and for marketing pieces when Manan asks.
