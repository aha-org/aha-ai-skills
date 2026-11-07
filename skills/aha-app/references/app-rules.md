# Aha app rules

The app is calmer than anything else Aha makes. Everything here is a decision Manan made while testing on real phones.

## Stack
- React Native with Expo (the team's codebase is React Native). Skia draws Milo and grain; Reanimated runs motion; `expo-haptics` for haptics.
- Every screen is laid out on the Figma frame, **390 × 844 points**, and scaled evenly to fit the phone (`src/stage.tsx`, `FitStage`). Content starts 56pt from the top, 16pt sides (`LAYOUT`).
- Always import `Text` and `TextInput` from `src/ui/text.tsx`, not from `react-native` (ignores the phone's font scaling so a fixed layout can't break, and fixes Android padding).
- Every press uses `HapticPressable` (`src/ui/press.tsx`) or `PressScale`/`AhaButton` (`src/ui/kit.tsx`), so every button has its "tak tak".
- All durations in `src/timing.ts`. Haptics are timed from the same numbers.
- `npx expo install <pkg>` to add libraries (it picks versions that match the Expo SDK). Expo changes every SDK: check the versioned docs (docs.expo.dev/llms.txt) instead of memory.
- Expo Go only has its bundled native modules. Anything else needs a development build.

## Look
- **Monochrome UI.** No coloured buttons, chips, badges or selected states. Selection = a `#202020` border. Colour lives in Milo, illustrations and grain moments.
- **Primary button:** `backgroundSecondary` fill, 1px ink stroke, ink text (`AhaButton kind="primary"`). Never black-filled, never green-filled.
- **Back:** `BackButton` (Phosphor CaretCircleLeft, a chevron in a circle) everywhere. Close stays an X.
- **Icons:** Phosphor only (or the hand-drawn set in `src/ui/hand.tsx` where the screen is hand-drawn, like the camera).
- **Type:** Satoshi for UI (Regular, Medium, Bold), Schoolbell only for handwriting (Milo's notes, the journal). Hedvig Letters Serif for big headings where the Figma design uses it.
- `backgroundTertiary` sparingly; Manan dislikes it everywhere.
- Provider cards: five things only (name first, years, expertise, next slot, price; price never the biggest). No per-provider colours. Real people's photos as cut-outs only where the design calls for it.

## Grain in the app (one per screen, at most)
Only for **a person you're about to meet or a moment that matters**, at most about a quarter of the screen, never in repeats.
- Built: the therapist profile's Meet block (`GrainBlock` with arcs), the booked session card on Home (a cut-out person in a meadow `GrainBlock`), "You're booked" (`GrainSun` + two soft copies).
- Candidates (ask Manan first): matches found, empty states.
- **Never:** nav bar (not even the selected tab), controls, the Care list, Milo chat, sign-in, payment, the daily log canvas, behind photos, on Milo.
- Left empty on purpose: Home top when nothing is booked, Care top, onboarding, You.
- The grain clock steps at 10 fps. On phones, build grain paths on the JS thread (React state clock + `useMemo`), **never inside Reanimated worklets** (that crashed Expo Go on iPhone).

## Motion
- **Eases, never springs** for UI: `withTiming` + `EASE`, layout with `LinearTransition.duration(...)`, never `springify`. No popping badges, no overshooting ticks, no bouncing entrances.
- Milo's own motion (hops, squash, waves, the long-press Easter egg) is the exception.
- Text rises in line by line (`FadeInDown.duration(600).easing(EASE.out)`), staggered about 140ms.
- One moment per screen.

## Haptics
- Buttons: hard, crisp "tak" down and "tak" up (iOS Rigid), never soft buzzes.
- Name every haptic by the moment it marks (`src/haptics.ts`), and fire it on the frame the thing lands.
- Haptics only work on a real phone; say so when you can't test them.

## Milo chat
- Mine: brand green bubbles with light text. Milo's: `backgroundSecondary`.
- Sending: the message fades and rises a little as the thread glides up. No flying bubbles.
- Reactions are real emoji (six quick ones + the full set). Milo reacts only to light or good moments (thanks, a joke, feeling calmer, a booking), **never** to someone sharing something hard.
- Milo's lines follow his voice (`dna/milo/MILO.md`). Crisis and symptom copy needs clinical sign-off before real users; say so.

## Booking
- Never a tap-a-slot inside chat. Chat shows the profile; booking is the full flow: profile → day and time → payment (pretend in prototypes; never invent a real charge or confirmation) → "You're booked" (`src/screens/Booked.tsx`) → the booked session card on Home.
- "Add to calendar" success: the button stays; a thumbs up grows in while it tips up, nods once with the success haptic, the words slide in beside it. Eased.

## Data
- Placeholder people and history are fictional and labelled as placeholders in your message (not on screen).
- Real provider data and real people's photos only with Manan's go, never in anything public.

## The machine
- Don't leave the Android emulator, Gradle or extra dev servers running; stop them when done (laptops overheat).
- On the web preview the animations crawl when the browser pane is hidden; wait or bring it forward before judging.
