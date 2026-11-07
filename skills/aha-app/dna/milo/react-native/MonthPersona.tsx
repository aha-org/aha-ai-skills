// Milo as a month persona (Manan's art). The body is exactly Milo's, so swapping between him and a
// persona is invisible; what changes is the face (cross-faded) and the accessories, which pop in and
// out from their own centre. `cur` is the month showing, `prev` the one leaving, and `t` goes 0 to 1
// (with a little overshoot) for each change. NEUTRAL is Milo's own face with no accessories: going
// from Milo to a persona is NEUTRAL to that month, and back.

import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { PERSONA_ART, PERSONA_BODY, PERSONA_FACES, PERSONA_PROP_CENTRES, PERSONA_PROPS } from './personas';

export type PersonaState = { cur: SharedValue<number>; prev: SharedValue<number>; t: SharedValue<number> };

/** Milo's plain face (July's is just his eyes), no accessories. */
export const NEUTRAL = 13;

type Props = {
  state: PersonaState;
  /** Width of his body, in points. The art around him scales with it. */
  bodyWidth: number;
};

/**
 * A transform origin in points. iOS misreads some percentage strings (it took a third value as a
 * z position and crashed), so native gets plain numbers; the web wants a string.
 */
function origin(x: number, y: number) {
  return Platform.OS === 'web' ? `${x.toFixed(2)}px ${y.toFixed(2)}px` : [x, y, 0];
}

/** The side of the square the art is drawn in, for a given body width. */
export const personaBox = (bodyWidth: number) => (PERSONA_ART.size * bodyWidth) / PERSONA_ART.bodyWidth;

/** Same breath as Milo's (period 3.8 s, depth 1.2%), so the hand-over from him is invisible. */
const BREATH_PERIOD = 3.8;
const BREATH_DEPTH = 0.012;

export function MonthPersona({ state, bodyWidth }: Props) {
  const box = personaBox(bodyWidth);
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.set(withRepeat(withTiming(1, { duration: (BREATH_PERIOD / 2) * 1000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [breath]);
  const bodyStyle = useAnimatedStyle(() => {
    const s = 1 + BREATH_DEPTH * breath.value;
    return { transform: [{ scaleX: 1 / Math.sqrt(s) }, { scaleY: s }] };
  });
  return (
    <Animated.View style={[{ width: box, height: box, transformOrigin: origin(box / 2, (box * PERSONA_ART.groundY) / PERSONA_ART.size) }, bodyStyle]}>
      <SvgXml xml={PERSONA_BODY} width={box} height={box} />
      <Face xml={PERSONA_FACES[6]} index={NEUTRAL} state={state} box={box} />
      {PERSONA_FACES.map((xml, i) => <Face key={i} xml={xml} index={i + 1} state={state} box={box} />)}
      {PERSONA_PROPS.map((xml, i) => <Prop key={i} xml={xml} index={i + 1} state={state} box={box} />)}
    </Animated.View>
  );
}

const Face = React.memo(function Face({ xml, index, state, box }: { xml: string; index: number; state: PersonaState; box: number }) {
  const style = useAnimatedStyle(() => {
    // The new face fades in over the old one, then the old one fades out underneath, so eyes the
    // two faces share never dip.
    const k = Math.min(1, Math.max(0, state.t.value * 1.6));
    const o = state.cur.value === index ? Math.min(1, k * 2) : state.prev.value === index ? 1 - Math.max(0, (k - 0.5) * 2) : 0;
    return { opacity: o };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, style]}>
      <View style={{ width: box, height: box }}><SvgXml xml={xml} width={box} height={box} /></View>
    </Animated.View>
  );
});

const Prop = React.memo(function Prop({ xml, index, state, box }: { xml: string; index: number; state: PersonaState; box: number }) {
  const c = PERSONA_PROP_CENTRES[index - 1];
  const style = useAnimatedStyle(() => {
    const t = state.t.value;
    if (state.cur.value === index) {
      // Pops in: grows from small with the spring's overshoot, fading in quickly.
      return { opacity: Math.min(1, Math.max(0, t * 2.5)), transform: [{ scale: 0.35 + 0.65 * t }] };
    }
    if (state.prev.value === index) {
      // Leaves faster than the new one arrives: shrinks away and fades.
      const k = Math.min(1, Math.max(0, t * 1.8));
      return { opacity: 1 - k, transform: [{ scale: 1 - 0.55 * k }] };
    }
    return { opacity: 0, transform: [{ scale: 1 }] };
  });
  return (
    <Animated.View pointerEvents="none"
      style={[{ position: 'absolute', left: 0, top: 0, width: box, height: box, transformOrigin: origin((box * c.x) / PERSONA_ART.size, (box * c.y) / PERSONA_ART.size) }, style]}>
      <SvgXml xml={xml} width={box} height={box} />
    </Animated.View>
  );
});
