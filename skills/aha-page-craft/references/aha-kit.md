# The Aha kit: the design language as built

Contents:

1. Where things live
2. Tokens
3. Shared patterns (aha.css)
4. Component kits
5. The audience shapes
6. Naming and scoping
7. Converting an older page
8. Checks to run
9. Looking at a page in the preview
10. Traps already hit

Everything here is in `apps/aha-landing`. It was true on 12 November 2026. Read the file before relying on a detail, since the folder changes often and more than one session may be working in it.

## 1. Where things live

```
app/(aha)/                  every page in Aha's design language
  layout.tsx                the shell: fonts, footer, native scrolling
  aha.css                   tokens and every shared pattern, scoped under .aha
  engine.tsx                GrainShape, GrainField, LiveMilo, Reveal (client)
  sections.tsx              Header, Footer, Head, PageHead, ClosingPanel, FaqBlock,
                            and the home and buyer page sections
  content.ts                the home and buyer pages' copy, with the brief at the top
  demo.tsx                  TrackedLink, DemoButton, the demo form (client)
  underline.tsx             the hand-drawn underline
  product.tsx, product.css  the product page kit
  versus.tsx, versus.css    the comparison kit
  legal.tsx                 a policy or terms page as a document
  therapist-card.tsx        the therapist card
  blog/                     the blog: list, article, wellness tools, blog.css
  <route>/page.tsx          one folder per page
app/campaign/               advert landing pages: own minimal shell, same language
app/r/[slug]/               the short-link screen: own shell, same language
app/(v4)/                   the older site: configs, schemas, lib, product mock-ups
lib/therapists.ts           the public therapist list, fetched on the server
```

The copy for most converted pages still lives in `app/(v4)/config/*.ts` and in each product page's own `config/` folder. The pages import it from there.

## 2. Tokens

Defined on `.aha` in `aha.css`. Use the variables.

| Token                                 | Value                                     | For                                     |
| ------------------------------------- | ----------------------------------------- | --------------------------------------- |
| `--bg`                                | `#fdfbf7`                                 | the page: warm paper                    |
| `--ink`, `--ink2`, `--ink3`           | `#202020`, `#62605f`, `#898786`           | text, supporting text, quiet facts      |
| `--line`                              | `#cac8c7`                                 | a field's border                        |
| `--hair`                              | `#00000014`                               | every hairline and card border          |
| `--brand`, `--forest`                 | `#749c49`, `#4a6a3b`                      | the logo and ticks, small labels        |
| `--accent`                            | `#f28c38`                                 | the underline and the one filled button |
| `--card-shadow`, `--card-shadow-up`   | soft and low, deeper on hover             | cards at rest and lifted                |
| `--serif`, `--sans`, `--hand`         | Hedvig Letters Serif, Satoshi, Schoolbell | headings, text, Milo                    |
| `--gut`                               | `clamp(20px, 5vw, 72px)`                  | the page's side gutter                  |
| `--out`                               | a quartic ease-out                        | entrances                               |
| `--r-m`, `--r-l`, `--r-xl`, `--r-xxl` | 12, 16, 28, 48px                          | radii (cards use 24px)                  |

## 3. Shared patterns (aha.css)

