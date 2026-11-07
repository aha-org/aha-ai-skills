# Website patterns

Every pattern here has been through Manan's review. Pick the ones the page needs; don't use them all.

## Page types

### Landing or event page (the template)
Header (logo + one outlined button) → hero with the grain entrance → three grain cards → one Milo moment → a forest statement band → one call to action → footer. 5 to 7 sections. One idea per section.

### Product web page (like the marketplace)
The app's rules apply, not the marketing ones: monochrome UI, outlined primary buttons, Phosphor icons, provider cards with five fields only (name first, years, expertise, next slot, price; price never the biggest thing), no per-provider colours, separation by type weight and space, not colour. Colour lives in illustration panels with live Milo scenes. Booking ends in an honest hand-off ("Continue to sign in"), never an invented payment or confirmation. Real provider data is never copied into a demo you share publicly without Manan's go.

### Editorial (like The Optimist, Aha's Saturday paper)
A newspaper on the Aha DLS: cream paper, ink type and ruled lines, square corners, Hedvig serif headlines, Satoshi for reading. Green only as "the green pen": a sun and hand-drawn underlines (once or twice a page). Milo only when there's a Milo note, in Schoolbell beside him. Blocks: content note, video, figure, pull quote, numbered "try this" box, helplines, credits, reader question with a therapist's answer, reading list. Content warnings and helplines on heavy topics.

### Mailer (sent as an image or simple HTML)
Built as a fixed-width page (880 or 1040 wide) and exported at 2x with `scripts/export_png.sh`. Manan's three rounds:
- v1, rejected: "too crowded" (three Milos, confetti, sparkles, badge rows, a Milo banner).
- v2, rejected: "blank paper" (one small Milo, a headline, a plain list).
- v3, the bar: full but calm. Every section still there, done once: a big confident hero with real colour mass, 2 or 3 tones, one Milo per moment at a generous size, separation by colour fields and space instead of cards and shadows, lines that never wrap unevenly.
Only real facts (offer, price, dates). Anything unknown stays a visible question to the person, not an invented line. If it needs to open in Figma: SVG must be flat (one `<text x y>` per line, hex colours, no nested `<svg>`).

## Sections

| Section | How | Notes |
|---|---|---|
| Hero | big serif headline in 2 lines, one lede line, one outlined button, a grain shape with two blurred copies | the grain entrance: copies drift in, the shape focuses in turning, lines focus in one by one, the underline draws itself |
| Grain cards | `.gcard` with `data-fam`, white text, a big number and a short label | one family per card, 3 or 4 cards, rise in one after another |
| Milo moment | `<div data-milo data-mood="green">` + a white note with one sharp corner toward him, Schoolbell | one Milo, 160 to 260px; he hops once when he comes into view; touch makes him happy |
| Statement band | forest field with arcs, one big line, hand-drawn underline | the only dark section on the page |
| Quote | big serif line, the person's name in Satoshi under it | real quotes only |
| Steps | numbered big serif numbers, one line each | not a grid of icons with paragraphs |
| FAQ | plain questions in serif, answers in Satoshi, a caret that turns | eases, no bounce |
| Chat demo | bubbles like the Aha app: mine brand green with light text, Milo's `#FDF6F4`; a sent message fades and rises as the thread glides up | no flying bubbles; Milo never reacts to someone sharing something hard |
| Footer | logo, one line, links in ink3 | |

## Things that went wrong before (don't repeat)
- Outlines on everything, dense mini-CV cards, Regular weight everywhere, the same blush on cream, Milo stuck in a corner, a grey search field that looks disabled.
- A painted or static Milo (always the live one).
- Hand-drawn SVG icons instead of Phosphor.
- A new preview link every round. Keep one link.
