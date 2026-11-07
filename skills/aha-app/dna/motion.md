# Motion

## The feel
- **Stepped, like hand animation.** Shape and illustration motion runs at **8 to 12 fps** (the masterclass deck uses 8). Everything that moves on a page shares one clock so it lands on the same frames. Grain re-draws on the same beat ("boils") from about three pre-painted frames.
- **Eases, not springs,** in product UI. No random bounces, no zoom-in badges, no overshooting ticks. (Manan: bounce reads childish on a calm wellness app.) Milo's own character motion (hops, squash) is the exception. A bounce happens only where Manan asks for one.
- **One idea per click** in presentations; one moment per screen in the app.
- **Nothing runs forever in the eye line** unless it is the point (a living word, a turning sun).

## Entrances (the grain entrance, approved)
1. Soft blurred copies drift in.
2. The main shape comes into focus from a blur, turning a little as it settles.
3. The title comes into focus line by line.
4. Everything else rises in.

**Leaving:** a focus pull back out.

## Transitions people notice
Use obvious, named transitions: **match cuts** (the same object carries across two screens and morphs), **shape wipes** (a circle from a corner), **container transforms** (a button that grows into a card), **particle morphs** (one word turns to dust and rebuilds as the next). Not vague cross-fades.

## Specific rules from Manan
- Text appears word by word or line by line, calmly (fade + small rise, words hold their space). No scale slams, no tilted pop-ins.
- A turning sun keeps its **light fixed** at the top left while the outline turns; its lines stay on the shadow side.
- Chat: a sent message fades and rises a little as the thread glides up. No flying bubbles.
- Camera in video: push in on what's about to be clicked, zoom out on the click. Never follow the cursor.
- "Slow fps" in video means graphics stepped evenly (for example 20 fps on a 60 fps timeline, 3-frame holds), never uneven.
- Haptics come from timing: keep every duration as a named token so haptics can be derived from it.

## Easing curves (all ease-only)
- out: `1 - (1 - t)^4` (entrances)
- in-out: quartic (moves, match cuts)
- soft: quadratic in-out (walking, floating)
Stepped versions for CSS are generated at runtime (`linear()` with held frames); see the deck engine.
