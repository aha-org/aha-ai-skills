# Engine, helpers, build and deploy

## Contents
1. Files
2. Slide markup
3. Hooks and helpers (deck.js)
4. Milo
5. Sound
6. Preview and verify
7. Cleaning illustrations from the source deck
8. Bundle and deploy
9. Gotchas

## 1. Files

```
<deck>/
  index.html   all slides (one <section class="slide"> each) + #brandmark, #progress, #hint
  styles.css   tokens + base system at the top, then one block per slide (search by #slide-id)
  deck.js      engine (top), slide hooks (middle), navigation (bottom)
  milo.js      live Milo (do not edit; shared)
  sound.js     Sfx: synthesised sounds + optional real clips (FILES)
  assets/      images/audio used by the deck (aha-logo-mask.png, clouds.webp, …)
  tools/       bundle.py (single-file build), encrypt.mjs (password page)
  dist/, deploy/  build output
```

## 2. Slide markup

```html
<section class="slide" id="s-example" data-steps="3" data-bg="green">
  <div class="head">
    <h2 class="split">Heading that rises word by word.</h2>
    <p class="lede rise" style="--d:4">One supporting line.</p>     <!-- --d = delay in 100ms units -->
  </div>
  <div class="tile" data-s="1">…appears on click 1…</div>
  <div data-milo="example"></div>                                    <!-- live Milo slot -->
</section>
```

- `data-steps` = number of clicks before the next slide. `data-s="N"` elements toggle `.on` when step ≥ N (rise in / out going back).
- `data-bg`: `green`, `forest` (also add `class="forest-slide"` for cream text), `peach`; default white.
- `data-bookend` hides progress + logo (title/close); `data-noprog`, `data-nomark` hide one.
- Bump `?v=N` on the CSS/JS links in index.html after edits, or the browser serves stale files.
- Navigation: → / Space / PageDown next, ← back, F full screen, S sound. `#7` in the URL opens slide 7; `?step=2#7` opens it at step 2 (for testing).

## 3. Hooks and helpers (deck.js)

```js
hooks['s-example'] = {
  enter(step, dir) {},   // slide became active (dir -1 when arriving backwards at its last step)
  step(n, dir) {},       // after every step change, including the initial one
  leave() {},            // stop timers, fade sounds
  key(e) { return false; } // return true to swallow a key
};
```

- `runId` / `alive(id)`: capture `const id = runId` in `enter`; loops check `alive(id)` and stop when the slide changes. For per-step async sequences use a local token (`const t = ++tk; … if (t !== tk) return;`).
- `mk(name, opts)` creates a Milo in `[data-milo="name"]`.
- `spawn(host, {x, y, size, mood, body, eyes, shadow})` places a Milo **by its feet** at (x, y) inside `host`; `put(w, x, y, instant)` moves it (CSS transition); `go2(w, x, y)` moves with a hop. Use these for crowds, groups and walking.
- `sticker(name)` returns sticker-icon HTML; `.stk-me` markup is converted on load.
- `confetti(el, n)` bursts from an element (use rarely).
- `ring(el)` returns `set(frac)` for a timer arc; `.shape-timer` paths are filled with the cookie outline automatically. `fmt(secs)` → "m:ss".
- `applyShapes(root)` clips `[data-shape]` elements to M3 shapes.
- `split()` runs on `.split` headings at load.
- `rnd(a, b)`, `wait(ms)`, `tween(obj, props, ms, ease)`, `E.*` easings come from MiloKit.

## 4. Milo

```js
const m = mk('name', { size: 120, mood: 'blue', eyes: 'sad', body: 'clean', follow: true, shadow: 1,
                        backdrop: { shape: 'cookie9', color: 'var(--green-tint)', size: 170 } });
m.hop(1, 20); m.beHappy(1600); m.setMood('green'); m.setEyes('happy'); m.morphTo('tall');
m.lookAt = { x: 3.4, y: 0 };      // null to release; follow:true tracks the pointer
m.lean = 6; m.squash = 1.2; m.lift = 10; m.idle = false;   // freeze a pose
```

