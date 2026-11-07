# Example: "Make it without me" (the masterclass deck)

The full 17-slide deck Manan presented to the team on 2026-10-29. It is the reference for the grain engine:
8 fps clock, stepped easings, match cuts (data-vt), grain shapes and fields, grain words, the walking cursor,
chat threads, voice notes, calls, notifications, a camera that pushes in, particle morphs between headings,
a variable-font living word, the skill drop with a grain border, the hand-off mail.

Not shipped: the voice notes, the phone sounds and the closing video (they were personal or not ours to share),
so those moments play silently and the last slide is empty. Read the code for how they work.

Find a slide's code by its id: markup in index.html (`<section id="s-...">`), styles under `#s-...` in styles.css,
motion in `hooks['s-...']` in deck.js.
