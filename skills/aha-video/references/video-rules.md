# Video rules and patterns

Every rule here is something Manan said about a real video (the Save Me a Seat reel, the Rishihood explainer, the Aha Fellow testimonial, the Cars24 TV loop, the onboarding film).

## Reels (1080 × 1920, 30 fps)
- **Light mode.** Cream or white. Never dark.
- **Footage first.** The real people and the real room are the story. A draft with no real footage reads as a failure: get the media before building. Open on full-screen footage from frame one (a paper or framed opening looks like an ad and gets skipped).
- **Hook in the first 3 seconds.** No slow lead-in.
- **No labels on screen, ever.** No slot names, notes, "THE EXPERIMENT" stamps, not even on placeholders. A placeholder is a blank shape.
- **Captions word by word**, calm (fade + small rise, words hold their space so lines don't reflow), the newest word on brand green. No bounce, no overshoot, no scale slam, no tilted or rotating group pop-ins.
- **Captions only on the person speaking.** Not over animation.
- **Never shrink the speaker into a small window** over animation: cut fully between them and full-frame animation.
- **Vary the framing:** full-screen video, full-screen photo, 4:5, square, 16:9 strips, occasional cards. Never a run of the same treatment. Video clips over photos (a run of stills feels like a slideshow).
- **Pacing:** people must be able to read every line. Hold shots about 2 to 3 seconds; cut when a new phrase starts, not on every beat.
- Avoid shots full of empty chairs.
- **Script:** slow, everyday language about what people actually go through. The goal is that viewers understand what happened and why.

## Filming at a client's office or an event
- People who didn't agree to be in the video get their faces covered (a 😊 that follows the face). The team and people who agreed stay visible. Ask the person who's who.
- Names on screens (Slack, email, chat) are covered.
- Logos and brands of other companies only with their go.

## Sound
- When someone speaks, the music drops way down so it never fights the voice; short pauses between lines stay down (no surges); every move eases. `src/Narrated.tsx` does this.
- Room sound from the footage is usually muted: it jumps at every cut and reads as the audio cutting out. The song is the bed.
- One song, never two. Ups and downs with volume on the beat; short drop-outs for key lines; don't leave the voice bare for long.
- No added hits, booms or whooshes on top of the track. Keep sound effects minimal and list exactly which ones are in.
- No copyrighted music in anything public unless the team has the licence. Often Manan adds the music himself: deliver voice only and say so.
- Voice: the real person's voice. AI voice only as a labelled placeholder.

## Motion in video
- Graphics step evenly: 10 fps on a 30 fps timeline (3-frame holds) or 20 fps on 60. Never 20 on 30 (uneven = jittery). `src/motion.ts` `step()` does this.
- Footage, captions and camera moves stay smooth.
- Transitions are obvious and named: match cut, shape wipe, container transform, morph. Not subtle cross-fades.
- **Camera:** push in on the thing about to be clicked, zoom out on the click. Never follow the cursor.
- Eases only for UI and shapes; Milo's hops can overshoot softly.

## Copying a reference animation
When someone shares a reference video to match, copy it **one to one**, never from a description:
1. Extract frames at 15 fps with the ffmpeg inside Remotion:
   `DYLD_LIBRARY_PATH=node_modules/@remotion/compositor-darwin-arm64 node_modules/@remotion/compositor-darwin-arm64/ffmpeg -i ref.mp4 -r 15 work/ref_%04d.png`
2. Make numbered contact sheets and write down every beat: frame time, duration, easing, screen position.
3. Build it as a pure function of the frame, render stills at the same times (`npx remotion still <Comp> out/x.png --frame=N`) and compare side by side before showing anyone.
4. Say up front where Milo's proportions force a difference.
Screen recordings from the macOS screenshot tool's temp folder can't be read; ask for a copy on the Desktop.

## Patterns that worked
| Piece | What it did |
|---|---|
| Interview reel (Aha Fellow testimonial, 97 s from 3 min) | cold-open hook line, a second hook title up top, punch-ins between sections to hide jump cuts, slow drift on every clip, captions word by word, end card with one line and the logo. `src/Reel.tsx` + `tools/cut.py` |
| Workshop reel (Save Me a Seat) | footage first, cuts snapped to the music's beat grid, one music bed with volume moves, the real narrator's voice |
| Explainer with UI (Rishihood) | the logo, captions on her shots only, a cursor clicking Material 3 UI on grid paper at 20 fps, rotating M3 shapes, push-in on buttons |
| TV loop (Cars24, 30 s, 1920 × 1080, silent) | a hook question, M3 pattern tiles picked one by one, Milo's bubble, three steps, a QR that is always on screen and glides corner to centre and back so the loop is seamless. Render QR pieces with `--crf=4` so edges stay clean |
| Narrated activation reel (Cars24 x Milo, 56 s) | the hook is a real question asked in the room plus the room's answers, one beat of silence, then the groove; AI voice for every line first, then the real voices swapped in; footage cut on the beat; one grain moment for the list; shape wipes; employees' faces covered; three illustrative comments; end card with Milo. `src/Narrated.tsx` + `tools/voice.py`, `beats.py`, `plan.py`, `real_voice.py` |
| Animated moment (`src/Moment.tsx`) | the grain entrance (soft copies drift in, the sun focuses in turning), a line word by word, Milo noticing and one small hop |

## Remotion licence
Remotion is free for individuals and companies of up to 3 people. Aha is bigger, so the team needs a Remotion company licence for work videos (remotion.pro). If nobody has confirmed the licence, mention it once to the person.
