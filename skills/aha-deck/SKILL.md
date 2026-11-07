---
name: aha-deck
description: Makes Aha presentations as interactive arrow-key websites in Aha's design language (grain gradients with hand-drawn lines, Material 3 Expressive shapes, 8 fps hand-made motion, match cuts, live Milo, projector-size type, one idea per click), from a brief, an outline, or an existing deck (PPT/PPTX, Keynote export, PDF, Google Slides, screenshots), then bundles it into one HTML file and puts it online at one link. Use whenever someone at Aha wants a deck, talk, workshop, pitch, all-hands or presentation, wants slides "interactive", "animated", "like Manan's decks", "like Make it without me / Being There Matters / Save Me a Seat", or wants to edit a deck built this way (a folder with index.html + deck.js + grain.js or milo.js). Also use when someone asks how to work with Claude on a deck: what to give, in what order, how it works.
---

# Aha deck (v1.1)

Build a presentation as a website: a 1600 × 900 stage that fills any screen, driven by the arrow keys, where each slide is a small moment (a grain card arriving, a word changing, a cursor doing the thing, a match cut) instead of a static page. Output: a folder you preview locally, one self-contained HTML file, and one live link.

## How we work together (tell the person this whenever they ask how to start, what to give you, or in what order)
This is how Manan makes decks with Claude. Explain it in these steps, in plain words, and then follow it:

1. **They share what they have.** The old deck (PPT, PDF, Keynote export, Google Slides link or screenshots), or a brief or outline if there's no deck. Plus: what the talk is for, who's in the room, how long they have, and the date.
2. **They tell you the story.** What should people feel and remember at the end, and the order it should go in. Any moment they already imagine ("my face walking a line while people interrupt me"). Any deck or site they'd like it to feel like. You turn this into a slide-by-slide plan (heading, what happens on each click) and change it until they say yes.
3. **You build a first version and send one link.** Placeholders where real material is still missing (photos, voice notes, a video), each one listed in your message.
4. **They review it slide by slide.** Short notes are fine ("too crowded", "make this a separate slide"). They send the real material (photos, recordings, the closing video); you swap it in. Each round goes to the same link.
5. **Final.** The live link (public or password, their call) and one HTML file to present offline. Tell them: arrow keys, F for full screen, S for sound.

## Read first
1. `dna/AHA-DNA.md` and the files it lists (brand, grain, M3 Expressive, motion, Milo, checklist). This is how Aha looks and moves. Non-negotiable.
2. `references/design-system.md`: deck-specific sizes, colours, components.
3. `references/grain-engine.md`: the 8 fps grain engine (the default).
4. `references/patterns.md`: which interaction fits which kind of slide (classic engine, with Milo).
5. `references/engine.md`: classic engine details, bundling, deploy, cleaning source art.
6. `references/review-checklist.md` + `dna/checklist.md`: run both before showing anything.

## What ships inside
- `assets/template-grain/`: the starter (8 fps grain engine, 4 starter slides: grain title entrance, four grain cards, forest statement with hand-drawn underline, end). **Default.**
- `assets/template/`: the classic starter (M3 springs, live Milo, sounds, timers). Use when the deck is Milo-led or a game-like workshop.
- `assets/example-grain/`: Manan's masterclass "Make it without me", 17 slides. The reference for grain, match cuts, cursor, chat, particles, variable type.
- `assets/example/` (Save Me a Seat) and `assets/example-btm/` (Being There Matters): classic decks with Milo, crowds, timers, games.
- `scripts/`: `new_deck.sh` (scaffold), `extract_deck.py` (unpack a PDF/PPTX/SVG), QR decoding, PDF rendering, crowd voices.
- `dna/`: the shared Aha DNA, including `grain/grain.js` and `milo/web/milo.js`.

Fonts load from free hosts (Hedvig Letters Serif and Schoolbell from Google Fonts, Satoshi from Fontshare, Phosphor icons from unpkg). Nothing to install; the bundler embeds them.

## Workflow

### 0. Check the machine (first time only)
Quietly check and set up; ask only before anything needing a password or an account.
- `python3 -c "import PIL, pypdf"`; if it fails: `python3 -m pip install --user pillow pypdf`.
- `node --version` (needed for Vercel and password protection). If missing, tell the person to install Node from nodejs.org (LTS); presenting locally still works without it.
- macOS helpers in `scripts/` use built-in tools.

### 1. Understand the talk
If there's a source deck: `python3 -I <skill>/scripts/extract_deck.py "<file>" <scratch>/extract`, then look at the contact sheets and read `text.md`. Keep every heading word for word.
If there's only a brief: ask at most two questions you truly need (who's in the room, how long), then draft.

### 2. Plan, then build
Write a short slide-by-slide plan: heading, what happens on each click, background, grain family, which example slide it borrows from. Think about the room: a story beat needs one strong visual moment; a list needs one item per click; a statement needs a dark slide and a big line. 8 to 14 slides is typical. Share the plan in a few lines and keep going.

### 3. Scaffold
```bash
bash <skill>/scripts/new_deck.sh <folder-name> "<Deck Title>" [parent-dir] [port] [grain|classic]
```
This copies the template, sets the title and adds a preview entry so the Code tab's browser can open it (`preview_start` with that name).

### 4. Build the slides
For each slide, copy the closest example slide (markup, its `#s-id` CSS block, its `hooks['s-id']`), then change the content. Keep the engine parts of `deck.js` and the token block of `styles.css` as they are.
- Headings in Hedvig Letters Serif, 76px and up. Nothing under 26px.
- Grain for moments that matter (a hero shape, a card set, a statement field). Solids and white everywhere else.
- Use named transitions: match cuts (`data-vt`), circle wipes (background change), container transforms, particle morphs.
- Words you add that weren't in the source: few, and tell the person which.
- Drawings you invent are where reviews go worst: prefer grain shapes, Phosphor sticker icons and live Milo over hand-built illustrations.

### 5. Check like Manan
Open the preview, set the browser to 1200 × 675, walk every slide to its last step (`deck.goto(i, step)` in the console), screenshot each, check the console for errors, run both checklists. Fix and re-check before showing anyone.

### 6. Bundle and put it online
```bash
cd <deck> && python3 -I tools/bundle.py . dist/<name>.html
```
- Presenting from their own laptop: open `dist/<name>.html` in Chrome, F for full screen, arrow keys. Done.
- Online: ask once "public link or password?" before the first deploy. Then `cp dist/<name>.html deploy/index.html` (or `node tools/encrypt.mjs ...` for a password), and `cd deploy && npx -y vercel@latest deploy --prod --yes`. The first time, Vercel asks the person to log in in the browser; they do that themselves. Keep **one link** for the deck and redeploy to it every time. Delete the `.env.local` Vercel creates. Check the live link shows the new version.

### 7. Report
The link, then a short slide-by-slide list in plain words of what each slide does, what you invented, and what you couldn't check (sound, a real projector).

## Feedback
Feedback will be short and visual ("not centred?", "too much here", "why is this shaking"). Treat each as a rule: fix it on that slide, check every other slide for the same problem, and add it to `references/review-checklist.md`. Then rebuild, redeploy to the same link and say exactly what changed.

## When to send the person to Manan
If the deck needs something the DNA doesn't cover (a new illustration style, a new character pose, brand colours outside the families), or the same fix fails twice, say so plainly and suggest they bring it to Manan, so the skill can learn it for everyone.
