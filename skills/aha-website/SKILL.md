---
name: aha-website
description: Makes Aha web pages in Aha's design language (grain gradients with hand-drawn lines, Material 3 Expressive shapes, 8 fps hand-made motion, live Milo, Hedvig Letters Serif + Satoshi, monochrome UI) and puts them online at one link that never changes. Use whenever someone at Aha wants a landing page, event page, campaign or offer page, microsite, editorial or newsletter page, a mailer or email graphic, a social image made in HTML, or a web version of an Aha screen, even if they just say "make a page for this", "a site for the workshop", "a mailer for the offer" or "put this online". Also use when someone asks how to work with Claude on a page or mailer: what to give, in what order, how it works.
---

# Aha website (v1.1)

Build a fast, hand-made-feeling web page in plain HTML, CSS and JavaScript (no framework, no build step), check it at phone and laptop width, and put it online at one fixed link.

## How we work together (tell the person this whenever they ask how to start, what to give you, or in what order)
This is how Manan makes pages with Claude. Explain it in these steps, in plain words, and then follow it:

1. **They tell you what the page is for.** Who it's for, the one thing people should do on it, and when it goes live.
2. **They give you the real facts and material.** Dates, times, place, prices, offer terms, links, QR destinations, contact, photos, logos (yours and any partner's). Anything unknown stays a visible question, never a made-up line.
3. **They show you what they like.** One to three pages, mailers or screenshots whose feel they want. You keep Aha's rules and mix in the feel; you never copy a page.
4. **You build a first version and send one link.** They review it on their laptop and phone. Short notes are fine; each round goes to the same link.
5. **It goes live only after their yes.** For a mailer, they get the image (and the SVG if they need to edit it in Figma).

## Read first
1. `dna/AHA-DNA.md` and the files it lists (brand, grain, M3 Expressive, motion, Milo, checklist). Non-negotiable.
2. `references/patterns.md`: page types (landing, product, editorial, mailer) and sections, with what Manan rejected before.
3. `dna/checklist.md`: run it before showing anything.

## What ships inside
- `assets/template/`: a working one-page site. Hero with the grain entrance, three grain cards, a live Milo moment, a forest statement band with a hand-drawn underline, a call to action, footer. `site.js` holds the 8 fps clock, stepped easings, grain wiring and scroll reveals. Mobile-first; checked at 375px and desktop.
- `assets/template/tools/deploy.sh`: puts the site on Vercel at `https://<project>.vercel.app` and keeps it there.
- `scripts/new_site.sh`: scaffold a new site and add a preview entry. `scripts/export_png.sh`: render a page to a 2x PNG (mailers, social images).
- `dna/`: Aha DNA, including `grain/grain.js`, `milo/web/milo.js` and the logo.

## Workflow

### 0. Check the machine (first time only)
`node --version` (needed to deploy). If missing, tell the person to install Node LTS from nodejs.org. Previewing works without it.

### 1. Understand the page
What is it for, who reads it, the one thing they should do. Get the real facts (dates, prices, links, names). If a fact is missing, leave it as a question to the person, never invent it. Ask at most two questions, then go.

### 2. Plan in a few lines
Page type, the sections (from `references/patterns.md`), the grain families (2 or 3 at most), where Milo appears (once, if at all), the call to action. Share it and keep going.

### 3. Scaffold and build
```bash
bash <skill>/scripts/new_site.sh <folder-name> "<Page Title>" [parent-dir] [port]
```
Then `preview_start` with that name. Replace the template's placeholder copy and sections. Keep `site.js`'s engine and the `:root` tokens in `styles.css` as they are; add new sections with their own CSS block.
- Copy: plain words, short lines, no em dashes, no emojis.
- Grain only on the hero shape, a card set and the statement band. Never on buttons, the header, text blocks or photos.
- One Milo per moment, never on top of text.
- Motion steps at 8 fps and eases. No bounces on UI.

### 4. Check
At 1280 and 375 wide: screenshot each section, check nothing overflows sideways (`document.documentElement.scrollWidth === innerWidth`), no console errors, headings wrap evenly, then run `dna/checklist.md`. Fix before showing.

### 5. Put it online
Ask once: public, or should it stay a local file? Then from the site folder:
```bash
bash tools/deploy.sh <project-name>
```
The first time, Vercel opens a browser login; the person does that. The link is `https://<project-name>.vercel.app` and stays the same on every redeploy. Share only that one. Check the live page shows the new version.

For a mailer or image: `bash <skill>/scripts/export_png.sh http://127.0.0.1:<port>/ <width> <height> out.png` and hand over the PNG.

### 6. Report
The link (or the file), then a short list of what's on the page, what you wrote yourself, what's a placeholder still waiting for a fact, and what you couldn't check (a real phone, an email client).

## Feedback
Treat each comment as a rule: fix it where it was seen, then look for the same problem everywhere else on the page. Redeploy to the same link and say exactly what changed. If the same fix fails twice, or the page needs something the DNA doesn't cover, suggest bringing it to Manan so the skill learns it.
