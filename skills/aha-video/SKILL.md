---
name: aha-video
description: Makes Aha videos in Remotion (code-built video) in Aha's language (light mode, footage first, word-by-word captions, grain gradients with hand-drawn lines, Material 3 Expressive shapes, graphics stepped at 10 fps, live Milo) and renders them to MP4. Use whenever someone at Aha wants a reel, short, testimonial or interview cut, explainer, product or app walkthrough video, TV or event loop, animated Milo moment, or wants to recreate a reference animation, even if they just say "make a video from this footage", "cut this interview into a reel", "animate this", or "a loop for the screen at the event". Also use when someone asks how to work with Claude on a video: what to give, in what order, how it works.
---

# Aha video (v1.1)

Build videos as code with Remotion: every frame is a function of time, so anything can be previewed, checked frame by frame, changed and re-rendered. Output: an MP4 (plus stills for review).

## How we work together (tell the person this whenever they ask how to start, what to give you, or in what order)
This is how Manan makes videos with Claude (the Cars24 reel was made exactly this way). Explain it in these four steps, in plain words, and then follow it:

1. **They share all the footage.** Every video and photo from the day, the original files from the phone or camera (AirDrop or a Drive folder; not screen recordings, not WhatsApp-compressed copies if the originals exist). Also any reel or song they'd like it to feel like.
2. **They tell you what happened and how the story should go.** What they did there, who was there, what people said, how it turned out. Then the direction for the script: it must be understandable and relatable to anyone scrolling, with a hook in the first 3 seconds that makes people stop, and the music they want. You write the script from this (short everyday lines, the hook first, one line that asks people to act at the end), show it, and change it until they say yes. Pick the music with them.
3. **You match the beats and use an AI voice.** Every line gets a placeholder AI voice, the music gets a beat grid, every line starts on a beat and every cut lands on a beat, captions run word by word, the music dips under the voice. You send a draft video to review the edit, the pacing and the words. They give notes; you fix and re-render.
4. **They send the real voices, and you swap them in.** The people who were actually there record their lines (one recording per line, reading the script; phone voice notes are fine, a quiet room is better). You transcribe them, put each one in place of its AI line, clean the sound, re-time the captions and the beats, and render the final video.

Things to say up front: footage first (no footage, no reel); the AI voice is only a placeholder and never ships; faces of people who didn't agree to be in it get covered and names on screens get hidden; you'll tell them exactly which sounds and music are in.

## Read first
1. `dna/AHA-DNA.md` and the files it lists (brand, grain, M3 Expressive, motion, Milo, checklist). Non-negotiable.
2. `references/video-rules.md`: reel rules, sound, motion in video, copying a reference, patterns that worked, the Remotion licence.
3. `dna/checklist.md`: run it before showing anything.

