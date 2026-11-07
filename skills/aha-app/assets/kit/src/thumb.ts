// Where your finger is, anywhere in the app, in frame points (390 x 844). FitStage writes it from
// every touch; Milo reads it on the UI thread to look where your thumb goes and where you tap.

import { makeMutable } from 'react-native-reanimated';

export const thumb = {
  x: makeMutable(195),
  y: makeMutable(422),
  /** 1 while a finger is down. */
  on: makeMutable(0),
};
