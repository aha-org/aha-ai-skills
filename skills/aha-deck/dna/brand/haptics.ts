// Every haptic in the prototype, named by the moment it marks.
// Expo Haptics on iOS has no intensity setting, so each one uses the closest named strength
// to the SwiftUI version (its intensity is noted alongside).
//
// Android (the APK): each one plays a crisp click, tick or thud straight on the motor, at its own
// strength (modules/aha-haptics: composition primitives on good motors, predefined effects on the
// rest). The system's view haptics were used before, but Samsung leaves several of them silent and
// all of them are skipped when the phone's touch feedback is off, so a lot went missing.
// In Expo Go (no native module) Android falls back to those system haptics.
//
// Buttons (Manan, 2026-10-21): every press is two haptics, like a real button: "tak" as your finger
// goes down (`down`) and "tak" again as it comes back up (`up`). Both hard and short, never a soft
// buzz: iOS's rigid tap, and on Android the motor's crisp click primitive at full strength, then its
// tick (the sharpest, shortest one). See src/ui/press.tsx.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AhaHaptics, type HapticKind } from '../modules/aha-haptics';

const I = Haptics.ImpactFeedbackStyle;
const A = Haptics.AndroidHaptics;
const android = Platform.OS === 'android';

const quiet = () => {};
/** One haptic: the iOS feel; on Android a motor effect (kind, strength), or the closest system one. */
const feel = (ios: () => Promise<void>, kind: HapticKind, scale: number, fallback: Haptics.AndroidHaptics) => () => {
  if (!android) { ios().catch(quiet); return; }
  if (AhaHaptics) {
    try { AhaHaptics.play(kind, scale); } catch { /* no motor */ }
    return;
  }
  Haptics.performAndroidHapticsAsync(fallback).catch(quiet);
};
const impact = (style: Haptics.ImpactFeedbackStyle, kind: HapticKind, scale: number, fallback: Haptics.AndroidHaptics) =>
  feel(() => Haptics.impactAsync(style), kind, scale, fallback);
const selection = (kind: HapticKind, scale: number, fallback: Haptics.AndroidHaptics) => feel(() => Haptics.selectionAsync(), kind, scale, fallback);

export const Haptic = {
  // Buttons
  /** A finger goes down on a button: tak (hard, short). */
  down: impact(I.Rigid, 'click', 1, A.Virtual_Key),
  /** And comes back up: tak (a touch lighter, just as crisp). */
  up: impact(I.Rigid, 'tick', 1, A.Virtual_Key_Release),
  /** A switch turning on (a firm click) and off (a lighter one). */
  toggleOn: impact(I.Medium, 'click', 0.95, A.Toggle_On),
  toggleOff: impact(I.Light, 'tick', 0.75, A.Toggle_Off),

  // Milo
  /** Finger touches Milo (Swift: light 0.5). */
  press: impact(I.Light, 'tick', 0.6, A.Virtual_Key),
  /** Milo lands after a tap hop (Swift: soft 0.85). */
  miloLand: impact(I.Soft, 'thud', 0.7, A.Gesture_End),

  // Onboarding
  /** Buttons (Swift: light 0.6). */
  tap: impact(I.Light, 'click', 0.6, A.Virtual_Key),
  select: selection('tick', 0.8, A.Segment_Tick),
  success: feel(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 'double', 0.7, A.Confirm),
  error: feel(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error), 'heavy', 1, A.Reject),
  /** Milo's hand grabs the screen (Swift: rigid 0.7). */
  grab: impact(I.Rigid, 'click', 0.85, A.Drag_Start),
  /** The screen lifts as the hand picks it up (Swift: soft 0.6). */
  pickUp: impact(I.Soft, 'rise', 0.6, A.Gesture_Start),
  /** The screen is pulled away (Swift: soft 0.5). */
  whoosh: impact(I.Soft, 'lowTick', 0.6, A.Gesture_End),
  /** The hand slaps the sticker on (Swift: heavy 0.9). */
  slap: impact(I.Heavy, 'heavy', 1, A.Long_Press),
  /** Milo lands after dropping in (Swift: heavy 0.9). */
  land: impact(I.Heavy, 'thud', 1, A.Long_Press),
  /** A word appears as Milo writes his lines: a solid tuck, every word (Manan: solid, not soft). */
  word: impact(I.Rigid, 'click', 0.45, A.Keyboard_Tap),
  /** The pencil's down-stroke as Milo writes in his notebook (soft, like graphite on paper). */
  scribble: impact(I.Soft, 'lowTick', 0.5, A.Clock_Tick),
  /** The pencil's lighter up-stroke between down-strokes (the faintest tick there is). */
  scratch: selection('tick', 0.3, A.Text_Handle_Move),
  /** A sticker lands on the welcome (Swift: medium 0.75). */
  stick: impact(I.Medium, 'click', 0.85, A.Context_Click),
  /** One of the angry ticks when Milo is pressed too hard (the long-press Easter egg). */
  grrr: impact(I.Heavy, 'thud', 1, A.Context_Click),
  /** The receipt printer: each piece of paper coming out, a solid "tuck" (crisp, short, felt). */
  feed: impact(I.Rigid, 'click', 0.7, A.Clock_Tick),
  /** The printer's motor catching before the first step. */
  engage: impact(I.Rigid, 'click', 0.7, A.Keyboard_Tap),
  /** Continue arrives, the last thing on the welcome (Swift: medium 1.0). */
  ready: impact(I.Medium, 'click', 1, A.Context_Click),
};
