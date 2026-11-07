// A Pressable that feels like a real button (Manan, 2026-10-21): "tak" as your finger goes down and
// "tak" as it comes back up. Only buttons you can SEE being pressed get them (Manan: haptics go with
// a press state, never on their own): a style that changes with `pressed`, or `feel` for controls
// that draw their own press (a sink, a switch moving). `release` swaps the second haptic for another
// (a switch's toggle); `silent` turns both off (for things that make their own, like Milo).
import React from 'react';
import { Pressable, type PressableProps, type View } from 'react-native';
import { Haptic } from '../haptics';

type Props = PressableProps & { release?: () => void; silent?: boolean; feel?: boolean };

export const HapticPressable = React.forwardRef<React.ComponentRef<typeof View>, Props>(({ release, silent, feel, onPressIn, onPressOut, ...rest }, ref) => {
  const haptic = !silent && !rest.disabled && (feel || typeof rest.style === 'function');
  return (
    <Pressable
      ref={ref}
      {...rest}
      onPressIn={(e) => { if (haptic) Haptic.down(); onPressIn?.(e); }}
      onPressOut={(e) => { if (haptic) (release ?? Haptic.up)(); onPressOut?.(e); }}
    />
  );
});
HapticPressable.displayName = 'HapticPressable';
