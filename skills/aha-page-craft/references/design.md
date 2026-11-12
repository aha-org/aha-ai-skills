# Design: thinking like a senior designer

Contents:

1. The grid
2. Lines
3. Space
4. Hierarchy and the focal point
5. How a section opens
6. Cards
7. A set must read as a set
8. Type
9. Colour
10. Motion
11. Real content
12. Phone
13. Measuring, not eyeballing
14. Restraint, and the tells of junior work

The numbers here are the ones Aha's pages use. They live as tokens and rules in `app/(aha)/aha.css`. Use the tokens, not the raw values.

## 1. The grid

Decide the lines before placing anything on them.

- **One page width, one gutter.** Every section is at most 1320px wide with a side gutter of `var(--gut)`, which is `clamp(20px, 5vw, 72px)`. Nothing hangs outside it except the two full-bleed bands (the header and the dark statement).
- **Everything starts on the left line.** Headings, labels, lists and cards all begin at the gutter. Centring is saved for the one place that is meant to stop the eye: the closing panel.
- **A few column splits, repeated.** The same proportions come back on every page, so sections of different content still share vertical lines:
  - a heading with a line beside it: `1.2fr / 1fr` (`.head`)
  - a heading that holds its place beside a list: `0.85fr / 1.15fr` (`.split`)
  - a narrow rail beside long text or a form: `0.42fr / 1fr` (`.doc`, and the find-a-therapist steps)
  - two equal halves for ours-beside-theirs (`.vs-pair`) and for a mock-up beside its steps (`.showpiece`)
- **Card grids fill the width evenly.** `repeat(auto-fill, minmax(min(100%, 300px), 1fr))` with a 24px gap. The column count follows the width, never a breakpoint list.
- **The left column can hold its place.** In a split, the heading is `position: sticky` at `top: 112px` while the right column scrolls. It gives a long section one anchor, and it means the reader always knows what the list is about.

When a new layout is needed, first ask which of these splits it is. A new proportion needs a reason.

## 2. Lines

A hairline is the lightest way to say "these are separate".

- The line is `1px solid var(--hair)` (black at 8%). It rules apart rows in a list, sections in a form, the footer from the page, and a card's footer from its body.
- A heavier line, `1px solid var(--ink)`, sits above a large figure. It is the only place a full-strength line is used, so it reads as emphasis.
- A card's border is the same hairline. So is a table's row line. One line weight across the whole site.
- **Lines separate, boxes group.** If two things are ruled apart they do not also need boxes. If things sit together in a card they do not need lines between each of them unless they are rows of the same kind.
- A line that marks position (a contents list, a quote) sits on the left edge at 1px or 2px. It never becomes a thick coloured bar.

If a view has a border on every element, remove them all and add back only the ones that separate two things the eye would otherwise merge.

## 3. Space

Space is the first tool and the cheapest one.

- **Sections breathe.** Vertical padding per section is `clamp(56px, 7.5vw, 108px)`. Under a section heading, `clamp(28px, 4vw, 56px)` before the content.
- **Proximity carries meaning.** Space inside a group is smaller than space between groups: about 6px between a label and its field, 16px between fields, 24px between cards, a section's padding between sections. If two gaps are the same, the reader cannot tell what belongs with what.
- **A small scale, used consistently.** 8, 14 to 16, 24, then the fluid section sizes. A card's padding is `clamp(22px, 2.8vw, 36px)`.
- **Reading width is a spacing decision.** Body text runs 60 to 68 characters. A supporting line beside a heading runs up to 44. A heading is held to 12 to 22 characters with `text-wrap: balance`, so it breaks into even lines.
- **Cluttered means too many things, not too little room.** When a phone hero was called "too cluttered", the fix was removing and regrouping, not shrinking type.
- **Empty space is allowed to stay empty.** A rail with nothing useful to say is better narrow than filled with decoration.

## 4. Hierarchy and the focal point

In every view, one thing is seen first.