- SVG box is 1.7 × size wide, 1.6 × size tall; the ground line is at 152/160 of the height; the body is ~1.07 × size tall. Centre shapes on the body: body centre y = groundY − 0.535 × size.
- Avoid `backdrop` shapes behind Milo inside timers (the timer outline is the shape).

## 5. Sound (sound.js → `window.Sfx`)

`step(dir)`, `slide(dir)`, `select()`, `stamp()`, `wrong()`, `pop()`, `chime()`, `paper()`, `receive()`, `send()`, `milo('hello'|'happy')` (hops are silent), `crowd(true|false)`, `crowdFar(bool)`, `toggle()`.
Real clips: add to `FILES` in sound.js (e.g. `crowd: 'assets/crowd.m4a'`); they decode after the first key press and are inlined by the bundler. Make a crowd loop with `scripts/make_crowd_voices.sh` + `scripts/mix_crowd.py` (macOS voices; no licensing issues).

## 6. Preview and verify

1. `bash scripts/new_deck.sh <folder> "<Title>"` adds a launch.json entry; start it with `preview_start {name}` and open `http://127.0.0.1:<port>/index.html?r=N#S` (use 127.0.0.1; change `r` to defeat caching).
2. The browser pane is narrow: `resize_window {width: 1200, height: 675}` before screenshots, reset to `desktop` after.
3. Jump with `deck.goto(slideIndex, step)` in `javascript_tool` (0-based index); wait ~2.5s for transitions before a screenshot, or the build blur shows.
4. Check `read_console_messages {onlyErrors: true}` after loading.
5. Read computed state with JS when a screenshot can't show it (timer offsets, classes).
6. Walk every slide at its final step and run `references/review-checklist.md`.

## 7. Cleaning illustrations from the source deck

- `scripts/extract_deck.py` pulls every embedded image (alpha kept). Google Slides SVG exports embed PNGs: same script.
- Images that were semi-transparent over a colour (e.g. a swirl texture) must be composited onto that colour before saving as JPG/WebP, or they turn dark.
- Removing a character drawn into a scene (e.g. Milo on a bench): replace the covered columns with clean columns from elsewhere in the same object, **warping vertically so outlines line up** (measure each outline's y at the left and right edge of the hole, interpolate across, map source edges to target edges piecewise). Plain tiling leaves visible breaks. Cut props you want to animate (a book) into their own layer with a polygon mask.
- Re-export QR codes as PNG at ~560px, quantised, and **decode the result** to confirm it still scans.

## 8. Bundle and deploy

```bash
python3 -I tools/bundle.py . dist/deck.html          # one file, everything inlined except Google Fonts
cp dist/deck.html deploy/index.html                  # public
# or password-protected:
node tools/encrypt.mjs dist/deck.html deploy/index.html '<password>'
cd deploy && npx -y vercel@latest project add <name> && npx -y vercel@latest link --yes --project <name>
npx -y vercel@latest deploy --prod --yes
rm -f .env.local                                     # the CLI writes a token file there; don't leave it around
```

- Ask the user before the first deploy whether it should be public or password-protected; deploying publishes it.
- `<name>.vercel.app` may be taken; Vercel then aliases something like `<name>-iota.vercel.app`. Extra `*.vercel.app` aliases set by hand sit behind deployment protection (302); use the production alias.
- Verify after deploy: `curl -s "<url>/?nc=$RANDOM" | grep -c '<something new>'`.

## 9. Gotchas

- `localhost` sometimes fails in the preview; `127.0.0.1` works.
- The macOS shell is zsh: `LINES` is reserved; run array-heavy scripts with `bash`.
- AAC (m4a) loops: Chrome trims encoder padding, but set `loopStart`/`loopEnd` a little inside anyway.
- When a slide's hook runs async sequences, guard against the presenter clicking fast or going back (tokens, `if (t !== tk) return`).
- A slide jumped to directly (`?step=`) skips earlier steps' animations; make `enter(n)` place things in their final state for step n.
