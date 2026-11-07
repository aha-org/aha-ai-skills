// "You're booked" (Manan, 2026-10-29): after paying, this screen replaces the receipt. It is the
// grain study's booking screen (dna/grain/grain-study.html), the one moment in booking
// that earns a grain shape: one sharp sun turning at the top, two soft copies of it further back.
//   1. The copies drift in, out of focus.
//   2. The sun comes into focus, turning a little as it settles (10 fps, like the rest of the grain).
//   3. The title comes in line by line, then the rest rises in.
// Everything you tap stays flat. Eases only, never a spring.

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { Text } from '../ui/text';
import { C, F, LAYOUT } from '../theme';
import { Haptic } from '../haptics';
import { EASE } from '../timing';
import { AhaButton, PressScale, XIcon } from '../ui/kit';
import { GrainSun } from '../grain/GrainShape';

// Placeholder shapes for the example. In the team prototype these come from src/care/data.ts and src/booking/data.ts.
export type Pro = { name: string; gender?: 'woman' | 'man' };
export type Booking = { date: Date; inDays: number; time: string; minutes: number; mode: 'online' | 'in person'; pay: 'eap' | 'upi' | 'card'; fee: number };
const firstName = (p: Pro) => p.name.replace(/^(Dr\.?|Ms\.?|Mr\.?)\s+/i, '').split(' ')[0];
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Today", "Tomorrow", else "Thursday 30 October". */
function when(b: Booking) {
  if (b.inDays === 0) return 'Today';
  if (b.inDays === 1) return 'Tomorrow';
  return `${DAYS[b.date.getDay()]} ${b.date.getDate()} ${MONTHS[b.date.getMonth()]}`;
}

const rise = (ms: number) => FadeInDown.duration(600).delay(ms).easing(EASE.out);

export function Booked({ booking, pro, onDone }: { booking: Booking; pro: Pro; onDone: () => void }) {
  const [calendar, setCalendar] = useState(false);
  const name = firstName(pro);
  // The title already says who, so the line after it says she or he (their name if we don't know).
  const who = pro.gender === 'woman' ? 'She' : pro.gender === 'man' ? 'He' : name;
  useEffect(() => {
    // The moment it lands: as the sun comes into focus.
    const t = setTimeout(() => Haptic.success(), 600);
    return () => clearTimeout(t);
  }, []);
  const cost = booking.pay === 'eap' ? 'Covered by your EAP' : `${rupees(booking.fee)} paid by ${booking.pay === 'upi' ? 'UPI' : 'card'}`;
  const lines = ['You’re booked', `with ${name}`];
  const ups = [
    <Text key="sub" style={styles.sub}>{`${when(booking)} at ${booking.time}. ${who} will see you ${booking.mode === 'online' ? 'on a video call' : 'in person'}.`}</Text>,
    <View key="len" style={[styles.fact, { marginTop: 28 }]}><Text style={styles.factKey}>Session</Text><Text style={styles.factValue}>{`${booking.minutes} minutes`}</Text></View>,
    <View key="cost" style={styles.fact}><Text style={styles.factKey}>Cost</Text><Text style={styles.factValue}>{cost}</Text></View>,
  ];

  return (
    <Animated.View entering={FadeIn.duration(240)} style={{ flex: 1 }}>
      {/* The soft copies first, further back, then the sharp one. */}
      <View pointerEvents="none" style={[styles.at, { left: -40, top: 70 }]}><GrainSun size={150} blur={9} opacity={0.55} lines={false} delay={200} phase={1} /></View>
      <View pointerEvents="none" style={[styles.at, { left: 298, top: 262 }]}><GrainSun size={120} blur={12} opacity={0.45} lines={false} delay={200} phase={2.4} /></View>
      <View pointerEvents="none" style={[styles.at, { left: 85, top: 128 }]}><GrainSun size={220} delay={450} /></View>

      <PressScale onPress={onDone} style={styles.close} accessibilityLabel="Close">
        <XIcon color={C.contentPrimary} />
      </PressScale>

      <View style={styles.copy}>
        {lines.map((l, i) => (
          <Animated.Text key={l} entering={rise(1000 + i * 140)} style={styles.title}>{l}</Animated.Text>
        ))}
        {ups.map((u, i) => (
          <Animated.View key={i} entering={rise(1450 + i * 110)}>{u}</Animated.View>
        ))}
      </View>

      <Animated.View entering={rise(1450 + ups.length * 110)} style={styles.band}>
        {calendar ? <AddedToCalendar /> : <AhaButton title="Add to calendar" onPress={() => setCalendar(true)} />}
        <AhaButton kind="tertiary" title="Done" onPress={onDone} />
      </Animated.View>
    </Animated.View>
  );
}

/**
 * The success state (Manan, 2026-10-29): the button stays where it was and a thumbs up comes in
 * beside the words. It grows in from small while it tips up, gives one small nod, and the words
 * slide in after it. Eased, never a spring. The haptic lands with the nod.
 */
function AddedToCalendar() {
  const thumb = useSharedValue(0);
  const nod = useSharedValue(0);
  const words = useSharedValue(0);
  useEffect(() => {
    thumb.set(withTiming(1, { duration: 320, easing: EASE.out }));
    nod.set(withDelay(320, withSequence(withTiming(1, { duration: 140, easing: EASE.out }), withTiming(0, { duration: 220, easing: EASE.out }))));
    words.set(withDelay(120, withTiming(1, { duration: 320, easing: EASE.out })));
    const t = setTimeout(() => Haptic.success(), 330);
    return () => clearTimeout(t);
  }, [thumb, nod, words]);
  const thumbStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, thumb.value * 1.5),
    transform: [{ scale: 0.4 + 0.6 * thumb.value }, { rotate: `${-30 * (1 - thumb.value) - 12 * nod.value}deg` }],
  }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: words.value, transform: [{ translateX: -8 * (1 - words.value) }] }));
  return (
    <View accessibilityRole="text" accessibilityLabel="Added to your calendar" style={styles.added}>
      <Animated.Text style={[styles.thumb, thumbStyle]}>👍</Animated.Text>
      <Animated.Text style={[styles.addedText, wordStyle]}>Added to your calendar</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  added: {
    height: 52, borderRadius: 26, borderWidth: 1, borderColor: C.borderSelected, backgroundColor: C.backgroundSecondary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  thumb: { fontSize: 20, lineHeight: 24 },
  addedText: { fontFamily: F.medium, fontSize: 16, lineHeight: 20, color: C.contentPrimary },
  at: { position: 'absolute' },
  close: {
    position: 'absolute', top: LAYOUT.contentTop + 4, right: 20, width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: C.contentPrimary, alignItems: 'center', justifyContent: 'center',
  },
  copy: { position: 'absolute', left: 28, right: 28, top: 420 },
  title: { fontFamily: F.bold, fontSize: 34, lineHeight: 38, letterSpacing: -0.5, color: C.contentPrimary },
  sub: { marginTop: 12, fontFamily: F.regular, fontSize: 17, lineHeight: 25, color: C.contentSecondary },
  fact: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  factKey: { fontFamily: F.regular, fontSize: 15, lineHeight: 20, color: C.contentTertiary },
  factValue: { fontFamily: F.medium, fontSize: 15, lineHeight: 20, color: C.contentPrimary },
  band: { position: 'absolute', left: 20, right: 20, bottom: 34 + 6, gap: 6 },
});
