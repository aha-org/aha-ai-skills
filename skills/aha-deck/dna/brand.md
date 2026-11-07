# Aha brand

The name is **Aha**. Never "AhaTherapy", never reintroduce "Therapy".

## Colour

### Product UI (app, web product)
| Role | Hex |
|---|---|
| Background primary (page) | `#FDFBF7` warm off-white, never pure white in the app |
| Background secondary (cards, buttons) | `#FDF6F4` |
| Background tertiary (subtle fills) | `#F0E9E6` (use sparingly; Manan dislikes it everywhere) |
| Content primary (text, icons) | `#202020`, never pure black |
| Content secondary | `#62605F` |
| Content tertiary | `#898786` |
| Border opaque | `#CAC8C7` |
| Border hairline | `#00000014` |
| Border selected | `#202020` |
| Brand green | `#749C49` (logo, illustration, my chat bubbles; not buttons) |
| Error | `#EC4C46` |

One shadow: `0 4px 16px rgba(0, 0, 0, 0.12)`.

- The UI is **monochrome**. No coloured buttons, no coloured selected states, no coloured badges. Selection = a `#202020` border.
- **Primary button:** `#FDF6F4` fill, 1px `#202020` stroke, ink text. Never a filled black or green button.
- **Back button:** a caret in a circle (Phosphor `CaretCircleLeft`), everywhere. Close stays an X.
- **Icons:** Phosphor only.

### Grain families (illustration, moments, marketing)
Two tones from one family, blended only by grain (see `grain/GRAIN-GUIDE.md`):

| Family | Light | Deep |
|---|---|---|
| blush | `#F4668E` | `#A51D55` |
| sky | `#7BA6DE` | `#3B55C9` |
| sun | `#F1C93F` | `#DE561C` |
| lime | `#AEC123` | `#4F7A2C` |

**Gradients are now part of Aha** (Manan, 2026-10-29), but only as grain, never a smooth gradient, and never on controls. Solids stay the default. Product screens use at most one grain piece, for a person you're about to meet or a moment that matters. Marketing (decks, reels, sites, mailers, social) can be bolder.

### Presentations and marketing extras
- Slides use pure white `#FFFFFF` light backgrounds (cream reads grey on projectors).
- Orange accent `#F28C38` (text-safe `#A84C0C` on white) is allowed in decks for numbers and highlights. In reels the accent is brand green.
- Deck forest green `#4A6A3B` for dark statement slides, with cream text.

## Type

| Use | Font | Where to get it |
|---|---|---|
| Headings, display, big numbers, quotes | **Hedvig Letters Serif** | Google Fonts (free) |
| UI, body, labels | **Satoshi** | Fontshare (free) |
| Things a person or Milo "says" by hand | **Schoolbell** | Google Fonts (free) |

- Product: 8pt grid, Satoshi for UI, serif for headings.
- Presentations: nothing below 26px on a 1600 × 900 stage; headings 76px and up.

## Logo

`brand/aha-logo.svg` (vector) and `brand/aha-logo-mask.png` (for colouring with CSS masks). Use the official file only; never redraw it. Brand green on light, sage `#C9D27A` on dark.

## Voice

- Plain, warm, everyday words. Say what happens, not what it is called.
- No em dashes. No emojis in UI copy (chat reactions are the one exception).
- Not clinical, not salesy, not therapist-speak. No invented credentials, reviews or numbers.
- Placeholder data is labelled as placeholder.
- Milo has his own voice (see `milo/MILO.md`); the app's own voice stays neutral.

## Code tokens

`brand/theme.ts` is the app's live token file and `brand/haptics.ts` its haptic patterns (hard, crisp "tak tak" for buttons, never soft buzzes).
