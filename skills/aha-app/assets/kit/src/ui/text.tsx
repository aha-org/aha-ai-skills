// Text and TextInput for the whole app, with the phone's font-size setting turned off.
// Every screen is laid out on the fixed 390 x 844 frame (see stage.tsx), so text has to stay the
// size it was designed at: on a phone set to large text (common on Samsungs) the words grew, wrapped
// onto extra lines and pushed the buttons into each other.
//
// On Android two more things, so text sits exactly where it does on the iPhone and in Figma:
// no extra font padding above and below each line (Android adds it by default, which pushes every
// label down a few points and makes buttons look off-centre), and simple line breaking (the same
// breaks as iOS, and quicker to lay out on older phones).
import React from 'react';
import { Platform, Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps } from 'react-native';

const ANDROID = Platform.OS === 'android';
const ANDROID_TEXT = ANDROID ? { includeFontPadding: false } : null;

export const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>((props, ref) => (
  <RNText ref={ref} allowFontScaling={false} textBreakStrategy={ANDROID ? 'simple' : undefined} {...props} style={[ANDROID_TEXT, props.style]} />
));
Text.displayName = 'Text';

export const TextInput = React.forwardRef<React.ComponentRef<typeof RNTextInput>, TextInputProps>((props, ref) => (
  <RNTextInput ref={ref} allowFontScaling={false} {...props} style={[ANDROID_TEXT, props.style]} />
));
TextInput.displayName = 'TextInput';
// Lets `useRef<TextInput>` keep working where the type is used (a value and a type, on purpose).
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TextInput = React.ComponentRef<typeof RNTextInput>;
