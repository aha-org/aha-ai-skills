MILO CHARACTER DNA + MOTION SYSTEM
Aha Mascot · Visual Reference Library · Remotion / Claude Code Specification
IMPORTANT: This document is intentionally reference-driven. The images embedded below are part of the specification. Claude should inspect the images together with the written rules. The images are not interchangeable examples; each demonstrates a different capability of the same character.
01 — Milo in one sentence
Milo is a soft, squishy, organic 2D character with a signature M-shaped silhouette, minimal black eyes, tactile matte gouache/paper rendering, and an iconic contact shadow — but his body is deliberately capable of dramatic deformation, color changes, temporary anatomy, object interaction and expressive motion.
02 — What is LOCKED vs. what is ELASTIC
LOCKED — identity
ELASTIC — expression
Milo's overall organic blob language
Body width, height and squash/stretch
Signature shallow M-like double-hump top silhouette
Silhouette deformation
Minimal black-eye visual language
Color state
Matte tactile 2D rendering
Eye shape / angle / size
Natural color = green
Temporary arms, hands, tails or other anatomy
Small soft contact shadow when grounded
Pose and orientation
No default human/animal anatomy
Interaction with props and environments
03 — The iconic Milo markers
The M curve — A soft, shallow double hump at the top. It is organic and imperfect, not a literal logo or two horns.
The eyes — Solid black shapes. No pupils, iris, sclera or glossy highlights. Emotion is created by reshaping the black forms.
The shadow — A small, soft, flattened oval directly beneath grounded Milo. It is a character signature, not generic lighting.
The squishy body — Milo feels physically soft and deformable even though the construction remains 2D.
The texture — Fine matte gouache/paper grain with restrained tonal variation. Tactile, not glossy or photorealistic.
04 — Milo's visual material
Think: soft bubble + hand-shaped clay-like softness + paper illustration, but NEVER render Milo as 3D clay, plastic, inflatable rubber, plush or a realistic object. The construction is flat 2D; the subtle tonal variation only gives the illustration tactile physicality.
Rendering rules: matte surface; subtle paper/gouache grain; restrained tonal variation; no specular highlights; no rim lights; no bevels; no realistic volumetric lighting; no glossy reflections; no heavy gradients.
05 — Color is an emotional state system
Green — Natural/default Milo.
Blue — Sad, vulnerable, emotionally low, calm depending on eye language.
Pink — Love / affection / infatuation.
Yellow — Confused or uncertain.
Orange — Alert / activated / heightened state.
Red — Angry / intense.
Color can change while the underlying character identity remains constant.
06 — Milo can change shape
Do NOT constrain Milo to one canonical silhouette. The references explicitly demonstrate that Milo can squash, flatten, stretch, lean, widen, elongate, grow temporary extensions, partially hide behind objects, and become extremely deformed. The test is not 'does the silhouette stay identical?' — the test is 'does the deformation still feel like Milo?'
07 — Temporary anatomy
Milo normally has no arms, legs or mouth. When a scene needs them, anatomy can organically emerge from the body. It should look grown/morphed from the blob, never pasted on as conventional cartoon anatomy.
Hands, when needed: extremely simplified V/triangle-like forms, no fingers, no realistic joints.
08 — Eye language
Happy / calm: soft upward curved closed eyes.
Sad: heavier, downward or drooping black shapes.
Love: pink/red heart-shaped or curved eye treatment is allowed when the reference calls for it.
Curious: asymmetric or altered eye geometry.
Alert: more open / compact / intense shapes.
Confused: asymmetry is useful.
Sleepy: relaxed horizontal or curved closed shapes.
09 — The iconic contact shadow
When Milo is grounded, the shadow should normally be present. It is a small, soft, horizontal flattened oval immediately under the body. It should be subtle and centered. It should communicate physical contact and weight.
Do not make it a large cast shadow.
Do not turn it into a beige smear.
Do not merge it into the paper texture.
Do not remove it casually.
During a jump: shadow can shrink/lighten.
During landing: shadow can briefly expand/darken, then settle.
10 — Motion language
Milo should move like a soft emotional mass, not a human actor. Preferred motion: squash/stretch, anticipation, elastic overshoot, wobble, soft acceleration, gentle settling, tiny secondary movement, weighty contact and organic deformation.
11 — Remotion system: build a Milo engine, not one-off animations
Claude Code should build reusable primitives so new Milo animations can be composed quickly.
Milo body renderer
Milo eye system
Milo color/emotion system
Milo contact-shadow system
Squash/stretch controller
Wobble / idle controller
Lean / tilt / deformation controller
Temporary anatomy / extension system
Object interaction system
Emotion presets
Grounded vs. airborne state
The implementation should make it possible to describe a scene such as 'green Milo becomes curious, leans forward, stretches one side toward the object, then settles' without rebuilding the character from scratch.
12 — Reference library
Each image below is an intentional visual reference. Claude should inspect the actual pixels, not rely only on the captions. Do not average all references into one pose. They demonstrate the range of Milo.
Reference 01 — Core Form / Green Milo
Baseline silhouette, M-curve, black eyes, green natural state.

Reference 02 — Squashed / Sleeping Milo
Shows that Milo can dramatically flatten and widen while remaining recognizably Milo.

Reference 03 — Milo in a Cinema / Prop Interaction
Shows Milo interacting with objects and environments; temporary anatomy is allowed.

Reference 04 — Pink / Love State
Shows color transformation plus emotion-specific eye treatment.

Reference 05 — Sleeping / Under Blanket
Shows partial occlusion and environmental storytelling while preserving Milo identity.

Reference 06 — Deformed / Waving Milo
Shows body deformation and expressive temporary protrusions.

Reference 07 — Orange / Fanta Interaction
Shows extreme stretching, long organic extensions and object interaction.

Reference 08 — Clean Green Milo
Useful baseline for proportions, color and restrained facial language.

Reference 09 — Green Milo / Gesture
Shows unusual silhouette deformation and minimal horizontal eyes.

Reference 10 — Blue Milo / Sad State
Shows blue emotional state and sad eye language.

Reference 11 — Green + Blue Emotional Interaction
Shows two Milos, emotional color coding, interaction and iconic grounding shadows.

13 — Hard failure modes
Milo becomes a frog/animal because a visual reference was used.
Milo becomes glossy 3D, clay, plastic, plush or inflatable.
The M curve becomes rigid, symmetrical or horn-like.
Eyes gain pupils, whites, highlights or conventional cartoon detail.
Milo's shadow disappears from grounded scenes.
Milo's body becomes mechanically geometric.
Temporary anatomy looks attached rather than organically grown.
Color changes alter Milo's identity rather than his emotional state.
Animation becomes mechanically smooth and loses soft physicality.
14 — Claude Code instruction
Use this document and the embedded reference images as the Milo source of truth. When there is tension between a generic animation best practice and Milo's established visual language, prioritize Milo. Build the system so that extreme variation is possible without losing the character's core identity.
15 — North star
Milo is not a fixed drawing. Milo is a visual language: one soft, tactile, emotionally expressive blob that can become almost anything through deformation, color, eyes, motion and interaction — while remaining unmistakably Milo.
