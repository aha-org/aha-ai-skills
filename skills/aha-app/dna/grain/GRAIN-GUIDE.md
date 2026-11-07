# Aha grain shapes: the guide

Approved by Manan on 2026-10-29. The live reference is `grain-study.html` in this folder: open it in a browser and read the code. The screenshot `grain-study-v2.jpg` sits next to it.

Before using a shape anywhere, write down WHY it goes there. If there is no reason, it doesn't go there.

## What it is
**The language is the grain gradient WITH lines inside it (Manan, 2026-10-29).** The four shapes (pentagon, diamond, sun, leaf) are only the first examples, not the system. Any form can carry it: blocks, illustrations, hero areas, stickers, slide backgrounds, new shapes. What makes it Aha is two tones blended by grain, lit from the top left, with lines running through the colour.

Shapes whose two colours are blended only by grain. No smooth gradients and no grey noise filter. It looks like airbrush or risograph print.

The references were a grainy folder ad, a pointillist crowd, small grain-shaded shapes with lines inside them, and the Colorem exhibition loop.

## The rules
1. **The grain is the blend.** Each shape uses two tones from one palette family, mixed with coloured dots of about 1.5 px:
   - blush #F4668E to #A51D55
   - sky #7BA6DE to cobalt #3B55C9
   - sun #F1C93F to tangerine #DE561C
   - lime #AEC123 to leaf #4F7A2C
   - Never three colours. Never purple, pink and cyan mesh blobs. No glow, no glass.
2. **Gradients live on objects, not backgrounds.**
   - Each shape is lit from the TOP LEFT. Most of it is the light tone, and it deepens toward the bottom right.
   - The page behind stays flat cream #FDFBF7.
3. **Every gradient has lines inside it**, whatever form it takes. For the first shapes:
   - pentagon: three arcs from the bottom-right corner
   - diamond: two light lines parallel to the top-right edge
   - sun (9-scallop cookie): two wavy arcs on the bottom-right shadow side, following the scallops
   - leaf: a midrib plus side veins
   - The lines are drawn in the shape's own deep tone, or lifted toward cream on the diamond.
   - **The lines are drawn by hand** (Manan, 2026-10-29: "a little not perfect, a little scribbly"). It should look like a steady hand, not a shaky one:
     - each line wanders slowly off its path, by about 1 to 1.5 px
     - it presses harder in the middle and lifts at the ends
     - it runs a touch past where it should stop
     - one line per piece is gone over twice, shorter and thinner
     - on pieces that move, the lines redraw a little on each boil; on pieces that hold still, the lines hold still
     - never perfect geometric strokes, never a jittery wiggle
4. **One sharp shape per screen.** Any others are blurred copies of it further back, for depth.
5. **Never use it on** buttons, chips, cards (except the ones Manan picks, like Home's booked session), inputs, anything behind body text, or ON therapist photos (the person is the star; a cut-out person may stand IN FRONT of it, as on Home). It is never full-screen wallpaper inside the app.
6. **Milo stays flat.** Whether he gets grain is still undecided.

## Motion
- **Frame rate:** 8 to 12 fps only. Shape motion is stepped, like hand animation, not smooth 60 fps. The grain re-draws at the same rate ("boils"), so it shimmers.
- **Easing:** eases only. Never a spring or a bounce.
- **Idle:** shapes float and tilt slowly, each on its own phase.
- **Entrance:**
  1. The blurred copies drift in.
  2. The main shape comes into focus from a blur, turning a little as it settles.
  3. The title comes into focus line by line.
  4. The rest rises in.
- **Leaving:** a focus pull back out.
- **The sun can turn on its own axis** (one turn about every 24 s) while the LIGHT STAYS FIXED. Paint the shading once on a square and cut the turned outline out of it each frame. Its arcs stay on the shadow side; full rings that turn with it were rejected.

## Where it goes: the map (Manan, 2026-10-29)
Don't fill the app with it. Most screens have none, and that's on purpose.

**The test.** Grain is for a PERSON you're about to meet, or a MOMENT that matters. If a screen shows neither, it gets no grain.

**The budget.**
- At most one grain piece per screen.
- No bigger than about a quarter of the screen.
- Never in anything that repeats, like lists or grids.
- Never on two screens in a row in the same flow.

### Using it (built)
| Where | Why |
|---|---|
| Therapist profile, the Meet block | You're meeting a person. The colour frames their face, and the photo stays clean. |
| Home, the booked session card (the person stands cut out in it) | Your next time with a person. It's the one bit of colour on Home. |
| Booking confirmed, "You're booked" (src/booking/Booked.tsx; it replaced the receipt printer) | The biggest moment in the app. One sharp sun turning at the top, two soft copies behind it. |

### Could use it (each one needs Manan's go first)
| Where | Why |
|---|---|
| "Milo found your matches" | A moment of relief after the questions. |
| Empty states (no sessions yet, no matches) | Warmth where there is nothing else. |
| Marketing: decks, reels, mailers, social posts, The Optimist | It can be bolder there. |

### Never
| Where | Why |
|---|---|
| Nav bar, buttons, chips, filters, inputs, toggles, selected states | The UI stays monochrome. Colour is only for illustration. |
| Care's list of therapist cards | It repeats, so it would turn into wallpaper, and colouring some people over others breaks the card rules. |
| The chat with Milo | Conversations can be heavy. Nothing decorative sits next to someone's distress. |
| Sign in, OTP, payment, slide to pay | Trust and focus. Nothing pulls the eye from what you're agreeing to. |
| The daily log canvas | It's their drawing. Their page stays theirs. |
| On a photo, or behind paragraphs of text | The person is the star, and body text must stay easy to read. A title or name on a soft tone is fine. |
| Milo himself | He stays flat. |

### Left empty on purpose
| Where | Why |
|---|---|
| Top of Home (the greeting) | It breathes. With no session booked, Home has no grain at all. Colour arrives when a person does. |
| Top of Care | Tried and rejected. |
| Behind the therapist's photo | Tried and rejected. |
| Onboarding | Milo is the colour there. Two colour systems would fight. |
| The You tab | Calm and personal. Only an empty state could ever earn it. |

**Adding a new place.** Write down which test it passes (person or moment) and what it replaces on that screen. Then show Manan before building it.

**In marketing:** decks, reels, mailers, social posts and The Optimist. These can be bolder, for example the Colorem-style drift behind slides.
