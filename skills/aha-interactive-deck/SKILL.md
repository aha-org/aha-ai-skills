---
name: aha-interactive-deck
description: Turns a static slide deck (PPT/PPTX, Keynote export, PDF, Google Slides SVG, or screenshots) into an interactive, arrow-key web presentation in Aha's design language — Material 3 Expressive components and motion, Aha colours and fonts, live Milo, sticker icons, projector-size type, one-idea-per-click reveals, built-in timers, games and sound — then bundles it into one file and deploys it to Vercel. Use this whenever someone wants to make a deck, talk, workshop or presentation "interactive", "gamified", "animated", "a website", "clickable", "like Being There Matters / Save Me a Seat", or wants to present slides from a browser, even if they only say "convert my PPT" or "make this deck better for the session". Also use it for edits to decks built this way (folders with index.html + deck.js + milo.js).
---

# Aha interactive deck

Build a presentation website from a slide deck: a 1600 × 900 stage scaled to any screen, driven by the arrow keys, where each slide becomes a small piece of interaction (a crowd that regroups, a barrel of steps, a timer, flip cards, a story with Milo) instead of a static page. The output is a folder you can preview locally, a single self-contained HTML file, and a live URL.

Two finished decks built this way ship inside the skill as references: `assets/example/` (Save Me a Seat) and `assets/example-btm/` (Being There Matters). The starter project is `assets/template/`.

## What ships inside the skill

Everything needed to build in the Aha language travels with the skill: the live Milo (`milo.js`, his exact shape, band, eyes and moods), the colour tokens, the Aha logo, the sticker-icon setup, the sounds, and two complete decks with their artwork. Fonts load from their official free hosts: Hedvig Letters Serif and Schoolbell from Google Fonts, Satoshi from Fontshare (free), Phosphor icons from unpkg. Nobody has to install a font: the preview loads them online, and `tools/bundle.py` downloads Satoshi and the icons once and embeds them in the finished file. Building needs an internet connection for that step.

## How the person reviewing it thinks

These decks were built with a design lead who reviews every slide on a projector-size screen. Their standards are the point of this skill, so read them before designing:

- `references/design-system.md` — colours, type sizes, components, icons, Milo, motion, sound, spacing. Read fully before building.
- `references/brand-guide.md` — Aha's brand rules (colours, logo, tone). Decks follow design-system.md where they differ.
- `references/milo-dna/` — the full Milo character bible + 11 reference images. Only needed when Milo must do something milo.js doesn't already do (an arm, a prop, a new pose).
- `references/milo.md` — Milo's locked look, colour meanings, eyes, personality and motion. Read before putting Milo on any slide or writing anything he says.
- `references/patterns.md` — which interaction to use for which kind of slide, and where the working code is. Read when planning.
- `references/engine.md` — markup, hooks, helpers, preview, bundling, deploy, cleaning source art. Read when building.
- `references/review-checklist.md` — run it on every slide before showing anything.

The short version: 90% visual, very little text, nothing under 26px, white or flat brand backgrounds with no gradients, no pills, sticker icons on top of cards, one idea per click, Milo alive but never over text, calm colour, generous space, subtle sound.

## Workflow

### 0. Check the machine (first time only)

The person may have a fresh laptop with none of this installed. Check and set up quietly, asking only before anything that needs their password or an account:
- `python3 -c "import PIL, pypdf"`; if it fails: `python3 -m pip install --user pillow pypdf`.
- `node --version` (needed only for password protection and Vercel). If missing, say so; local presenting still works.
- Fonts: nothing to install. Satoshi (Fontshare), Hedvig Letters Serif and Schoolbell (Google Fonts) and the Phosphor icons load online and get embedded by the bundler.
- On macOS the helpers in `scripts/` use built-in tools (Swift, `say`, `qlmanage`). Elsewhere, install poppler (`pdftoppm`) for rendering; QR decoding and the crowd-voice maker are macOS only.

### 1. Unpack the source deck

```bash
python3 -I <skill>/scripts/extract_deck.py "<deck.pdf|.pptx|.svg>" <scratch>/extract
```

This renders every slide, writes `text.md`, extracts every embedded image once (with transparency), makes contact sheets, and decodes QR codes. PPTX needs LibreOffice; otherwise ask for a PDF export. Look at the contact sheets (`sheets/`, `images/sheet.png`) and read `text.md` so you know every slide, every heading and every asset (illustrations, logos, QR codes) you can reuse. Decoded QR links tell you what each code is (WhatsApp, a form…); keep them working.

### 2. Plan the deck

Write a short slide-by-slide plan: slide number, heading (kept verbatim), the interaction pattern from `references/patterns.md`, how many clicks, background, which source images it reuses, and what Milo does. Think about what happens *in the room* on that slide: is it a game the facilitator runs (needs a timer or rounds), a reflection (needs quiet and privacy), a story beat (needs one strong visual moment), or a list (needs one item per click)?

Share the plan in a few lines and keep going unless something is genuinely ambiguous (for example, whether the deck should be public or password-protected; ask that before deploying).

### 3. Scaffold

```bash
bash <skill>/scripts/new_deck.sh <folder-name> "<Deck Title>" [parent-dir] [port]
```

This copies the template (engine, Milo, sound, base styles, bundler, four starter slides), sets the title and adds a preview entry to `.claude/launch.json`. Copy reusable source art into `<deck>/assets/` (WebP for illustrations, quantised PNG for QR codes and logos).

### 4. Build the slides

Replace the starter slides with the real ones. For each slide, start from the matching example (copy its markup, its `#slide-id` CSS block and its `hooks['slide-id']`), then adapt the content. Keep the engine parts of `deck.js` and the token block of `styles.css` as they are.

Writing guidance:
- Keep the source deck's headings word for word. Shorten supporting text to one line; move long instructions into the interaction (e.g. three action tiles instead of a paragraph).
- If you add words that weren't in the source (a card label, "How did today feel?"), keep them few and tell the user which ones are yours.
- Prefer the source deck's illustrations over drawing your own. If you must draw something (a bench, a door), keep it simple and flat, and flag it for review, because hand-built drawings are where reviews go worst.

### 5. Verify like the reviewer

Preview with `preview_start {name}`, resize to 1200 × 675, and walk every slide to its final step (`deck.goto(i, step)`), screenshotting each. Check the console for errors. Then go through `references/review-checklist.md`. Fix and re-check before you show anyone; problems such as Milo on top of a subtitle, an off-centre spotlight or a timer chip covering a heading are exactly what gets noticed first.

### 6. Bundle and deploy

```bash
cd <deck> && python3 -I tools/bundle.py . dist/<name>.html
```

If they only want to present from their own laptop, stop here: open `dist/<name>.html` in Chrome, press F for full screen, and use the arrow keys (it needs internet only for two Google fonts). Otherwise deploy (`references/engine.md` §8): public (`cp dist/... deploy/index.html`) or password-protected (`node tools/encrypt.mjs ...`), then Vercel. Confirm public vs password with the user before the first deploy, verify the live URL, and remove the `.env.local` the Vercel CLI creates.

### 7. Report

Tell the user the URL, then a short slide-by-slide list of what each slide now does (plain language, no file paths), what you invented (words, drawings), and what you couldn't check yourself (sound you can't hear, things that need a real projector). Offer the single HTML file for offline presenting.

## Iterating on feedback

Feedback will be short and visual ("not centred?", "Milo over text?", "too much on this slide", "sounds like wind"). Read it as a rule, not a one-off: fix it on the slide mentioned, then check every other slide for the same problem, and add it to `references/review-checklist.md` if it's new. Rebuild, redeploy and say exactly what changed.