## What ships inside
- `assets/starter/`: a Remotion project (pinned to Remotion 4.0.533).
  - `src/Moment.tsx`: an animated moment (grain entrance, a line word by word, Milo noticing). The pattern for pieces without footage.
  - `src/Narrated.tsx`: a narrated reel (footage cut on the music's beats, a voice line on a beat, captions word by word, music dipping under the voice, end card), driven by `public/timeline.json`. The workflow above runs on this.
  - `src/Reel.tsx`: an interview reel (cut clips with punch-ins, captions word by word, hook title, end card), driven by `public/edit.json`.
  - `src/grain/Grain.tsx`: `<GrainShape shape="cookie" size={420} spin />` and `<GrainField family="forest" .../>`, the same grain as the web.
  - `src/milo/`: Milo for Remotion (`<Milo x y size color eyes deform lift />`).
  - `src/motion.ts` (stepped clock, eases, focus entrance), `src/Words.tsx` (word-by-word text), `src/shapes.ts` (M3 shapes and morphs), `src/theme.ts`, `src/fonts.ts` (Hedvig, Satoshi, Schoolbell from their free hosts).
  - `script.json`: the narrated reel's lines (each with an id), the AI voice, the music file, the shots.
  - `tools/`: `setup.sh` (one-time Python tools). Narrated reel: `voice.py` (AI voice per line), `beats.py` (the music's beat grid), `plan.py` (lines and cuts on the beats → `public/timeline.json`), `transcribe_takes.py` + `real_voice.py` (the real voices in place of the AI). Interview reel: `transcribe.py`, `cut.py`, `segments.json`, `fixes.json`.
- `dna/`: Aha DNA, including the Milo bible and references.

## Workflow

### 0. Check the machine (first time only)
- `node --version` must be 18 or newer. If missing, ask the person to install Node LTS from nodejs.org.
- For reels with voice: `python3 --version`, then `bash tools/setup.sh` inside the project (installs the AI voice, Whisper and audio tools in a local `.venv`).
- Mention the Remotion company licence once if nobody has confirmed it.

### 1. Understand the video
What it's for, where it plays (Instagram, a TV, a talk), how long, who speaks. Get the footage and the real words first. No footage for a reel = stop and ask for it.

### 2. Plan it as a timeline
Write a short beat list with times: the hook (first 3 s), each beat, the end. Say which shots are footage, which are animation, where the music rises and drops. Share it and keep going.

### 3. Start the project
```bash
cp -R <skill>/assets/starter <parent>/<video-name> && cd <parent>/<video-name> && npm install
npx remotion studio
```
The studio opens in the browser; use the Code tab's browser pane to watch it.

### 4. Build
- **Narrated reel (the four-step workflow):**
  1. Footage into `public/media/` (keep the original names), the song into `footage/music/`. Make a contact sheet of the footage and look at every shot before writing anything.
  2. Script into `script.json`: one entry per line with a short `id`. Set `music`, `musicOffset` (where in the song to start) and `shots` (file + `in` seconds, in story order). Get a yes on the words before going on.
  3. `.venv/bin/python tools/voice.py`, then `tools/beats.py`, then `tools/plan.py`. Preview `Narrated` in the studio, render a draft. Shots that need a specific moment: adjust `in`; a tighter edit: lower `beatsPerShot`.
  4. Real recordings into `footage/voice_raw/`. `.venv/bin/python tools/transcribe_takes.py` prints what each says; set `"take": "voice_raw/<file>"` on the matching line in `script.json` (and `"speed": 1.1` if a take runs long). Then `tools/real_voice.py` and `tools/plan.py` again, and render the final. Lines without a take keep the AI voice; say which ones in your report.
- **Interview reel:** put the video at `footage/source.mp4`. Run `.venv/bin/python tools/cut.py --prep`, then `.venv/bin/python tools/transcribe.py footage/source16k.wav footage/transcript.json medium`. Read the transcript, pick the story beats into `tools/segments.json` (source in/out seconds, hook first), add mishearings to `tools/fixes.json`, run `.venv/bin/python tools/cut.py`. Then edit the hook and end lines at the top of `src/Reel.tsx`.
- **Animated piece:** copy `src/Moment.tsx` as a new composition, register it in `src/Root.tsx`, build beat by beat. Shapes and graphics use `step()`; text uses `Words`; Milo moves smoothly.
- **Landscape (TV, decks):** add a 1920 × 1080 composition in `Root.tsx`.
- Keep every duration as a named number at the top of the file, so timing is easy to change.

### 5. Check
Render stills at the key beats (`npx remotion still <Comp> out/check-<n>.png --frame=<n>`), look at each one, and run `dna/checklist.md` and `references/video-rules.md`. Fix, then render:
```bash
npx remotion render <Comp> out/<name>.mp4
```
For QR codes or fine grain, add `--crf=4`.

### 6. Report
Where the MP4 is, the beat list with times, what's real and what's a placeholder (voice, music), which sounds are in, and what you couldn't check (how it plays on a phone, loudness on the TV).

## Feedback
Treat each note as a rule: fix it where it was seen, check the rest of the video for the same thing, re-render, and say exactly what changed (with the times). If the same fix fails twice, or the video needs something the DNA doesn't cover, suggest bringing it to Manan so the skill learns it.
