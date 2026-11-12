---
name: aha-page-craft
description: Design and write Aha's marketing pages the way a senior designer and a senior copywriter would - grid, lines, alignment, use of space, card hierarchy, uniform sets, and copy written from a brief in the reader's own words. Use this whenever you build, restyle, convert or review any page, section, card, grid, list, table or form in apps/aha-landing (or another Aha marketing surface), and whenever you write or rewrite its copy, headings or button labels. Also use it when the user says a page feels junior, bland, plain, meh, cluttered, misaligned, not uniform or inconsistent, asks you to "think like a senior designer" or "senior copywriter", shares a screenshot of a page to react to, or asks for a page to match the home page's design language. Reach for it before the first line of CSS or copy, not after the feedback.
metadata:
  version: 1.0.0
---

# Page craft: design and copy at a senior level

This skill holds what was learned rebuilding Aha's landing portal (the home page, then every other page) in November 2026. It is two things at once: a way of thinking about a page, and a working method that gets the thinking onto the screen without regressions.

## Why this exists

Shubham judges these pages from screenshots, as a visitor would. They are how an employer checking Aha out, or someone looking for a therapist, sizes the company up. Three things he said define the bar:

- On a set of cards: "No uniformity in these cards... there should be alignment, and column spacing should be fixed... Think of it like uniformity in a grid."
- After they were made uniform: "It feels too simple, like a junior designer has designed it."
- On the copy: "The whole page feels like a junior copywriter has written it."

And what he said when it landed: "I like this design and how you've chosen it... The principles that you've used here, I really appreciate."

The lesson in all three: work that is merely correct reads as junior. Junior design gives every element the same weight and prints the data as it arrives. Junior copy names topics and describes features. Senior work decides. It decides what matters most in each section, where the eye should land, what the reader is silently asking, and it removes everything that does not serve that.

Do both passes in the first attempt. Each of the remarks above cost a round trip that a decision made up front would have saved.

## The two people to be

**The senior designer** sees the page as a grid before seeing it as content. They ask where the lines are, what sits on them, how much air each group needs, and which single thing in each view should be seen first. They measure alignment instead of trusting their eye, and they would rather remove an element than decorate it.

**The senior copywriter** writes for one reader, from a brief, before writing a line. They name the reader's state before offering anything, use the reader's words instead of the category's, prefer a moment you can picture to a general statement, and make every heading a claim or a question.

When the task is design only, be only the first. When it is copy only, be only the second. See "Scope" below: mixing them unasked has been sent back before.

## How to work

1. **Settle the scope first.** Design, copy, or flow? "Fix the flow" means fields, steps and routing only. "Update the design, the copies should be what they are" means the words stay. A blanket "yes" to one does not extend to the others. If the request is one of these, do not touch the rest, even to improve it. Note what you would change and say so in the report.
2. **Read before touching.** The page as it is, the data it shows (real values, not the type), the kit (`references/aha-kit.md`), and, for copy, the brief at the top of `app/(aha)/content.ts`. Another session may be editing the same folder: read a file's current content before editing it.
3. **Decide before building.** For design: the job of each section, its one focal point, which grid lines it uses. For copy: the brief (reader, what stops them, the one idea, the voice). Write the decision down where the work lives, as a comment above the component or the copy.
4. **Build from the kit.** Almost every layout this site needs already exists as a pattern. Add a new one only when none fits, give its classes a prefix of their own, and say in a comment what it is for.
5. **Verify by measuring.** In the browser, at desktop and phone widths: same parts at the same offset across a set, no sideways scroll, nothing cut off, no stray dashes. Scripts for this are in `references/design.md`. Then look at a screenshot.
6. **Report plainly.** What changed, what you could not verify, and any content problem you noticed but left alone (a stale year, a number that contradicts another page, a stock image that is not the product).

## Design: the short version

Read `references/design.md` before designing anything larger than a single element. In brief:

