// Every screen is laid out on the Figma frame: 390 x 844 points. Phones that aren't that size
// (most Androids, the bigger and smaller iPhones) get the same frame scaled evenly to fit, centred,
// with the page colour round it, so nothing is cut off or pushed out of place. On a 390 x 844
// iPhone the scale is 1 and nothing changes.
//
// The fit is measured from the physical screen, not the window: on Android the window shrinks when
// the keyboard opens, and the app mustn't shrink with it.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Dimensions, Platform, View, type ScaledSize } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from './theme';
import { thumb } from './thumb';

export const STAGE = { width: 390, height: 844 };

const ScaleContext = createContext(1);
/** How much the frame is scaled on this phone (screen points per frame point). */
export const useStageScale = () => useContext(ScaleContext);

// On the web the "screen" is the whole monitor, so the browser window is used there.
const WHICH = Platform.OS === 'web' ? 'window' : 'screen';

function useScreen() {
  const [screen, setScreen] = useState(() => Dimensions.get(WHICH));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', (d: { window: ScaledSize; screen: ScaledSize }) => setScreen(d[WHICH]));
    return () => sub.remove();
  }, []);
  return screen;
}

type Touchish = { nativeEvent: { pageX: number; pageY: number; touches?: ArrayLike<{ pageX: number; pageY: number }> } };

export function FitStage({ children }: { children: React.ReactNode }) {
  const { width, height: screenH } = useScreen();
  // Android draws edge to edge, under the system navigation bar (the 3 buttons on older phones,
  // the gesture pill on newer ones), so the frame is fitted above it, never behind it. The iPhone
  // frame already has the home indicator's room built in.
  const insets = useSafeAreaInsets();
  const height = screenH - (Platform.OS === 'android' ? insets.bottom : 0);
  const scale = Math.min(width / STAGE.width, height / STAGE.height) || 1;
  // Every touch, from anywhere inside, in frame points (it only listens: nothing is captured, so
  // buttons, scrolling and drawing work as before). Milo looks where your finger goes.
  const track = (e: Touchish) => {
    const t = e.nativeEvent.touches?.[0] ?? e.nativeEvent;
    thumb.x.set((t.pageX - (width / 2 - (STAGE.width / 2) * scale)) / scale);
    thumb.y.set((t.pageY - (height / 2 - (STAGE.height / 2) * scale)) / scale);
    thumb.on.set(1);
  };
  const lift = () => thumb.on.set(0);
  const listeners = Platform.OS === 'web'
    ? { onPointerDown: track, onPointerMove: (e: Touchish & { nativeEvent: { buttons?: number } }) => { if (e.nativeEvent.buttons) track(e); }, onPointerUp: lift, onPointerCancel: lift }
    : { onTouchStart: track, onTouchMove: track, onTouchEnd: lift, onTouchCancel: lift };
  return (
    <View style={{ flex: 1, backgroundColor: C.backgroundPrimary, overflow: 'hidden' }} {...listeners}>
      <ScaleContext.Provider value={scale}>
        <View style={{
          position: 'absolute', width: STAGE.width, height: STAGE.height,
          // Centred on the screen, then scaled about its own centre.
          left: (width - STAGE.width) / 2, top: (height - STAGE.height) / 2,
          transform: [{ scale }],
        }}>
          {children}
        </View>
      </ScaleContext.Provider>
    </View>
  );
}
