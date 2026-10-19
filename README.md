# Aha AI skills

Internal Claude skills for Aha. Keep this repo private: it contains our internal Milo and brand material.

| Skill | What it does |
| --- | --- |
| [`manans-interactive-deck`](skills/manans-interactive-deck/SKILL.md) | Turns any slide deck (PDF, PPTX, Keynote, Google Slides) into an interactive, arrow-key Aha presentation with live Milo, timers, games and sound, like Being There Matters and Save Me a Seat. |

## Install

You need the Claude desktop app (Code tab) or the Claude Code CLI, and access to this repo on GitHub.

### Option A: as a plugin (recommended, easy to update)

In a Claude Code session, run:

```
/plugin marketplace add aha-org/aha-ai-skills
/plugin install aha-skills@aha-ai-skills
```

To get updates later: `/plugin marketplace update aha-ai-skills`.

### Option B: copy the skill folder

```bash
git clone git@github.com:aha-org/aha-ai-skills.git ~/aha-ai-skills
mkdir -p ~/.claude/skills
ln -s ~/aha-ai-skills/skills/manans-interactive-deck ~/.claude/skills/manans-interactive-deck
```

To get updates later: `git -C ~/aha-ai-skills pull`.

Either way, start a **new** session afterwards (skills load when a session starts).

## Using manans-interactive-deck

### What you need

- A Mac (works best), with internet.
- Claude Code with the built-in browser, so Claude can check every slide.
- Your deck as a PDF (File > Export > PDF from PowerPoint, Keynote or Google Slides). A .pptx also works if LibreOffice is installed.
- If you can, the original illustrations as separate image files (transparent backgrounds). The result is much cleaner.
- Optional: a free Vercel account if you want a shareable link. Without it you still get a single HTML file you can present from your laptop.

No fonts (not even Satoshi) or Milo files need to be installed: everything ships with the skill or loads online.

### Make your presentation

Drag in your PDF (and any illustration files) and send something like:

> Use the manans-interactive-deck skill to turn this deck into an interactive Aha presentation. Keep every heading. It's for [audience / what the session is]. Activities: [e.g. slide 9 is a 7-minute group task with a twist at 2:30, slide 4 is a 30-second reflection]. Links: [what each QR code should open]. Make it [public / password-protected with the password ___].

Claude unpacks the deck, plans what each slide becomes, builds it, checks every slide in the browser, and gives you a link or a file.

### Review it like a designer

Open it full screen (press F) on a big screen and click through with the arrow keys. Tell Claude exactly what's off, slide by slide, for example:

- "slide 6: Milo is covering the subtitle"
- "slide 12: the timer isn't centred"
- "too much on slide 9, give it space"
- "the sound on slide 15 is too loud"

It fixes and redeploys each round. Expect 2-4 rounds for a great result.

### Present

- Arrow keys or a clicker: next and back. F: full screen. S: sound on/off.
- Press any key once before you start so the sounds can play.
- Timers start when you press the arrow, not on their own.

## Adding a skill

Put it in `skills/<skill-name>/` with a `SKILL.md` (frontmatter `name` + `description`) and any `references/`, `scripts/` and `assets/` it needs, then add a row to the table above.
