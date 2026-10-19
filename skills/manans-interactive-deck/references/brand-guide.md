# Aha brand rules (for Claude)

> **For presentation decks, `design-system.md` wins where the two differ.** Decks are seen on a projector, so they use pure white light slides (not #FDFBF7), allow orange as an accent, use projector-size type and richer motion. Everything else here (colour values, logo use, tone, fonts) still applies.

Read this before making anything for Aha: app screens, web pages, slides, docs, social posts, emails. If a request conflicts with these rules, follow the rules and say so.

## Colours

Use only these values. Do not invent tints, gradients or new accent colours.

| Name | Hex | Use for |
|---|---|---|
| Brand green | `#749C49` | Logo, illustrations, small brand moments. Not buttons, not selected states, not large UI fills. |
| Background primary | `#FDFBF7` | Page background. Warm off-white, never pure `#FFFFFF`. |
| Background secondary | `#FDF6F4` | Cards, buttons, raised surfaces. |
| Background tertiary | `#F0E9E6` | Subtle fills, dividers between sections. |
| Content primary | `#202020` | Main text and icons. Never pure `#000000`. |
| Content secondary | `#62605F` | Supporting text. |
| Content tertiary | `#898786` | Hints, placeholders, captions. |
| Border opaque | `#CAC8C7` | Default borders. |
| Border transparent | `#00000014` (black at 8%) | Hairlines on coloured or image backgrounds. |
| Border selected | `#202020` | Selected or focused elements. |

Shadow (only one): `0 4px 16px rgba(0, 0, 0, 0.12)`.

Rules:
- The interface is monochrome. Colour lives only in illustrations and in Milo.
- No coloured buttons, no coloured selected states, no coloured highlights or badges. Show selection with a `#202020` border.
- Buttons: `#FDF6F4` fill with a 1px border. Never a filled green button.
- No blue, purple or orange accents anywhere in the UI.
- Error and success colours are not decided yet. Ask before using any red or green for status.

## Fonts

| Font | Role | Where to get it |
|---|---|---|
| **Satoshi** | Default for everything: UI, body, headings. | Fontshare (not on Google Fonts). Web: `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap` |
| **Hedvig Letters Serif** | Occasional large headline for emphasis in brand or marketing material. Not for UI text or body copy. | Google Fonts |
| **Schoolbell** | Only when Milo is speaking. It is his handwriting. Never for headings, buttons or normal text. | Google Fonts |

CSS stack: `font-family: "Satoshi", "DM Sans", system-ui, sans-serif;`. If Satoshi can't be loaded where you are working, say so instead of silently switching fonts.

Type scale (Satoshi, px):
- Display: 96, 52, 44, 36
- Heading: 40, 36, 32, 28 (Bold); 24, 20 (Regular)
- Sub-heading: 18, 16, 14, 12
- Paragraph: 18, 16, 14, 12
- Label: 12, letter-spacing 0.8px

## Logo

- Lowercase "aha" wordmark with a small sprout under the "h".
- Always use the official logo file. Never retype "aha" in a font to fake the logo.
- Colours: brand green `#749C49` on off-white, black or pale lime backgrounds; off-white `#FDFBF7` on brand green.
- Don't stretch it, recolour it, add effects or put it on busy images.

## Milo

- Milo is Aha's mascot: a soft green blob with an M-shaped top and solid black eyes. Milo is "he".
- Never draw, trace or AI-generate Milo. Use the official illustrations only.
- When Milo talks, set his words in Schoolbell.

## Writing

- Plain, warm, simple language. Aha is a mental health product: calm, not salesy.
- No emojis and no em dashes in UI copy.

## Before you hand anything over, check

1. Every colour is from the table above.
2. Body and UI text is Satoshi. Schoolbell appears only for Milo.
3. No coloured buttons or coloured selected states.
4. Backgrounds are `#FDFBF7`, not white. Text is `#202020`, not black.
5. The logo and Milo are official assets, not recreations.
