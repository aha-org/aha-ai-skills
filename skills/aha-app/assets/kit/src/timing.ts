// All durations in one place (ms), so haptics can be scheduled from the same numbers.
// UI eases, never springs (Manan: bounces read childish on a calm wellness app). Milo's own hops are the exception.
import { Easing } from 'react-native-reanimated';

export const EASE = {
  inOut: Easing.bezier(0.42, 0, 0.58, 1),
  out: Easing.bezier(0, 0, 0.58, 1),
  in: Easing.bezier(0.42, 0, 1, 1),
};

export const MS = {
  press: 120,     // a button pressing in
  rise: 600,      // a line of text rising into place
  stagger: 140,   // between lines
  screen: 240,    // a screen fading in
};
