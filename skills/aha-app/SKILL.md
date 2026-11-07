---
name: aha-app
description: Designs and builds Aha app screens, flows and interaction moments in the app's own stack (React Native + Expo, Skia, Reanimated) following Aha's app rules (monochrome UI, outlined primary buttons, caret-in-circle back, eases not springs, crisp haptics, one grain moment per screen, live Milo), then runs them in the browser and on a phone through Expo Go. Use whenever someone at Aha wants a new app screen or flow, a prototype of a feature, an interaction or animation study for the app, a change to the Aha app prototype, or says "make this screen", "prototype this flow", "how would this feel in the app", or shares a Figma frame of the app to build. Also use when someone asks how to work with Claude on an app screen: what to give, in what order, how it works.
---

# Aha app (v1.1)

Build app screens the way the Aha prototype is built: React Native with Expo, laid out on the 390 × 844 Figma frame, Milo and grain drawn with Skia, motion with Reanimated, a haptic on every press. The result runs in the browser for quick checks and on a real phone through Expo Go. It is a prototype for feel, flow and motion that developers port into the product.

## How we work together (tell the person this whenever they ask how to start, what to give you, or in what order)
This is how Manan makes app screens with Claude. Explain it in these steps, in plain words, and then follow it:

1. **They share the design or the idea.** The Figma frame link (best), or a sketch, a screenshot or a description. Plus where the screen sits in the flow: what comes before it and after it.
2. **They share how it should feel.** References (apps, videos, Dribbble shots) for the motion and the moment. You agree on the direction in words before building anything big; Manan's rule is discuss first, build after the go.
3. **You build it in the app prototype.** You show it in the browser at phone size and send the Expo Go QR so they can try it on their own phone.
4. **They try it on the phone and give notes on the feel.** Timing, motion, haptics, words. You fix and they try again. Each round is saved with a note of what they asked for.
5. **Hand-off.** The branch or folder it lives in, what's placeholder, and what a developer needs to know to build it for real.

## Read first
1. `dna/AHA-DNA.md` and the files it lists (brand, grain, M3 Expressive, motion, Milo, checklist). Non-negotiable.
2. `references/app-rules.md`: the app's own rules (stack, look, grain placement, motion, haptics, chat, booking, data). Stricter than marketing.
3. `dna/checklist.md`: run it before showing anything.

## What ships inside
- `assets/kit/src/`: the building blocks from the Aha prototype.
  - `theme.ts` (DLS tokens, fonts, layout), `stage.tsx` (`FitStage`: the 390 × 844 frame on any phone), `timing.ts` (`EASE`, durations), `haptics.ts` (named haptics).
  - `ui/kit.tsx` (`AhaButton`, `BackButton`, `PressScale`, `XIcon`, `CheckIcon`, `AhaTextField`, `ScreenTitle`, `HintText`), `ui/text.tsx`, `ui/press.tsx`, `ui/hand.tsx` (hand-drawn icons and outlines).
  - `grain/GrainShape.tsx` (`GrainSun`, `GrainBlock`), `milo/` (`<Milo base size alive />`, his body, eyes, life).
  - `screens/Booked.tsx`: "You're booked", the reference screen (grain entrance, lines rising, outlined buttons, the calendar thumbs up).
- `assets/kit/App.tsx`, `index.web.ts`: a runnable starter.
- `scripts/new_app.sh`: makes a fresh Expo app with the kit (when the team prototype isn't available).
- `dna/`: Aha DNA, including the Milo bible and the grain study.

## Workflow

### 0. Where to build
**First choice: the team prototype**, `github.com/aha-org/aha-app-prototype` (private). It has the whole app (onboarding, home, Care, Milo chat, booking) and every pattern. Check access with `gh repo view aha-org/aha-app-prototype`. If it works: clone it, create a branch for this work, read its `README.md` and `AGENTS.md`, and build there. Never push to `main`; ask before pushing a branch or opening a pull request.
If `gh` isn't installed or logged in, or there's no access: tell the person once (Manan can add them), and meanwhile use the fresh app:
```bash
bash <skill>/scripts/new_app.sh <folder-name> [parent-dir]
```

### 1. Check the machine (first time only)
- `node --version` must be 20 or newer. If missing, ask the person to install Node LTS from nodejs.org.
- For the phone: the **Expo Go** app (App Store / Play Store), on the same Wi-Fi as the laptop (or use `npx expo start --tunnel`).

### 2. Understand the screen
What moment is it, where does it sit in the flow, what comes before and after. If there's a Figma frame, follow it exactly (Figma is read-only: never edit or delete anything there). If not, describe the layout in a few lines and how it moves, and share that before building anything big. Manan's bar: discuss direction with references before iterating on visuals.

### 3. Build
- One screen per file in the right folder; compose from the kit; tokens from `theme.ts`, never raw hex in components.
- Grain only if the screen is a person you're about to meet or a moment that matters, and only one piece.
- Motion: `withTiming` + `EASE`, durations from `timing.ts`. Milo's motion only for Milo.
- A haptic on every press and on the frame each important thing lands.
- `npx tsc --noEmit` must pass.

### 4. Check
- Browser: `npx expo start --web` (add an entry to `.claude/launch.json` and use `preview_start`), set the browser to phone size (375 × 812), walk the flow, check the console. Wait for animations if the pane is hidden.
- Phone: `npx expo start`, scan the QR (iPhone: Camera app; Android: inside Expo Go). Ask the person to try it, because haptics and real performance only show there.
- Run `references/app-rules.md` and `dna/checklist.md` against every screen.
- Stop the dev server when done.

### 5. Report
What you built (screen by screen, in plain words), how to open it (web link on this laptop, Expo Go QR), what's placeholder, what you couldn't check (haptics, Android, a real phone), and the branch or folder it lives in.

## Feedback
Treat each note as a rule: fix it where it was seen and check every other screen for the same thing. Commit each round with a message that says what Manan asked for. If the same fix fails twice, or the screen needs something the DNA and app rules don't cover, suggest bringing it to Manan so the skill learns it.
