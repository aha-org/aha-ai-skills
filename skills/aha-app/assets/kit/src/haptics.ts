// Every haptic, named by the moment it marks. Buttons are hard and crisp ("tak" down, "tak" up),
// never soft buzzes (Manan). This is the Expo-only version; the team prototype (aha-org/aha-app-prototype)
// adds a native Android module for crisper clicks on Android motors.
import * as Haptics from 'expo-haptics';

const I = Haptics.ImpactFeedbackStyle;
const quiet = () => {};
const impact = (style: Haptics.ImpactFeedbackStyle) => () => { Haptics.impactAsync(style).catch(quiet); };

export const Haptic = {
  /** A finger goes down on a button: tak (hard, short). */
  down: impact(I.Rigid),
  /** And comes back up: tak. */
  up: impact(I.Rigid),
  toggleOn: impact(I.Medium),
  toggleOff: impact(I.Light),
  /** Finger touches Milo. */
  press: impact(I.Light),
  /** Milo lands after a hop. */
  miloLand: impact(I.Soft),
  tap: impact(I.Light),
  select: () => { Haptics.selectionAsync().catch(quiet); },
  success: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(quiet); },
  error: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(quiet); },
  /** Something lands with weight (a sticker, Milo dropping in). */
  land: impact(I.Heavy),
  /** A word appears as Milo writes: a solid tuck. */
  word: impact(I.Rigid),
};