| Pattern               | Classes                                            | What it is                                                                                |
| --------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| A section             | `section.block`                                    | max width 1320px, fluid padding. Add `.slim` for a ruled strip with no padding of its own |
| Section opening       | `.head`, `.kick`, `.head-side`, `.lede`            | label, heading, one line beside it. `Head` and `PageHead` render it                       |
| Small label           | `.kick`                                            | 12px bold upper case in forest green                                                      |
| Quiet tags            | `ul.chips`                                         | small grey pills for what something is                                                    |
| Round arrow           | `.round`                                           | the way in, on a card                                                                     |
| Buttons               | `.btn`, `.btn.big-btn`, `.btn.press`               | outlined by default. `.press` is the one filled orange button                             |
| Hero                  | `.hero`, `.hero-copy`, `.hero-art`, `.ln`, `.late` | headline lines and the grain shape with its two soft copies                               |
| Heading beside a list | `.split`, `.split-lead`, `ol.numbered`             | the heading holds its place while the numbered list is read                               |
| A few points          | `.points`                                          | quiet numbered points, side by side                                                       |
| Timeline              | `.timeline`, `ol.steps`                            | reading downwards, or steps across                                                        |
| Figures               | `.figures` (product.css), the trust bar            | big serif numbers over a hairline                                                         |
| A form                | `.form`, `.field`, `.row`, `.err`, `.form.sent`    | one white card, labels above fields                                                       |
| Form with a side      | `section.block.ask`, `.ask-side`, `.ways`          | a form beside other ways in                                                               |
| A document            | `section.block.doc`, `.doc-toc`, `.prose`          | a contents rail beside long text                                                          |
| Pills that select     | `.choice[aria-pressed]`                            | one definition shared by the therapist list, the blog, find-a-therapist                   |
| Grain cards           | `.door`, the concern stage                         | text on a grain panel, one colour family each                                             |
| Statement             | `.statement`                                       | the one dark band on a page                                                               |
| Questions             | `.faq-row`, `.faq-lead`, `.faq`, `.turn`           | the heading holds its place beside the questions                                          |
| Closing               | `.closing`                                         | one framed panel with soft grain at its corners, the only centred section                 |
| Entrance              | `.aha-reveal`, `.in`                               | rises in once. `Reveal` adds `.in` when in view                                           |
| Underline             | `.u`, `.scribble`                                  | drawn in a hero, a page heading or a revealed block                                       |

## 4. Component kits

**`sections.tsx`**: `Header({ current, action })` where `current` is an audience or `'site'`, and `action` is the page's own button (`press: true` for the filled one). `Head`, `PageHead`, `ClosingPanel({ shape, title, lede, children })`, `FaqBlock({ id, kicker, title, lede, items, aside })`, `Footer`.

**`product.tsx`** (a therapist product or feature page): `ProductHero`, `ProductProof`, `Figures`, `PullQuote`, `ProductSteps`, `Sample`, `FeatureList`, `FeatureCards`, `FeatureSplit`, `Showpiece` (a mock-up beside its steps), `Catalogue`, `Verdict`, `MidCta`, `ProductClosing`. The Scribe page is the worked example.

**`versus.tsx`** (compare and alternatives pages): `VersusOverview`, `VersusTable`, `VersusPricing`, `ProsCons`, `VersusVerdict`, `AltIntro`, `CompareLink`, `RankedList`, and `Mark` (a tick, a cross or a dot). Cards in a pair lay their parts on shared rows, so both sides line up.

**`legal.tsx`**: `LegalPage({ kicker, title, updated, intro, sections, contact })`.

**`blog/`**: `PostList` (categories, a large first card, a grid twelve at a time), `Article` (title, cover, a rail with byline and contents, the text), `WellnessArticle` and the tools in `wellness/`. Its card list (`.blog-grid`, `.blog-card`, `.blog-cover`, `.blog-go`) is reused by the campaigns list.

**`engine.tsx`**: `GrainShape({ shape, size, spin, copy })`, `GrainField({ family, from })` (lower `from` under white text), `LiveMilo({ size, backdrop })`, `Reveal({ as, delay, className })`. `Reveal` passes only those props, so mark a variant with a class, not a data attribute.

## 5. The audience shapes

| Audience          | Shape    | Family |
| ----------------- | -------- | ------ |
| The person (home) | cookie   | sun    |
| Workplaces        | diamond  | sky    |
| Campuses          | leaf     | lime   |
| Therapists        | pentagon | blush  |

A page's hero shape returns, softened, in its closing panel. Only the families dark enough carry cream text: sky, lime, blush, forest.

## 6. Naming and scoping

- Everything is scoped under `.aha`, so the older pages are untouched.
- A new kit or page gets a prefix for its own classes: `.vs-` (comparison), `.blog-`, `.post-`, `.wb-` (wellness tools), `.cp-` (campaign), `.find-`, `.open-`, `.pilot-` (the pilot page). Short unprefixed names have collided with existing rules before (see section 10).
- When a second place needs an existing style, add its selector to the existing rule. One definition per thing.
- Every CSS block opens with a comment saying what the pattern is and why, in plain words. Components carry the same kind of comment.
- A page's styles that nothing else uses live beside the page (`about.css`, `find.css`), not in `aha.css`.

## 7. Converting an older page