- **Grid first.** One page width, one gutter, and a small set of column splits repeated on every page. Content hangs from the same vertical lines everywhere, so the eye learns them.
- **Lines separate, boxes group.** A hairline rules things apart. A card holds things that belong together. Do not use both for the same job, and do not box what a line or plain space already separates.
- **Space is the first tool.** Tighter inside a group than between groups. When something feels cluttered, the fix is usually to remove or to regroup, not to shrink.
- **One focal point per view.** Each section and each card has one thing seen first, a second thing, and the rest quiet. If everything is the same size and weight, it reads as a database row.
- **Every section opens the same way.** A small label, a serif heading, and one supporting line resting beside the heading's last line. Repetition of the opening is what makes different sections feel like one page.
- **A set must read as a set.** In repeated cards or rows, each part sits at the same offset in every item, whatever the length of the words. Fix the zones, pin the footer, clamp long text, or put the parts on shared rows (subgrid).
- **Give repeated things a human centre.** A face at a decent size, the person's own words, a real number. Then quiet labels, then one clear action.
- **Colour is rare.** The interface is ink on warm paper. Colour lives in the grain shapes and in Milo. Orange is for the one thing to press and the hand-drawn underline.
- **Motion is calm.** Things rise in once. Grain holds still. The page scrolls the way the browser scrolls.
- **Tidy the content.** Never print raw data: fix casing, drop empty values, replace a stock picture that is not the product.
- **Phone is a design, not a squeeze.** Stack in reading order, keep a comparison comparable, check there is no sideways scroll.

Junior tells to hunt for before showing work: centred everything, equal-weight rows, a border on every element, three different card styles on one page, a heading that wraps differently in each card, an action in a different place in each card, text touching a card's edge, a label in title case here and upper case there, a lone icon doing nothing.

## Copy: the short version

Read `references/copy.md` before writing or rewriting a page. In brief:

- **Brief first.** One reader, what stops them (in order), the one idea, the voice. Keep it at the top of the file that holds the copy.
- **Name their state before your offer.** "You've been coping. That's not the same as okay." comes before anything about therapists.
- **Their words, not the category's.** "My mind won't switch off", not "anxiety management".
- **A moment you can picture.** 3 am, Sunday night, the blank page at 8 PM. One real moment beats a general claim.
- **Each section answers the next silent question.** Is this for me? What is the catch? Who would I talk to? What if it goes wrong? Then the ask.
- **Headings are claims or questions, not labels.** "Meet them before you book", not "Our therapists". "Which one sounds like you?", not "Concerns".
- **Handle the real objection.** For therapy it is "is mine bad enough?". Say it out loud and answer it.
- **End by calling back to the opening.** The close of the home page returns to "okay".
- **Small words carry the voice too.** Section labels, button text, the line under a button.
- **Stay honest.** No invented numbers, reviews or credentials. Samples are labelled as samples. No promise beyond the ones signed off.

Junior tells: a heading that names a topic, the same offer repeated in the same words, adjectives doing the work of facts, "we" in every sentence, stock phrases (journey, healing, safe space, take the first step), a button that says "Submit" or "Learn more".

## Hard limits

These hold on every surface, including code comments and chat replies.

- **No em dashes or en dashes, anywhere.** Use a hyphen, a comma, a colon, or two sentences. Replace them in existing text you touch. Text that arrives from the backend is tidied on the way in (see the kit reference).
- **No invented proof.** Numbers come from Shubham or from a page that already makes the claim, and the source is noted beside them. If two pages disagree, say so instead of picking one.
- **Design-only means the words stay.** Small labels and dash clean-up are the only exceptions. Fixing a bug in how text is shown (a doubled brand in a tab title, "null Min read") is fine and should be reported.
- **Forms are not sent in testing.** They create real leads. Check validation and layout, never the final submit.
- **Claims about code are verified.** Cite the file and line, trace the whole flow, say what is not covered.
- **Commit only when asked.**

## Before you show the work

- Every repeated part measured at the same offset, at desktop and at phone width.
- No sideways scroll at 375px. Nothing important cut off.
- One focal point in each section. One action per card.
- Labels consistent in case, size and position across the page.
- Zero em or en dashes in the visible text.
- Lint and type-check clean (`pnpm exec tsc --noEmit`, `pnpm exec eslint` from `apps/aha-landing`).
- A screenshot looked at, not just a status code.
- The report says what was not verified.

## Reference files

- `references/design.md` - the principles in depth, with the numbers this site uses, the patterns for uniform sets, and the scripts for measuring. Read it before any layout work.
- `references/copy.md` - the brief, the question ladder, the patterns with examples from the home page, small words, and the editing pass. Read it before writing or rewriting copy.
- `references/aha-kit.md` - Aha's design language as built: tokens, the shared patterns and where each lives, the component kits, how to convert an older page, the checks to run, and the traps already hit. Read it before touching `apps/aha-landing`.
