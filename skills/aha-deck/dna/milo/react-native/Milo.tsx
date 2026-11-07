import React, { useEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import { BlurMask, Canvas, Group, Oval, Path, Rect, Skia, useClock } from '@shopify/react-native-skia';
import { interpolateColor, useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { BODY_DATA } from './geometry';
import { buildFrame, CANVAS_UNITS } from './draw';
import { INK, LAND_AT, livePose, MOODS, WAVE_TOTAL, type MiloPose } from './life';
import { Haptic } from '../haptics';

/** Values the screen can drive frame by frame (falling stretch, wide eyes, the happy morph...). */
export type MiloDrive = {
  squash?: SharedValue<number>;
  eyeScale?: SharedValue<number>;
  blink?: SharedValue<number>;
  happiness?: SharedValue<number>;
  /** Where he looks (units), blended in while the notebook is out. */
  lookX?: SharedValue<number>;
  lookY?: SharedValue<number>;
  /** 0...1 notebook out, and 0...1 how much he has written in it. */
  notebook?: SharedValue<number>;
  write?: SharedValue<number>;
  /** 0...1 the notebook pushed aside, out to his left. */
  aside?: SharedValue<number>;
  /** 0...1 the notebook flipped open for writing. */
  open?: SharedValue<number>;
  /** Units of lean while the notebook is out (he turns to the side to look at the field). */
  turn?: SharedValue<number>;
  /** 0...1 the idea bulb, and 0...1 the overthinking rings. */
  bulb?: SharedValue<number>;
  rings?: SharedValue<number>;
  /** 0...1: the first-version body morphing into the Aha body. */
  morph?: SharedValue<number>;
  /** 0...1: he looks where lookX/lookY say even with no notebook out (e.g. watching a card). */
  gaze?: SharedValue<number>;
  /** 0...1: angry. `red` turns his body red, `fury` gives him angry eyes, `eyeRed` dark red eyes. */
  red?: SharedValue<number>;
  fury?: SharedValue<number>;
  eyeRed?: SharedValue<number>;
};

type Props = {
  base: MiloPose;
  /** Base width in points. The canvas adds room for hops, squash and the waving arm. */
  size: number;
  alive?: boolean;
  tappable?: boolean;
  /** Different seeds blink at different moments, so several Milos never move in unison. */
  seed?: number;
  /** Change to make him hop, as if tapped. */
  hopTrigger?: number;
  /** Change to make him wave. */
  waveTrigger?: number;
  drive?: MiloDrive;
  /** No haptics of his own (when two Milos move as one, only one of them buzzes). */
  quiet?: boolean;
  /**
   * A camera on him (the splash): the canvas is this size and he's drawn through `transform`, so
   * he can be zoomed right in and stay sharp (scaling the view would blow up a bitmap instead).
   */
  camera?: {
    width: number; height: number; transform: SharedValue<{ translateX: number; translateY: number; scale: number }>;
    /**
     * 0...1: his green drawn over him from `coverY` (units from the top of his drawing) down and out
     * to the edges: in a close-up it hides his darker lower edge and carries him off the bottom.
     */
    cover?: SharedValue<number>;
    coverY?: number;
    /** 0...1: the whole canvas behind him in his green (a close-up so near the screen is all Milo). */
    backdrop?: SharedValue<number>;
  };
};

/** A living Milo: breathes, blinks and glances; hops when tapped (haptics on press and landing). */
export function Milo({ base, size, alive = true, tappable = true, seed = 1, hopTrigger = 0, waveTrigger = 0, drive, quiet = false, camera }: Props) {
  const clock = useClock();
  const boopStart = useSharedValue(-1);
  const waveStart = useSharedValue(-1);
  const data = BODY_DATA[base.body];
  const colors = MOODS[base.mood];
  const u = size / 100;

  const squashSV = drive?.squash;
  const eyeScaleSV = drive?.eyeScale;
  const blinkSV = drive?.blink;
  const happySV = drive?.happiness;
  const lookXSV = drive?.lookX;
  const lookYSV = drive?.lookY;
  const notebookSV = drive?.notebook;
  const writeSV = drive?.write;
  const asideSV = drive?.aside;
  const turnSV = drive?.turn;
  const openSV = drive?.open;
  const bulbSV = drive?.bulb;
  const ringsSV = drive?.rings;
  const morphSV = drive?.morph;
  const gazeSV = drive?.gaze;
  const redSV = drive?.red;
  const furySV = drive?.fury;
  const eyeRedSV = drive?.eyeRed;

  const frame = useDerivedValue(() => {
    const now = clock.value / 1000;
    const p: MiloPose = { ...base };
    if (squashSV) p.squash = base.squash * squashSV.value;
    if (eyeScaleSV) p.eyeScale = eyeScaleSV.value;
    if (blinkSV) p.blink = Math.max(p.blink, blinkSV.value);
    if (happySV) p.happiness = Math.max(p.happiness, happySV.value);
    const boopAge = boopStart.value >= 0 ? now - boopStart.value : -1;
    const waveAge = waveStart.value >= 0 ? now - waveStart.value : -1;
    if (notebookSV) p.notebook = notebookSV.value;
    if (writeSV) p.write = writeSV.value;
    if (asideSV) p.aside = asideSV.value;
    if (openSV) p.open = openSV.value;
    if (bulbSV) p.bulb = bulbSV.value;
    if (morphSV) p.morph = morphSV.value;
    if (furySV) p.anger = furySV.value;
    if (ringsSV) {
      p.rings = ringsSV.value;
      p.spin = now * 3.2;
    }
    const pose = livePose(p, now + seed * 3.1, alive, boopAge, seed, waveAge);
    // While the notebook is out he looks where the screen tells him (the field, or his writing).
    const nb = Math.min(1, Math.max(0, p.notebook));
    const look = Math.max(nb, gazeSV ? Math.min(1, Math.max(0, gazeSV.value)) : 0);
    if (look > 0 && lookXSV && lookYSV) {
      pose.lookX = pose.lookX * (1 - look) + lookXSV.value * look;
      pose.lookY = pose.lookY * (1 - look) + lookYSV.value * look;
      // His own glances' lean gives way to the screen's (turning to the field, leaning after a card).
      pose.lean *= 1 - look;
      if (turnSV) pose.lean += turnSV.value * look;
    }
    return buildFrame(data, pose, size, colors.side);
  });

  const silhouette = useDerivedValue(() => frame.value.silhouette);
  const face = useDerivedValue(() => frame.value.face);
  const plane = useDerivedValue(() => frame.value.plane);
  const planeOpacity = useDerivedValue(() => frame.value.planeOpacity);
  // Under the face: the band colour for the first version, the body colour for the Aha body (and
  // in between while morphing, so no dark rim is left at the end).
  // His colours: green, or red when he's angry (the long-press Easter egg).
  const bodyColor = useDerivedValue(() => interpolateColor(redSV ? redSV.value : 0, [0, 1], [colors.body, MOODS.red.body]));
  const sideColor = useDerivedValue(() => interpolateColor(redSV ? redSV.value : 0, [0, 1], [colors.side, MOODS.red.side]));
  const under = useDerivedValue(() => (data.plane ? bodyColor.value : interpolateColor(frame.value.morph, [0, 1], [sideColor.value, bodyColor.value])));
  const eyesFill = useDerivedValue(() => frame.value.eyesFill);
  const eyesStroke = useDerivedValue(() => frame.value.eyesStroke);
  const eyeStrokeWidth = useDerivedValue(() => frame.value.eyeStrokeWidth);
  const arm = useDerivedValue(() => frame.value.arm ?? Skia.PathBuilder.Make().build());
  const armOpacity = useDerivedValue(() => (frame.value.arm ? 1 : 0));
  const marks = useDerivedValue(() => frame.value.marks ?? Skia.PathBuilder.Make().build());
  const marksOpacity = useDerivedValue(() => frame.value.marksOpacity);
  const blush = useDerivedValue(() => frame.value.blush ?? Skia.PathBuilder.Make().build());
  const blushOpacity = useDerivedValue(() => (frame.value.blush ? 0.9 : 0));
  const shX = useDerivedValue(() => frame.value.shadowRect.x);
  const shY = useDerivedValue(() => frame.value.shadowRect.y);
  const shW = useDerivedValue(() => frame.value.shadowRect.width);
  const shH = useDerivedValue(() => frame.value.shadowRect.height);
  const shOpacity = useDerivedValue(() => frame.value.shadowOpacity);
  const eyeInk = useDerivedValue(() => interpolateColor(eyeRedSV ? eyeRedSV.value : 0, [0, 1], [base.eyes === 'heart' ? INK.heart : INK.eye, INK.angry]));
  const nbOpacity = useDerivedValue(() => frame.value.notebook.opacity);
  const nbBack = useDerivedValue(() => frame.value.notebook.back);
  const nbCover = useDerivedValue(() => frame.value.notebook.cover);
  const nbPageL = useDerivedValue(() => frame.value.notebook.pageL);
  const nbPageR = useDerivedValue(() => frame.value.notebook.pageR);
  const nbGutter = useDerivedValue(() => frame.value.notebook.gutter);
  const nbRules = useDerivedValue(() => frame.value.notebook.rules);
  const nbRulesWidth = useDerivedValue(() => frame.value.notebook.rulesWidth);
  const nbSpine = useDerivedValue(() => frame.value.notebook.spine);
  const nbFront = useDerivedValue(() => frame.value.notebook.front);
  const nbLabel = useDerivedValue(() => frame.value.notebook.label);
  const nbPagesL = useDerivedValue(() => frame.value.notebook.pagesL);
  const nbPagesShade = useDerivedValue(() => frame.value.notebook.pagesShade);
  const nbPagesR = useDerivedValue(() => frame.value.notebook.pagesR);
  const nbInk = useDerivedValue(() => frame.value.notebook.ink);
  const nbInkWidth = useDerivedValue(() => frame.value.notebook.inkWidth);
  const nbLead = useDerivedValue(() => frame.value.notebook.lead);
  const nbWood = useDerivedValue(() => frame.value.notebook.wood);
  const nbDark = useDerivedValue(() => frame.value.notebook.dark);
  const nbMid = useDerivedValue(() => frame.value.notebook.mid);
  const nbLight = useDerivedValue(() => frame.value.notebook.light);
  const nbEraser = useDerivedValue(() => frame.value.notebook.eraser);
  const nbHand = useDerivedValue(() => frame.value.notebook.hand);
  const bulbOpacity = useDerivedValue(() => frame.value.bulb.opacity);
  const bulbGlass = useDerivedValue(() => frame.value.bulb.glass);
  const bulbBase = useDerivedValue(() => frame.value.bulb.base);
  const bulbRays = useDerivedValue(() => frame.value.bulb.rays);
  const ringsOpacity = useDerivedValue(() => frame.value.rings.opacity);
  const ringsPath = useDerivedValue(() => frame.value.rings.rings);
  const ringsDots = useDerivedValue(() => frame.value.rings.dots);

  const hop = () => {
    const now = clock.value / 1000;
    // Ignore taps while he is still in the air.
    if (boopStart.value >= 0 && now - boopStart.value < LAND_AT) return;
    boopStart.set(now);
    if (quiet) return;
    Haptic.press();
    setTimeout(() => Haptic.miloLand(), LAND_AT * 1000);
  };

  const firstHop = useRef(true);
  useEffect(() => {
    if (firstHop.current) { firstHop.current = false; return; }
    hop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hopTrigger]);

  const firstWave = useRef(true);
  useEffect(() => {
    if (firstWave.current) { firstWave.current = false; return; }
    waveStart.set(clock.value / 1000);
    const id = setTimeout(() => { waveStart.set(-1); }, WAVE_TOTAL * 1000 + 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveTrigger]);

  const lens = useDerivedValue(() => {
    const c = camera?.transform.value;
    return c ? [{ translateX: c.translateX }, { translateY: c.translateY }, { scale: c.scale }] : [{ scale: 1 }];
  });
  const canvas = (
    <Canvas style={camera ? { width: camera.width, height: camera.height } : { width: CANVAS_UNITS.width * u, height: CANVAS_UNITS.height * u }}>
      {camera?.backdrop ? <Rect x={0} y={0} width={camera.width} height={camera.height} color={bodyColor} opacity={camera.backdrop} /> : null}
      <Group transform={lens}>
      <Oval x={shX} y={shY} width={shW} height={shH} color={INK.shadow} opacity={shOpacity}>
        <BlurMask blur={0.5 * u} style="normal" />
      </Oval>
      {/* The Aha body: body colour with the darker side plane over it, and his floating hand in the
          side colour. The studies: the band, with the arm in the body colour. */}
      <Path path={silhouette} color={under} />
      <Group clip={silhouette}>
        <Path path={face} color={bodyColor} />
        <Path path={plane} color={sideColor} opacity={planeOpacity} />
      </Group>
      <Path path={arm} color={data.plane ? sideColor : bodyColor} opacity={armOpacity} />
      <Path path={marks} color={sideColor} opacity={marksOpacity} style="stroke" strokeWidth={1.8 * u} strokeCap="round" />
      <Path path={blush} color={INK.blush} opacity={blushOpacity} />
      <Path path={eyesFill} color={eyeInk} />
      <Path path={eyesStroke} color={eyeInk} style="stroke" strokeWidth={eyeStrokeWidth} strokeCap="round" strokeJoin="round" />
      {/* The notebook, in the animator's colours: blue book, cream pages, yellow pencil, pink eraser. */}
      <Group opacity={nbOpacity}>
        <Path path={nbBack} color="#4977BA" />
        <Path path={nbPagesL} color="#EDE6D3" />
        <Path path={nbPagesShade} color="#E0D6BF" />
        <Path path={nbSpine} color="#2C62A3" />
        <Path path={nbPagesR} color="#EDE6D3" />
        <Path path={nbFront} color="#4977BA" />
        {/* Open for writing: cover, pages, the gutter's shade, faint rules, and the handwriting. */}
        {/* The held-open book: page edges behind the pencil, covers and spine in front of it. */}
        <Path path={nbPageL} color="#EDE6D3" />
        <Path path={nbPageR} color="#EDE6D3" />
        <Path path={nbRules} color="#D8CDB2" style="stroke" strokeWidth={nbRulesWidth} strokeCap="round" />
        <Path path={nbInk} color="#5E564A" style="stroke" strokeWidth={nbInkWidth} strokeCap="round" strokeJoin="round" />
        <Path path={nbLabel} color="#EDD288" />
        <Path path={nbHand} color={sideColor} />
        <Path path={nbDark} color="#E4B726" />
        <Path path={nbMid} color="#FECC2B" />
        <Path path={nbLight} color="#FED860" />
        <Path path={nbWood} color="#EDE6D3" />
        <Path path={nbLead} color={INK.eye} />
        <Path path={nbEraser} color="#FFC7EF" />
        <Path path={nbCover} color="#4977BA" />
        <Path path={nbGutter} color="#2C62A3" />
      </Group>
      {/* An idea: a bulb pops up over his head. */}
      <Group opacity={bulbOpacity}>
        <Path path={bulbGlass} color="#F1C93F" />
        <Path path={bulbGlass} color={INK.eye} style="stroke" strokeWidth={1.2 * u} strokeJoin="round" />
        <Path path={bulbBase} color={INK.eye} style="stroke" strokeWidth={1.4 * u} strokeCap="round" />
        <Path path={bulbRays} color={INK.eye} style="stroke" strokeWidth={1.3 * u} strokeCap="round" />
      </Group>
      {/* Overthinking: two rings spinning over his head. */}
      <Group opacity={ringsOpacity}>
        <Path path={ringsPath} color={INK.eye} style="stroke" strokeWidth={1.4 * u} strokeCap="round" strokeJoin="round" />
        <Path path={ringsDots} color={INK.eye} />
      </Group>
      {camera?.cover ? <Rect x={-5000} y={camera.coverY ?? 0} width={10000} height={10000} color={bodyColor} opacity={camera.cover} /> : null}
      </Group>
    </Canvas>
  );

  if (!tappable) return canvas;
  return (
    <Pressable onPress={hop} accessibilityRole="button" accessibilityLabel="Milo">
      {canvas}
    </Pressable>
  );
}