The rule for these is design only: the words stay.

1. Read the old page, its config and its components. List every piece of copy and every behaviour (form logic, analytics, structured data).
2. Create `app/(aha)/<route>/page.tsx`. Keep the metadata and the JSON-LD as they are. If the old title already ends with the brand, use `title: { absolute: ... }`, since the root layout appends the brand.
3. Build the page from the kit, in the old section order. Keep form logic to the letter: lift the handlers out, replace only the markup.
4. Keep product mock-ups as they are (the animations in `app/(v4)/components/animations`), framed in the card finish with the type reset.
5. Replace em and en dashes in the copy you touch.
6. Delete the old route folder, then run `pnpm exec next typegen`.
7. Check the page at 1360px and 375px (section 9), then run the checks (section 8).

A page that must not carry the site's header and footer (an advert landing page, the short-link screen) stays outside `app/(aha)` and sets the language up in its own layout: import `aha.css`, load Hedvig in a server component, wrap in `<div className="aha ...">`.

## 8. Checks to run

From `apps/aha-landing`:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint "app/(aha)" app/campaign app/r lib
```

Format from the repository root, naming each file in quotes (a glob with parentheses matches nothing):

```bash
pnpm exec prettier --write "apps/aha-landing/app/(aha)/blog/page.tsx"
```

Load the route and look for a 200:

```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3021/blog
```

Never run `next build` while the dev server is running: it overwrites `.next` and breaks the running preview.

## 9. Looking at a page in the preview

The dev server is the `landing-experiments` launch configuration on port 3021.

- When the preview pane is not in front, animation frames do not advance. Entrances stay at their starting state and scroll-driven behaviour does not fire. Before a screenshot, force the reveals and load the images:

```js
document.querySelectorAll('.aha-reveal').forEach((e) => e.classList.add('in'));
document.querySelectorAll('img').forEach((i) => (i.loading = 'eager'));
```

- Take a small screenshot first, wait a moment, then the real one. The first often catches a half-painted frame.
- A headline line that turns over, a counter or a sticky showcase may look stuck in a screenshot for the same reason. Check its state with a script before calling it a bug.
- Set the viewport to 1360 by 850 and to the phone preset, and reset it to desktop when done.
- Measure with the scripts in `design.md`.
- Do not send a form. Trigger validation by submitting it empty, which sends nothing.

## 10. Traps already hit

- **Class names that collide.** `.foot` met the site footer, `.note` met Milo's note, `.block` met a utility class, `.shot` met the therapist page. Prefix new classes and search `aha.css` before choosing a name.
- **`??` inside JSX** in a component also compiled for the client threw a runtime reference error in the therapist card. `||` was used instead.
- **A font loader in a module that a client component imports** fails to compile. Keep the font in a server component and pass children in.
- **A doubled brand in the tab title**, when a page's title already ends with it. Use `title: { absolute }`.
- **A sticky side with nothing to say.** If a rail is empty, give it the byline or the summary, or drop the rail.
- **A picture overlapping its neighbour** when an aspect ratio and a full-height rule were both set on a grid item. Use a minimum height and let the grid stretch it.
- **Text from the backend with em dashes.** Wellness posts are tidied as they are fetched (`app/(v4)/lib/wellness-blog.ts`). The data itself still has them.
- **Values that can be missing.** A wellness post's length can be null. Show nothing, not "null Min read".
- **The same client state read twice in one tick** (two chips toggled by a script) loses one of the changes. That is how the older form behaves and it does not affect a person clicking.
- **Another session editing the same folder.** A type error can appear in a file you did not touch while it is mid-edit. Re-run the check before chasing it, and re-read a file before editing it.
- **An older shared component inside an Aha page.** The lead form modal paints its button with the v4 brand tokens (`--v4-primary` and friends), which only the older layout sets. Without them the button is invisible. Set the tokens on the page's wrapper, as `start-pilot/pilot.css` does.
- **Words that differ by audience.** The pilot page keeps both a college's and a company's words in the HTML (`W` in `start-pilot/words.tsx`) and hides one set from the wrapper's `data-for`. Follow that instead of re-rendering.
- **Importing `sections.tsx` into a client component** pulls server code along. In a client component, write the few lines of markup (`.head`, `.closing`) directly.