- Squint at the section. If nothing stands out, it has no focal point. If three things do, it has none either.
- Three levels are enough: the thing (large, serif, ink), what supports it (body size, grey), and the quiet facts (small labels, lighter grey).
- Contrast comes from size and typeface before it comes from weight or colour. A serif heading against sans text already separates them.
- The action is the one filled, coloured thing. If there are two actions, one is a plain link.
- Numbers that matter are set large in the serif, with what they count small beneath them.

## 5. How a section opens

Every section on every page opens the same way (`Head`, or `PageHead` for a page's first section):

1. a small label (`.kick`): 12px, bold, upper case, letter-spaced, in the forest green
2. the heading, in the serif
3. one supporting line or link, resting beside the heading's last line on a wide screen and under it on a phone

This sameness is deliberate. It is what lets a table, a card grid and a form feel like parts of one page. Do not centre a section's heading, and do not invent a second way to open a section.

## 6. Cards

The card finish is fixed: white, a hairline border, a soft low shadow (`--card-shadow`), radius 24px. On hover a card that is a link lifts 3px and takes the deeper shadow (`--card-shadow-up`).

Inside a card, design zones, not rows:

- **Who or what** - the focal point. A portrait at a decent size, a cover, a large numeral, a name in the serif.
- **Their words or the gist** - the human or the specific part.
- **Quiet facts** - small labels with values, or chips.
- **The way in** - a ruled footer with one action, usually the round arrow (`.round`).

"A card that is a stack of equal-weight text rows reads as a database row." That was the exact failure the second time the therapist cards were sent back. The fix was not decoration. It was choosing one focal point, grouping the rest, and making the labels quiet.

One action per card. If the whole card is a link, the arrow is a sign, not a second link.

## 7. A set must read as a set

When things repeat (cards, rows, steps, plans), each part sits at the same place in every item. This is the first thing Shubham checks.

Ways to get there, in order of preference:

- **Fixed zones.** Give the cover a fixed aspect ratio and the label one line. Everything below then starts at the same offset.
- **Pin the footer.** Make the card a column and give the footer `margin-top: auto`. The action lands on the bottom edge of every card in the row.
- **Clamp long text** (`-webkit-line-clamp`) where an overflow would break the rhythm and the full text lives one click away. Never clamp copy that has nowhere else to be read.
- **Shared rows (subgrid).** When two or three cards must line up part by part (a label, a list, a second label), let the cards lay their parts on the parent's rows:

```css
.pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.pair > .card {
  display: grid;
  grid-row: span var(--rows); /* how many parts each card has */
  grid-template-rows: subgrid;
  row-gap: 14px;
}
```

The "Cons" label then starts on the same line in both cards however long the lists above it run.

- **Tidy the data** so one item's value is not twice the length of another's for no reason (see section 11).

Also keep one style per kind of thing. One card finish, one pill style, one way of showing a tick. When a second page needs the same pill, add its selector to the existing rule instead of writing a second rule.

## 8. Type

- Headings and statements: Hedvig Letters Serif, weight 400, tight tracking, balanced wrapping. `h1` is `clamp(42px, 6vw, 96px)`, `h2` is `clamp(34px, 4.6vw, 68px)`, `h3` is `clamp(24px, 2.4vw, 34px)`.
- Everything else: Satoshi, 18px at weight 500 for body, grey (`--ink2`) for supporting text.
- Labels: 12px bold upper case with `0.1em` tracking. Use it for what something is, never for a sentence.
- What Milo says: Schoolbell, the handwritten face. Its only other use is the odd handwritten aside: a sign-off under a promise, a note in a margin. Never a heading, never body text.
- A long title needs a smaller size, not a narrower column. Article titles and split headings step down so they hold to four lines.
- Emphasis inside a paragraph is ink against grey, not bold against regular.

## 9. Colour

The interface is monochrome: ink `#202020` on warm paper `#fdfbf7`, with two greys.

- Colour belongs to the grain: the hero shape, grain cards and panels, the dark statement band, and Milo. Grain never sits on a button or behind a block of text.
- Each audience has a grain shape and family: the home page a cookie (sun), workplaces a diamond (sky), campuses a leaf (lime), therapist pages a pentagon (blush).
- Orange (`--accent`) is for the hand-drawn underline and the one filled button (`.btn.press`). Every other button is outlined. This is why the booking button is seen first.
- Green appears in small labels (`--forest`) and as a tint for "our side" in a comparison. Red appears only as a cross or an error.
- When a card has no picture of its own, give it a grain panel in a family with a word on it, rather than a stock image.

## 10. Motion

- An element rises in once, calmly, the first time it scrolls into view (`Reveal`). Siblings can stagger by a step or two.
- Eases only, no bounces. Grain holds still once painted.
- The page scrolls the way the browser scrolls. The site-wide smooth scroll was the cause of "scroll feels heavy and slow", and Aha pages opt out of it with `data-lenis-prevent`.
- Product mock-ups are the older animations, left exactly as they were and framed in the card finish.
- Do not animate layout to draw attention. If something needs attention, it needs hierarchy.

## 11. Real content

Design with the data that will actually appear.

- Look at real values before designing: the longest name, the emptiest record, the missing photo.
- Tidy on the way in: title-case a name typed in capitals, drop a field that is empty, never show "null".
- A count on the page must agree with what the page shows. If a headline gives one number and the list holds another, say so in the report.
- A stock picture that is not the product does more harm than no picture.
- Long lists show a first screenful and a way to see more.

## 12. Phone

- Stack in reading order. In a split, the heading comes first, then the content. Where a section asks for something, the ask comes after the reasons, not before.
- A two-column set becomes one column. A sticky rail becomes ordinary flow.
- A comparison must still compare. A three-column table is tightened until both answers fit side by side, not left to slide off the screen.
- Buttons go full width when they are the section's one action.
- Check 375px for sideways scroll and for text that no longer fits its line.

## 13. Measuring, not eyeballing

Run these in the page (the browser's JavaScript tool) at 1360px and 375px. Report numbers, not impressions.

Same part at the same offset across a set:

```js
const cards = [...document.querySelectorAll('.blog-card')];
cards.map((c) =>
  Math.round(
    c.querySelector('h3').getBoundingClientRect().top -
      c.getBoundingClientRect().top,
  ),
);
// every value equal: the titles start on one line
```

Two cards lining up part by part:

```js
const [a, b] = document.querySelectorAll('.vs-pair .vs-card');
[...a.children].map((el, i) =>
  Math.round(
    el.getBoundingClientRect().top - b.children[i].getBoundingClientRect().top,
  ),
);
// all zeros
```

No sideways scroll, and nothing clipped:

```js
document.documentElement.scrollWidth - innerWidth; // 0
[...document.querySelectorAll('h1,h2,h3,th,td')].filter(
  (e) => e.scrollWidth > e.clientWidth + 1,
).length; // 0
```

No stray dashes in what the visitor reads:

```js
(document.body.innerText.match(/[\u2013\u2014]/g) || []).length; // 0
```

Then take a screenshot and look at it as a visitor would. A page that passes the numbers can still be dull. The numbers only prove it is not broken.

## 14. Restraint, and the tells of junior work

Senior work is mostly what is left out. Before adding something, ask what it lets you remove.

Tells to look for in your own work:

- every heading centred
- rows of equal size and weight, with nothing to look at first
- a border, a background and a shadow on the same element
- two or three card styles on one page
- an icon in a tinted square above every card title, meaning nothing
- the action in a different place in each card
- a title that wraps to one line in one card and three in the next, pushing everything below out of line
- labels in title case in one section and upper case in another
- a gradient or a colour introduced to make a section "pop"
- a device frame or drop shadow heavier than anything else on the page
- text set to the full width of a wide screen
